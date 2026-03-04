import supabase from "../config/supabaseClient.js";
import { safeJsonParse, uploadImage } from "../utils/enrollHelper.js";

export const newEnroll = async (req, res) => {
  const uploadedFiles = [];

  try {
    /* ================= ตรวจสอบข้อมูลพื้นฐาน ================= */
    const accountType = req.body.accountType;
    const account_id = req.body.account_id;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบ tutor account"
      });
    }

    /* ================= แปลง JSON ================= */
    const parent = safeJsonParse(req.body.parent);
    const student = safeJsonParse(req.body.student);
    const enrollment = safeJsonParse(req.body.enrollment);

    /* ================= ตรวจสอบความถูกต้องของข้อมูล ================= */

    // ตรวจสอบข้อมูลนักเรียน
    if (!student.nickname || student.nickname.trim() === "") {
      throw new Error("กรุณากรอกชื่อเล่น");
    }

    if (!student.birthdate) {
      throw new Error("กรุณากรอกวันเกิด");
    }

    // ตรวจสอบข้อมูลคอร์ส
    if (!enrollment.course_id) {
      throw new Error("กรุณาเลือกคอร์ส");
    }

    if (!enrollment.start_date) {
      throw new Error("กรุณาเลือกวันที่เริ่มเรียน");
    }

    // ตรวจสอบข้อมูลผู้ปกครองตามประเภทบัญชี
    if (accountType === "hasAccount") {
      if (!parent.email || parent.email.trim() === "") {
        throw new Error("กรุณากรอกอีเมลผู้ปกครอง");
      }
    } else {
      if (!parent.fname || parent.fname.trim() === "") {
        throw new Error("กรุณากรอกชื่อผู้ปกครอง");
      }

      if (!parent.email || parent.email.trim() === "") {
        throw new Error("กรุณากรอกอีเมลผู้ปกครอง");
      }

      const hasContact =
        (parent.tel && parent.tel.trim() !== "") ||
        (parent.line_id && parent.line_id.trim() !== "") ||
        (parent.fb_name && parent.fb_name.trim() !== "");

      if (!hasContact) {
        throw new Error("กรุณากรอกช่องทางติดต่ออย่างน้อย 1 ช่องทาง");
      }
    }

    // ตรวจสอบ schedules (ถ้ามีให้ตรวจสอบความถูกต้อง แต่ไม่บังคับ)
    if (enrollment.schedules && !Array.isArray(enrollment.schedules)) {
      throw new Error("รูปแบบเวลาเรียนไม่ถูกต้อง");
    }

    // ถ้ามี schedules ให้ตรวจสอบความถูกต้องของแต่ละรายการ
    if (enrollment.schedules && enrollment.schedules.length > 0) {
      enrollment.schedules.forEach((s, i) => {
        if (!s.dayofweek || !s.start_time || !s.end_time) {
          throw new Error(`ข้อมูลเวลาเรียนไม่ครบ (รายการที่ ${i + 1})`);
        }
      });
    }
    /* ================= ตรวจสอบความว่างของติวเตอร์ (เพิ่มเติม) ================= */
    if (enrollment.schedules && enrollment.schedules.length > 0) {
      const availabilityRes = await supabase.rpc(
        "check_tutor_availability",
        {
          p_tutor_id: account_id, // หรือต้องหา tutor_id จริงๆ
          p_schedules: enrollment.schedules
        }
      );

      if (availabilityRes.error) throw availabilityRes.error;

      if (availabilityRes.data && availabilityRes.data.has_conflict) {
        const conflictMessages = availabilityRes.data.conflicts.map(c =>
          `วัน${c.day_thai} เวลา ${c.start_time} - ${c.end_time} (มีคาบกับ ${c.student_name})`
        );
        throw new Error(
          "ไม่สามารถลงทะเบียนได้เนื่องจากช่วงเวลาต่อไปนี้ไม่ว่าง:\n" +
          conflictMessages.join("\n")
        );
      }
    }

    /* ================= อัปโหลดรูปภาพ ================= */
    const studentUpload = await uploadImage(
      req.files?.studentImage?.[0],
      "student_images",
      "default_student_image.png"
    );

    const bookUpload = await uploadImage(
      req.files?.bookImage?.[0],
      "book_images",
      "default_book_image.png"
    );

    if (studentUpload.path) uploadedFiles.push(studentUpload.path);
    if (bookUpload.path) uploadedFiles.push(bookUpload.path);

    student.student_picture = studentUpload.url;

    // เตรียมข้อมูล book (ถ้ามี)
    let bookData = null;
    if (enrollment.book_name || req.files?.bookImage?.[0]) {
      bookData = {
        book_name: enrollment.book_name || null,
        book_image: bookUpload.url
      };
    }

    /* ================= เรียกใช้ RPC Function ================= */
    const { data, error } = await supabase.rpc(
      "new_enroll_transaction",
      {
        p_account_type: accountType,
        p_parent: parent,
        p_student: student,
        p_enrollment: {
          course_id: enrollment.course_id,
          start_date: enrollment.start_date,
          parent_need: enrollment.parent_need || null,
          book_data: bookData,
          schedules: enrollment.schedules || []
        },
        p_account_id: account_id
      }
    );

    if (error) {
      console.error("RPC Error:", error);
      throw new Error(error.message);
    }

    /* ================= ส่งผลลัพธ์กลับ ================= */
    res.json({
      success: true,
      enrollment_id: data
    });

  } catch (err) {
    /* ================= ลบรูปภาพที่อัปโหลดแล้วถ้าเกิด error ================= */
    if (uploadedFiles.length) {
      await supabase.storage
        .from("images")
        .remove(uploadedFiles)
        .catch(console.error);
    }

    console.error("NEW ENROLL ERROR:", err);

    res.status(400).json({
      success: false,
      message: err.message || "เกิดข้อผิดพลาดในการลงทะเบียน"
    });
  }
};


export const checkAvailability = async (req, res) => {
  try {
    const { tutor_id, schedules } = req.body;

    if (!tutor_id) {
      return res.status(400).json({
        success: false,
        error: "tutor_id is required"
      });
    }

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.json({
        success: true,
        has_conflict: false,
        conflicts: []
      });
    }

    const { data, error } = await supabase.rpc(
      "check_tutor_availability",
      {
        p_tutor_id: tutor_id,
        p_schedules: schedules
      }
    );

    if (error) throw error;

    res.json({
      success: true,
      ...data
    });
  } catch (err) {
    console.error("Check availability error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/*enroll by parent*/ 
export const getParentByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "get_parent_by_email",
      { p_email: email }
    );

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบข้อมูลผู้ปกครอง"
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Get parent error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const getStudentsByParent = async (req, res) => {
  try {
    const { parentId } = req.params;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        error: "Parent ID is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "get_students_by_parent",
      { p_parent_id: parentId }
    );

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Get students error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};