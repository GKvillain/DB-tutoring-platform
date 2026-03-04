import supabase from "../config/supabaseClient.js";

export const uploadStudentImage = async (req, res) => {
  try {
    console.log("Received upload request");
    console.log("File:", req.file); // ดูว่าได้ไฟล์หรือไม่
    
    if (!req.file) {
      return res.status(400).json({ error: "กรุณาเลือกรูปภาพ" });
    }

    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({ error: "ไม่พบ student_id" });
    }

    // อัปโหลดไปยัง Supabase Storage
    const file = req.file;
    const filePath = `student_images/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

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

    const imageUrl = publicUrlData.publicUrl;

    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      message: "อัปโหลดรูปภาพสำเร็จ"
    });

  } catch (err) {
    console.error("Upload image error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getStudentInfo = async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabase
      .from("student")
      .select(`
        student_id,
        student_fname,
        student_lname,
        student_nickname,
        school,
        student_picture,
        birthdate
      `)
      .eq("student_id", studentId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Fetch student error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const editStudentInfo = async (req, res) => {
  try {
    const {
      student_id,
      student_fname,
      student_lname,
      student_nickname,
      school,
      student_grade_level,
      birthdate,
      student_picture
    } = req.body;

    if (!student_id || !student_fname || !student_lname) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const updateData = {
      student_fname,
      student_lname,
      student_nickname: student_nickname || null,
      school: school || null,
      birthdate: birthdate || null,
      student_picture: student_picture || null
    };

    if (student_grade_level) {
      updateData.student_grade_level = student_grade_level;
    }

    const { data, error } = await supabase
      .from("student")
      .update(updateData)
      .eq("student_id", student_id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    res.json({
      success: true,
      message: "อัปเดตข้อมูลสำเร็จ",
      data
    });

  } catch (err) {
    console.error("Update student error:", err.message);
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

// สร้าง payment และอัปเดต slip_picture
export const createPaymentWithSlip = async (req, res) => {
  try {
    const { enrollment_id, monthKey, slip_url } = req.body;

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

    // 9. สร้าง payment detail พร้อม slip_picture
    const { data: paymentDetail, error: detailError } = await supabase
      .from("paymentdetail")
      .insert([{
        payment_id: payment.payment_id,
        payment_bill_date: new Date(),
        payment_status: 'pending',
        price: totalAmount,
        amount: totalHours,
        slip_picture: slip_url || null  // เก็บ URL สลิป
      }])
      .select()
      .single();

    if (detailError) throw detailError;

    res.json({ 
      success: true, 
      payment_id: payment.payment_id,
      payment_detail_id: paymentDetail.payment_detail_id,
      totalHours: totalHours,
      totalAmount: totalAmount,
      message: "สร้างรายการชำระเงินสำเร็จ" 
    });

  } catch (err) {
    console.error("Error creating payment:", err.message);
    res.status(500).json({ error: err.message });
  }
};