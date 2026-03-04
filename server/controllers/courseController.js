import supabase from "../config/supabaseClient.js";
import { uploadImage } from "../utils/enrollHelper.js";

export const getCourses = async (req, res) => {
  try {
    const { tutorId } = req.query;

    const { data, error } = await supabase.rpc(
      "get_courses",
      { p_tutor_id: tutorId || null }
    );

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch courses error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const { role, account_id } = req.query;

    let tutorId = null;

    if (role === "T") {
      if (!account_id) {
        return res.status(400).json({ error: "account_id is required for tutor" });
      }

      const { data: tutorId_result, error: tutorError } = await supabase.rpc(
        "get_tutor_id",
        { p_account_id: account_id }
      );

      if (tutorError || !tutorId_result) {
        return res.status(404).json({ error: "Tutor not found" });
      }

      tutorId = tutorId_result;
    }

    const { data, error } = await supabase.rpc(
      "get_courses",
      { p_tutor_id: tutorId }
    );

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch courses error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const addCourse = async (req, res) => {
  const uploadedFiles = [];

  try {
    const {
      account_id,
      course_name_thai,
      course_name_eng,
      grade_level,
      course_subject,
      price,
      course_description,
      course_info
    } = req.body;

    const DEFAULT_COURSE_IMAGE =
      supabase.storage
        .from("images")
        .getPublicUrl("course_images/default_course_image.png")
        .data.publicUrl;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required"
      });
    }

    if (!course_name_thai || course_name_thai.trim() === "") {
      throw new Error("กรุณากรอกชื่อคอร์สภาษาไทย");
    }

    if (!grade_level) {
      throw new Error("กรุณาเลือกระดับชั้น");
    }

    if (!course_subject) {
      throw new Error("กรุณาเลือกรายวิชา");
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      throw new Error("กรุณากรอกราคาที่ถูกต้อง");
    }

    let courseImageUrl = DEFAULT_COURSE_IMAGE;

    if (req.file) {
      const file = req.file;
      const filePath = `course_images/${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      uploadedFiles.push(filePath);
      courseImageUrl = supabase.storage
        .from("images")
        .getPublicUrl(filePath).data.publicUrl;
    }

    const courseData = {
      course_name_thai,
      course_name_eng: course_name_eng || "",
      grade_level,
      course_subject,
      price,
      course_description: course_description || "",
      course_info: course_info || "",
      course_image: courseImageUrl
    };

    const { data, error } = await supabase.rpc(
      "add_course_transaction",
      {
        p_account_id: account_id,
        p_course_data: courseData
      }
    );

    if (error) {
      console.error("RPC Error:", error);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: "เพิ่มคอร์สสำเร็จ",
      course_id: data
    });

  } catch (err) {
    if (uploadedFiles.length) {
      await supabase.storage
        .from("images")
        .remove(uploadedFiles)
        .catch(console.error);
    }

    console.error("Create course error:", err.message);

    res.status(500).json({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการเพิ่มคอร์ส"
    });
  }
};

export const getCourseById = async (req, res) => {
  const { courseId } = req.params;

  const { data, error } = await supabase
    .from("course")
    .select(`
      course_id,
      course_name_thai,
      course_name_eng,
      course_subject,
      price,
      course_description,
      course_image,
      tutor_id,
      grade_level (
        grade_level_id,
        grade_level_name
      )
    `)
    .eq("course_id", courseId)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const getTutorCourses = async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "get_tutor_courses",
      { p_account_id: account_id }
    );

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch tutor courses error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId || courseId === 'undefined') {
      return res.status(400).json({
        success: false,
        error: "Course ID is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "get_course_detail",
      { p_course_id: courseId }
    );

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch course detail error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// เพิ่มใน courseController.js

export const getCourseForEdit = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: "Course ID is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "get_course_for_edit",
      { p_course_id: courseId }
    );

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Fetch course for edit error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const updateCourse = async (req, res) => {
  const uploadedFiles = [];

  try {
    const { courseId } = req.params;
    const { account_id } = req.body;

    // แปลงข้อมูลจาก FormData
    const course_name_thai = req.body.course_name_thai;
    const course_name_eng = req.body.course_name_eng;
    const grade_level = req.body.grade_level;
    const course_subject = req.body.course_subject;
    const price = req.body.price;
    const course_description = req.body.course_description;
    const course_info = req.body.course_info;
    const existing_image = req.body.existing_image;

    console.log("===== DEBUG INFO =====");
    console.log("courseId:", courseId);
    console.log("account_id:", account_id);
    console.log("course_name_thai:", course_name_thai);
    console.log("grade_level:", grade_level);
    console.log("course_subject:", course_subject);
    console.log("price:", price);
    console.log("======================");

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: "Course ID is required"
      });
    }

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required"
      });
    }

    // ตรวจสอบสิทธิ์ก่อน (ว่าเป็นเจ้าของคอร์สหรือไม่)
    const { data: courseCheck, error: checkError } = await supabase
      .from("course")
      .select("tutor_id")
      .eq("course_id", courseId)
      .single();

    if (checkError || !courseCheck) {
      throw new Error("ไม่พบข้อมูลคอร์ส");
    }

    // ตรวจสอบว่า tutor_id ตรงกับ account_id หรือไม่
    const { data: tutorCheck, error: tutorError } = await supabase
      .from("tutor")
      .select("tutor_id")
      .eq("account_id", account_id)
      .single();

    if (tutorError || !tutorCheck) {
      throw new Error("ไม่พบข้อมูลติวเตอร์");
    }

    if (courseCheck.tutor_id !== tutorCheck.tutor_id) {
      throw new Error("คุณไม่มีสิทธิ์แก้ไขคอร์สนี้");
    }

    // จัดการรูปภาพ
    let courseImageUrl = existing_image;

    if (req.file) {
      const file = req.file;
      const filePath = `course_images/${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      uploadedFiles.push(filePath);
      courseImageUrl = supabase.storage
        .from("images")
        .getPublicUrl(filePath).data.publicUrl;

      if (existing_image && !existing_image.includes('default_course_image.png')) {
        const oldPath = existing_image.split('/').pop();
        await supabase.storage
          .from("images")
          .remove([`course_images/${oldPath}`])
          .catch(console.error);
      }
    }

    // เตรียมข้อมูลสำหรับอัปเดต (เฉพาะฟิลด์ที่มีการเปลี่ยนแปลง)
    const updateData = {};

    if (course_name_thai !== undefined && course_name_thai !== null) {
      updateData.course_name_thai = course_name_thai;
    }

    if (course_name_eng !== undefined) {
      updateData.course_name_eng = course_name_eng;
    }

    if (grade_level !== undefined && grade_level !== null && grade_level !== "null") {
      updateData.grade_level = grade_level;
    }

    if (course_subject !== undefined && course_subject !== null && course_subject !== "null") {
      updateData.course_subject = course_subject;
    }

    if (price !== undefined && price !== null && price !== "") {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum) && priceNum > 0) {
        updateData.price = priceNum;
      }
    }

    if (course_description !== undefined) {
      updateData.course_description = course_description;
    }

    if (course_info !== undefined) {
      updateData.course_info = course_info;
    }

    if (courseImageUrl !== undefined && courseImageUrl !== null) {
      updateData.course_image = courseImageUrl;
    }

    console.log("Update data:", updateData);

    // ตรวจสอบว่ามีข้อมูลที่จะอัปเดตหรือไม่
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "ไม่มีข้อมูลที่จะอัปเดต"
      });
    }

    // อัปเดตข้อมูลโดยใช้ Supabase โดยตรง
    const { data, error } = await supabase
      .from("course")
      .update(updateData)
      .eq("course_id", courseId);

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: "แก้ไขคอร์สสำเร็จ",
      course_id: courseId
    });

  } catch (err) {
    // ลบรูปที่อัปโหลดใหม่ถ้าเกิด error
    if (uploadedFiles.length) {
      await supabase.storage
        .from("images")
        .remove(uploadedFiles)
        .catch(console.error);
    }

    console.error("Update course error:", err.message);
    console.error("Full error:", err);

    res.status(500).json({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการแก้ไขคอร์ส"
    });
  }
};



export const checkCourseCanDelete = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: "Course ID is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "check_course_can_delete",
      { p_course_id: courseId }
    );

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Check course can delete error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { account_id } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: "Course ID is required"
      });
    }

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "delete_course_transaction",
      {
        p_course_id: courseId,
        p_account_id: account_id
      }
    );

    if (error) {
      console.error("RPC Error:", error);
      throw new Error(error.message);
    }

    // ถ้ามีรูปภาพและไม่ใช่ default ให้ลบรูปจาก storage
    if (data.course_image && !data.course_image.includes('default_course_image.png')) {
      const oldPath = data.course_image.split('/').pop();
      await supabase.storage
        .from("images")
        .remove([`course_images/${oldPath}`])
        .catch(console.error);
    }

    res.json({
      success: true,
      message: "ลบคอร์สสำเร็จ",
      course_id: courseId
    });

  } catch (err) {
    console.error("Delete course error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการลบคอร์ส"
    });
  }
};