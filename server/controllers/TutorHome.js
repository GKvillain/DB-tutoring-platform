import supabase from "../config/supabaseClient.js";

export const getTutorHome = async (req, res) => {
  try {
    const { account_id } = req.body;
    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    console.log("Fetching TutorHome for account_id:", account_id);

    // 1. หา tutor_id จาก account_id
    const { data: tutorData, error: tutorError } = await supabase
      .from("tutor")
      .select("tutor_id")
      .eq("account_id", account_id)
      .single();

    if (tutorError) {
      console.error("Tutor fetch error:", tutorError);
      return res.status(404).json({ error: "ไม่พบข้อมูลติวเตอร์" });
    }

    const tutor_id = tutorData.tutor_id;

    // 2. ดึงข้อมูล enrollment ที่ติวเตอร์คนนี้สอน
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollment")
      .select(
        `
        enrollment_id,
        student:student_id (
          student_fname,
          student_lname,
          student_nickname
        ),
        course:course_id (
          course_name_thai
        )
      `,
      )
      .eq("tutor_id", tutor_id);

    if (enrollError) {
      console.error("Enrollment error:", enrollError);
      return res.status(500).json({ error: enrollError.message });
    }

    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }

    const enrollmentIds = enrollments.map((e) => e.enrollment_id);

    // 3. ดึง class sessions
    const { data: sessions, error: sessionError } = await supabase
      .from("classsession")
      .select(
        `
        session_id,
        session_date,
        description,
        note,
        enrollment_id
      `,
      )
      .in("enrollment_id", enrollmentIds)
      .order("session_date", { ascending: true });

    if (sessionError) {
      console.error("Session error:", sessionError);
      return res.status(500).json({ error: sessionError.message });
    }

    // 4. ดึง schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from("enrollmentschedule")
      .select(
        `
        enrollment_id,
        start_time,
        end_time
      `,
      )
      .in("enrollment_id", enrollmentIds);

    if (scheduleError) {
      console.error("Schedule error:", scheduleError);
      return res.status(500).json({ error: scheduleError.message });
    }

    // 5. จัดรูปแบบข้อมูล
    const enrollmentMap = {};
    enrollments.forEach((e) => {
      enrollmentMap[e.enrollment_id] = e;
    });

    const scheduleMap = {};
    schedules.forEach((s) => {
      if (!scheduleMap[s.enrollment_id]) {
        scheduleMap[s.enrollment_id] = [];
      }
      scheduleMap[s.enrollment_id].push(s);
    });

    const formattedData = sessions.map((session) => {
      const enrollment = enrollmentMap[session.enrollment_id] || {};
      const student = enrollment.student || {};
      const course = enrollment.course || {};
      const sessionSchedules = scheduleMap[session.enrollment_id] || [];
      const firstSchedule = sessionSchedules[0] || {};

      // สร้างชื่อเต็มจาก student_fname + student_lname
      const studentFullname =
        `${student.student_fname || ""} ${student.student_lname || ""}`.trim();

      return {
        id: session.session_id,
        date: session.session_date,
        lesson: session.description || "เรียน",
        note: session.note || "",
        student_name:
          student.student_nickname || studentFullname || "ไม่ระบุชื่อ",
        course_name: course.course_name_thai || "ไม่ระบุวิชา",
        start_time: firstSchedule.start_time
          ? firstSchedule.start_time.slice(0, 5)
          : "-",
        end_time: firstSchedule.end_time
          ? firstSchedule.end_time.slice(0, 5)
          : "-",
        enrollment_id: session.enrollment_id,
      };
    });

    console.log(`Found ${formattedData.length} sessions for tutor`);
    res.json(formattedData);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUpdateNote = async (req, res) => {
  const { session_id, note } = req.body;
  const { data, error } = await supabase
    .from("classsession")
    .update({ note: note }) // อัปเดตที่คอลัมน์ note
    .eq("session_id", session_id); // ระบุแถวที่ต้องการอัปเดต

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
};