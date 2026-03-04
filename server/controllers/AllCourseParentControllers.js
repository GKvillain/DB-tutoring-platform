import supabase from "../config/supabaseClient.js";

export const getAllCourseParent = async (req, res) => {
   try {
    const { role, account_id } = req.query;

    let query = supabase
      .from("course")
      .select(`
        course_id,
        course_name_thai,
        course_name_eng,
        course_subject,
        price,
        course_image,
        tutor_id,
        grade_level (
          grade_level_id,
          grade_level_name
        )
      `)
      .order("course_name_thai");

    // 🔒 Tutor → เห็นเฉพาะของตัวเอง
    if (role === "T") {
      if (!account_id) {
        return res.status(400).json({ error: "account_id is required for tutor" });
      }

      // หา tutor_id จาก account_id
      const { data: tutor, error: tutorError } = await supabase
        .from("tutor")
        .select("tutor_id")
        .eq("account_id", account_id)
        .single();

      if (tutorError || !tutor) {
        return res.status(404).json({ error: "Tutor not found" });
      }

      query = query.eq("tutor_id", tutor.tutor_id);
    }

    // Parent → ไม่ต้อง filter
    // (เห็นทั้งหมด)

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Fetch courses error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getAllCourseTutor = async (req, res) => {
      try {
        const { account_id } = req.query;
    
        if (!account_id) {
          return res.status(400).json({ error: "account_id is required" });
        }
    
        // หา tutor_id จาก account_id
        const { data: tutor, error: tutorError } = await supabase
          .from("tutor")
          .select("tutor_id")
          .eq("account_id", account_id)
          .single();
    
        if (tutorError || !tutor) {
          return res.status(404).json({ error: "Tutor not found" });
        }
    
        // ดึง course ของ tutor
        const { data: courses, error: courseError } = await supabase
          .from("course")
          .select(`
            course_id,
            course_name_thai,
            course_name_eng,
            course_subject,
            grade_level,
            price,
            course_image
          `)
          .eq("tutor_id", tutor.tutor_id)
          .order("course_name_thai");
    
        if (courseError) throw courseError;
    
        res.json(courses);
      } catch (err) {
        console.error("Fetch tutor courses error:", err.message);
        res.status(500).json({ error: err.message });
      }
    };