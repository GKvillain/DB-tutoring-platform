import supabase from "../config/supabaseClient.js";

export const getTutorWeekCalen =  async (req, res) => {
  try {
    const { tutor_id } = req.query;

    if (!tutor_id) {
      return res.status(400).json({ error: "tutor_id is required" });
    }

    // ดึง classsession โดยตรงผ่าน tutor_id
    const { data: sessions, error: sessionError } = await supabase
      .from("classsession")
      .select(
        `
        session_id,
        session_date,
        description,
        enrollment_id,
        enrollment (
          course:course_id (course_name_thai),
          student:student_id (student_nickname),
          enrollmentschedule (
            day_of_week,
            start_time,
            end_time
          )
        )
      `,
      )
      .eq("tutor_id", tutor_id)
      .order("session_date", { ascending: true });

    if (sessionError) throw sessionError;

    // จัดโครงสร้างให้ Frontend อ่านง่ายขึ้น
    const formatted = sessions.map((session) => ({
      ...session,
      // ดึงตารางเวลาเรียน (Schedule) มาไว้ที่ระดับบน
      schedules: session.enrollment?.enrollmentschedule || [],
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};