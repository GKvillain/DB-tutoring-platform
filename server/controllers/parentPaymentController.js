import supabase from "../config/supabaseClient.js";

// ดึงประวัติการชำระเงินของนักเรียน
export const getStudentPaymentHistory = async (req, res) => {
  try {
    const { student_id, course_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    console.log("Fetching payment history for student:", student_id);

    // 1. ดึง enrollment ของนักเรียน
    let enrollmentQuery = supabase
      .from("enrollment")
      .select(`
        enrollment_id,
        course:course_id (
          course_id,
          course_name_thai,
          course_name_eng,
          price
        )
      `)
      .eq("student_id", student_id);

    if (course_id && course_id !== "all") {
      enrollmentQuery = enrollmentQuery.eq("course_id", course_id);
    }

    const { data: enrollments, error: enrollError } = await enrollmentQuery;

    if (enrollError) {
      console.error("Enrollment error:", enrollError);
      throw enrollError;
    }
    
    console.log("Enrollments found:", enrollments?.length || 0);

    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }

    const enrollmentIds = enrollments.map(e => e.enrollment_id);

    // 2. ดึง class sessions และ enrollmentschedule เพื่อคำนวณชั่วโมง
    const { data: sessions, error: sessionError } = await supabase
      .from("classsession")
      .select(`
        session_id,
        session_date,
        enrollment_id,
        learningrecords (
          attendance_id
        ),
        enrollment!inner (
          enrollmentschedule (
            start_time,
            end_time
          )
        )
      `)
      .in("enrollment_id", enrollmentIds);

    if (sessionError) {
      console.error("Session error:", sessionError);
      throw sessionError;
    }

    // 3. ดึง attendance IDs
    const attendanceIds = sessions
      .flatMap(s => s.learningrecords || [])
      .map(lr => lr.attendance_id)
      .filter(id => id);

    console.log("Attendance IDs found:", attendanceIds.length);

    // 4. ดึง attendance status จาก attendancedetail
    let attendanceStatusMap = {};
    if (attendanceIds.length > 0) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendancedetail")
        .select("attendance_id, attendance_status")
        .in("attendance_id", attendanceIds);

      if (attendanceError) {
        console.error("Attendance error:", attendanceError);
        throw attendanceError;
      }

      attendanceStatusMap = (attendanceData || []).reduce((acc, item) => {
        acc[item.attendance_id] = item.attendance_status;
        return acc;
      }, {});
    }

    // 5. ฟังก์ชันคำนวณจำนวนชั่วโมงจาก start_time และ end_time
    const calculateHours = (startTime, endTime) => {
      if (!startTime || !endTime) return 0;
      
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startTotal = startHour * 60 + (startMinute || 0);
      const endTotal = endHour * 60 + (endMinute || 0);
      
      return (endTotal - startTotal) / 60; // แปลงเป็นชั่วโมง
    };

    // 6. จัดกลุ่ม sessions ตามเดือนและคำนวณชั่วโมงรวม
    const sessionsByMonth = {};
    
    sessions.forEach(session => {
      if (!session.session_date) return;
      
      const date = new Date(session.session_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
      
      // ตรวจสอบสถานะการเข้าเรียน
      let isAttended = false;
      let sessionHours = 0;
      
      // คำนวณชั่วโมงจาก enrollmentschedule
      if (session.enrollment?.enrollmentschedule && session.enrollment.enrollmentschedule.length > 0) {
        const schedule = session.enrollment.enrollmentschedule[0];
        sessionHours = calculateHours(schedule.start_time, schedule.end_time);
      }
      
      if (session.learningrecords && session.learningrecords.length > 0) {
        const attendanceId = session.learningrecords[0]?.attendance_id;
        const status = attendanceStatusMap[attendanceId];
        isAttended = (status === 'Present' || status === 'Late');
      }

      if (!sessionsByMonth[monthKey]) {
        sessionsByMonth[monthKey] = {
          monthKey,
          monthName,
          sessions: [],
          count: 0,
          attendedHours: 0,
          attendedCount: 0
        };
      }
      
      sessionsByMonth[monthKey].sessions.push(session);
      sessionsByMonth[monthKey].count++;
      if (isAttended) {
        sessionsByMonth[monthKey].attendedCount++;
        sessionsByMonth[monthKey].attendedHours += sessionHours;
      }
    });

    // 7. ดึง payment และ paymentdetail
    const { data: payments, error: paymentError } = await supabase
      .from("payment")
      .select(`
        payment_id,
        enrollment_id,
        paymentdetail (
          payment_detail_id,
          payment_paid_date,
          payment_status,
          payment_bill_date,
          price,
          amount
        )
      `)
      .in("enrollment_id", enrollmentIds);

    if (paymentError) {
      console.error("Payment error:", paymentError);
      throw paymentError;
    }

    console.log("Payments found:", payments?.length || 0);

    // 8. จัดรูปแบบข้อมูล
    const result = enrollments.map(enrollment => {
      const course = enrollment.course;
      const enrollmentPayments = payments?.filter(p => p.enrollment_id === enrollment.enrollment_id) || [];
      
      const pricePerHour = course?.price || 0; // ราคาต่อชั่วโมง
      const monthlyPayments = [];

      enrollmentPayments.forEach(payment => {
        if (payment.paymentdetail && payment.paymentdetail.length > 0) {
          payment.paymentdetail.forEach(detail => {
            if (detail.payment_bill_date) {
              const billDate = new Date(detail.payment_bill_date);
              const monthKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`;
              const monthName = billDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
              
              const monthSessions = sessionsByMonth[monthKey] || { attendedHours: 0, attendedCount: 0 };
              
              // ปัดเศษทศนิยม 1 ตำแหน่ง
              const totalHours = Math.round(monthSessions.attendedHours * 10) / 10;
              const totalAmount = pricePerHour * monthSessions.attendedHours;
              
              monthlyPayments.push({
                month: monthName,
                monthKey,
                hours: totalHours, // จำนวนชั่วโมง
                sessionsCount: monthSessions.attendedCount, // เก็บจำนวนคาบไว้ด้วย (เผื่อใช้)
                pricePerHour,
                totalAmount: Math.round(totalAmount * 100) / 100, // ปัดเศษ 2 ตำแหน่ง
                billDate: detail.payment_bill_date,
                paidDate: detail.payment_paid_date,
                status: detail.payment_status || 'pending',
                amount: detail.amount || monthSessions.attendedCount,
                paymentDetailId: detail.payment_detail_id
              });
            }
          });
        }
      });

      // เรียงตามเดือนล่าสุด
      monthlyPayments.sort((a, b) => new Date(b.billDate) - new Date(a.billDate));

      return {
        enrollment_id: enrollment.enrollment_id,
        course_id: course?.course_id,
        course_name: course?.course_name_thai,
        course_name_eng: course?.course_name_eng,
        price_per_hour: pricePerHour,
        payments: monthlyPayments
      };
    });

    console.log("Sending result with", result.length, "enrollments");
    res.json(result);

  } catch (err) {
    console.error("Error fetching payment history:", err);
    res.status(500).json({ error: err.message });
  }
};

// ดึงรายชื่อคอร์สของนักเรียน
export const getStudentCourses = async (req, res) => {
  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    const { data, error } = await supabase
      .from("enrollment")
      .select(`
        enrollment_id,
        course:course_id (
          course_id,
          course_name_thai,
          course_name_eng
        )
      `)
      .eq("student_id", student_id);

    if (error) {
      console.error("Error fetching student courses:", error);
      throw error;
    }

    const formatted = (data || []).map(item => ({
      course_id: item.course?.course_id,
      course_name: item.course?.course_name_thai,
      course_name_eng: item.course?.course_name_eng
    })).filter(c => c.course_id);

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching student courses:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ดึงรายการที่ค้างชำระของนักเรียน
export const getPendingPayments = async (req, res) => {
  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    console.log("Fetching pending payments for student:", student_id);

    // 1. ดึง enrollment ของนักเรียน
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollment")
      .select(`
        enrollment_id,
        course:course_id (
          course_id,
          course_name_thai,
          course_name_eng,
          price
        ),
        tutor:tutor_id (
          tutor_id,
          account:account_id (
            fname,
            lname
          ),
          bank_id
        )
      `)
      .eq("student_id", student_id);

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }

    const enrollmentIds = enrollments.map(e => e.enrollment_id);

    // 2. ดึง payment และ paymentdetail เพื่อดูรายการที่ยังไม่จ่าย
    const { data: payments, error: paymentError } = await supabase
      .from("payment")
      .select(`
        payment_id,
        enrollment_id,
        paymentdetail (
          payment_detail_id,
          payment_paid_date,
          payment_status,
          payment_bill_date,
          price,
          amount
        )
      `)
      .in("enrollment_id", enrollmentIds);

    if (paymentError) throw paymentError;

    // 3. กรองเอาเฉพาะ paymentdetail ที่สถานะเป็น pending
    const pendingByEnrollment = {};

    payments?.forEach(payment => {
      if (payment.paymentdetail) {
        payment.paymentdetail.forEach(detail => {
          if (detail.payment_status === 'pending' || 
              detail.payment_status === 'unpaid' || 
              !detail.payment_paid_date) {
            
            if (!pendingByEnrollment[payment.enrollment_id]) {
              pendingByEnrollment[payment.enrollment_id] = [];
            }
            
            if (detail.payment_bill_date) {
              const billDate = new Date(detail.payment_bill_date);
              const monthKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`;
              const monthName = billDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
              
              pendingByEnrollment[payment.enrollment_id].push({
                payment_detail_id: detail.payment_detail_id,
                monthKey,
                monthName,
                amount: detail.amount || detail.price || 0,
                billDate: detail.payment_bill_date,
                status: detail.payment_status
              });
            }
          }
        });
      }
    });

    // 4. จัดรูปแบบข้อมูล
    const result = [];

    enrollments.forEach(enrollment => {
      const course = enrollment.course;
      const tutor = enrollment.tutor;
      const pendingItems = pendingByEnrollment[enrollment.enrollment_id] || [];

      if (pendingItems.length > 0) {
        pendingItems.sort((a, b) => b.monthKey.localeCompare(a.monthKey));

        result.push({
          enrollment_id: enrollment.enrollment_id,
          course: {
            id: course?.course_id,
            name: course?.course_name_thai,
            nameEng: course?.course_name_eng,
            pricePerHour: course?.price || 0
          },
          tutor: {
            id: tutor?.tutor_id,
            name: tutor?.account ? 
              `${tutor.account.fname || ''} ${tutor.account.lname || ''}`.trim() : 
              'ไม่ระบุ',
            bank_id: tutor?.bank_id
          },
          pendingMonths: pendingItems
        });
      }
    });

    console.log("Found pending payments:", result.length);
    res.json(result);

  } catch (err) {
    console.error("Error fetching pending payments:", err);
    res.status(500).json({ error: err.message });
  }
};

// ดึงข้อมูลธนาคารสำหรับการชำระเงิน
export const getBankInfo = async (req, res) => {
  try {
    const { bank_id } = req.query;

    if (!bank_id) {
      return res.status(400).json({ error: "bank_id is required" });
    }

    const { data, error } = await supabase
      .from("bank")
      .select(`
        bank_id,
        bank_account_name,
        qr_image
      `)
      .eq("bank_id", bank_id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching bank info:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// สร้างรายการชำระเงินใหม่ (แบบไม่มีสลิป)
export const createPayment = async (req, res) => {
  try {
    const { enrollment_id, monthKey } = req.body;

    if (!enrollment_id || !monthKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Creating payment for enrollment:", enrollment_id, "month:", monthKey);

    // 1. ดึงข้อมูล enrollment เพื่อเอาราคาต่อชั่วโมง
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollment")
      .select(`
        enrollment_id,
        course:course_id (
          price
        )
      `)
      .eq("enrollment_id", enrollment_id)
      .single();

    if (enrollError) throw enrollError;
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const pricePerHour = enrollment.course?.price || 0;

    // 2. ดึง class sessions ของเดือนนั้น
    const [year, month] = monthKey.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0];

    const { data: sessions, error: sessionError } = await supabase
      .from("classsession")
      .select(`
        session_id,
        session_date,
        learningrecords (
          attendance_id
        ),
        enrollment!inner (
          enrollmentschedule (
            start_time,
            end_time
          )
        )
      `)
      .eq("enrollment_id", enrollment_id)
      .gte("session_date", startDate)
      .lte("session_date", endDate);

    if (sessionError) throw sessionError;

    // 3. ดึง attendance IDs
    const attendanceIds = sessions
      .flatMap(s => s.learningrecords || [])
      .map(lr => lr.attendance_id)
      .filter(id => id);

    // 4. ดึง attendance status
    let attendanceStatusMap = {};
    if (attendanceIds.length > 0) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendancedetail")
        .select("attendance_id, attendance_status")
        .in("attendance_id", attendanceIds);

      if (!attendanceError && attendanceData) {
        attendanceStatusMap = attendanceData.reduce((acc, item) => {
          acc[item.attendance_id] = item.attendance_status;
          return acc;
        }, {});
      }
    }

    // 5. ฟังก์ชันคำนวณชั่วโมง
    const calculateHours = (startTime, endTime) => {
      if (!startTime || !endTime) return 0;
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const startTotal = startHour * 60 + (startMinute || 0);
      const endTotal = endHour * 60 + (endMinute || 0);
      return (endTotal - startTotal) / 60;
    };

    // 6. คำนวณชั่วโมงที่เรียนจริงในเดือนนั้น
    let totalHours = 0;
    sessions.forEach(session => {
      let isAttended = false;
      let sessionHours = 0;

      if (session.enrollment?.enrollmentschedule?.length > 0) {
        const schedule = session.enrollment.enrollmentschedule[0];
        sessionHours = calculateHours(schedule.start_time, schedule.end_time);
      }

      if (session.learningrecords?.length > 0) {
        const attendanceId = session.learningrecords[0]?.attendance_id;
        const status = attendanceStatusMap[attendanceId];
        isAttended = (status === 'Present' || status === 'Late');
      }

      if (isAttended) {
        totalHours += sessionHours;
      }
    });

    // 7. คำนวณยอดชำระ
    const totalAmount = pricePerHour * totalHours;

    // 8. สร้าง payment ใหม่
    const { data: payment, error: paymentError } = await supabase
      .from("payment")
      .insert([{ enrollment_id }])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 9. สร้าง payment detail
    const { error: detailError } = await supabase
      .from("paymentdetail")
      .insert([{
        payment_id: payment.payment_id,
        payment_bill_date: new Date(),
        payment_status: 'pending',
        price: totalAmount,
        amount: totalHours
      }]);

    if (detailError) throw detailError;

    res.json({ 
      success: true, 
      payment_id: payment.payment_id,
      totalHours: totalHours,
      totalAmount: totalAmount,
      message: "สร้างรายการชำระเงินสำเร็จ" 
    });

  } catch (err) {
    console.error("Error creating payment:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// อัปโหลดสลิปการชำระเงิน
export const uploadPaymentSlip = async (req, res) => {
  try {
    console.log("Received slip upload request");
    console.log("File:", req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: "กรุณาเลือกรูปภาพสลิป" });
    }

    const { enrollment_id, monthKey, payment_detail_id } = req.body;
    
    if (!enrollment_id || !monthKey) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
    }

    // อัปโหลดไปยัง Supabase Storage ในโฟลเดอร์ slip_images
    const file = req.file;
    const filePath = `slip_images/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    const slipUrl = publicUrlData.publicUrl;

    // ถ้ามี payment_detail_id ให้อัปเดต slip_picture ทันที
    if (payment_detail_id) {
      const { error: updateError } = await supabase
        .from("paymentdetail")
        .update({ slip_picture: slipUrl })
        .eq("payment_detail_id", payment_detail_id);

      if (updateError) {
        console.error("Error updating slip_picture:", updateError);
        // ไม่ throw error เพื่อให้ยังส่ง URL กลับไปได้
      }
    }

    res.json({ 
      success: true, 
      slipUrl: slipUrl,
      message: "อัปโหลดสลิปสำเร็จ"
    });

  } catch (err) {
    console.error("Upload slip error:", err);
    res.status(500).json({ error: err.message });
  }
};

// สร้าง payment และอัปเดต slip_picture (แก้ไข)
export const createPaymentWithSlip = async (req, res) => {
  try {
    const { enrollment_id, monthKey, slip_url } = req.body;

    if (!enrollment_id || !monthKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Creating payment for enrollment:", enrollment_id, "month:", monthKey);

    // 1. ตรวจสอบว่ามี payment detail ที่ต้องการอยู่แล้วหรือไม่
    const { data: existingPayments, error: searchError } = await supabase
      .from("payment")
      .select(`
        payment_id,
        paymentdetail!inner (
          payment_detail_id,
          payment_bill_date,
          payment_status,
          price,
          amount
        )
      `)
      .eq("enrollment_id", enrollment_id);

    if (searchError) throw searchError;

    // 2. หา payment detail ของเดือนนั้น
    let targetPaymentDetail = null;
    let targetPaymentId = null;

    existingPayments?.forEach(payment => {
      payment.paymentdetail?.forEach(detail => {
        if (detail.payment_bill_date) {
          const billDate = new Date(detail.payment_bill_date);
          const detailMonthKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (detailMonthKey === monthKey) {
            targetPaymentDetail = detail;
            targetPaymentId = payment.payment_id;
          }
        }
      });
    });

    // 3. ถ้าไม่มี ให้สร้างใหม่ (เผื่อกรณี)
    if (!targetPaymentDetail) {
      return res.status(404).json({ error: "ไม่พบรายการชำระเงินสำหรับเดือนนี้" });
    }

    // 4. วันที่ปัจจุบัน
    const today = new Date();
    const paidDate = today.toISOString().split('T')[0]; // รูปแบบ YYYY-MM-DD

    // 5. อัปเดต payment detail ที่มีอยู่แล้ว
    const { data: updatedDetail, error: updateError } = await supabase
      .from("paymentdetail")
      .update({
        payment_paid_date: paidDate,
        payment_status: 'PAID',
        slip_picture: slip_url || null
      })
      .eq("payment_detail_id", targetPaymentDetail.payment_detail_id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log("Updated payment detail:", updatedDetail);

    res.json({ 
      success: true, 
      payment_id: targetPaymentId,
      payment_detail_id: targetPaymentDetail.payment_detail_id,
      paid_date: paidDate,
      message: "ชำระเงินสำเร็จ" 
    });

  } catch (err) {
    console.error("Error creating payment:", err.message);
    res.status(500).json({ error: err.message });
  }
};