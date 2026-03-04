import supabase from "../config/supabaseClient.js";

export const getStudentCalendar = async (req, res) => {
    try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    // ดึง enrollment ของนักเรียน
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollment")
      .select("enrollment_id, course_id, tutor_id")
      .eq("student_id", student_id);

    if (enrollError) throw enrollError;

    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }

    const enrollmentIds = enrollments.map(e => e.enrollment_id);

    // ดึง class sessions ของนักเรียน
    const { data: sessions, error: sessionError } = await supabase
      .from("classsession")
      .select(`
        session_id,
        session_date,
        description,
        note,
        enrollment_id,
        enrollment (
          course (
            course_name_thai,
            course_name_eng
          )
        ),
        learningrecords (
          attendance_id,
          learningrecorddetail (
            record_id,
            lesson_topic,
            homework_status
          )
        )
      `)
      .in("enrollment_id", enrollmentIds)
      .order("session_date", { ascending: true });

    if (sessionError) throw sessionError;

    // ดึง schedule ของแต่ละ enrollment
    const schedulePromises = enrollmentIds.map(async (enrollment_id) => {
      const { data: schedule, error: scheduleError } = await supabase
        .from("enrollmentschedule")
        .select(`
          day_of_week,
          start_time,
          end_time
        `)
        .eq("enrollment_id", enrollment_id);

      if (scheduleError) throw scheduleError;
      return { enrollment_id, schedule: schedule || [] };
    });

    const schedules = await Promise.all(schedulePromises);
    
    // สร้าง map ของ schedule
    const scheduleMap = {};
    schedules.forEach(item => {
      scheduleMap[item.enrollment_id] = item.schedule;
    });

    // รวมข้อมูล
    const formatted = sessions.map(session => ({
      ...session,
      schedules: scheduleMap[session.enrollment_id] || []
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching student schedule:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getParentProfile = async (req, res) => {
    try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    const { data, error } = await supabase
      .from("parent")
      .select(`
        parent_id,
        account:account_id (
          account_id,
          fname,
          lname,
          email,
          tel,
          line_id,
          fb_name
        )
      `)
      .eq("account_id", account_id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Parent not found" });
    }

    const formattedData = {
      parent_id: data.parent_id,
      account_id: data.account.account_id,
      fname: data.account.fname,
      lname: data.account.lname,
      fullname: `${data.account.fname} ${data.account.lname}`.trim(),
      email: data.account.email,
      tel: data.account.tel,
      line_id: data.account.line_id,
      fb_name: data.account.fb_name
    };

    res.json(formattedData);
  } catch (err) {
    console.error("Error fetching parent profile:", err.message);
    res.status(500).json({ error: err.message });
  }
};