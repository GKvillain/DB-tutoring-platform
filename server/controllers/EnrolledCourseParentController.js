import supabase from "../config/supabaseClient.js";

export const getEnrolledCoursesParent = async (req, res) => {
  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    const { data, error } = await supabase
      .from("enrollment")
      .select(`
        enrollment_id,
        student_id,
        course:course_id (
          course_id,
          course_name_thai,
          course_name_eng,
          course_subject,
          price,
          course_description,
          course_image,
          grade_level (
            grade_level_id,
            grade_level_name
          )
        ),
        tutor:tutor_id (
          tutor_id,
          account:account_id (
            fname,
            lname
          )
        ),
        enrollmentdetail (
          enrolled_date,
          parent_need,
          book_id
        )
      `)
      .eq("student_id", student_id)
      .order("enrollment_id", { ascending: false });

    if (error) throw error;

    const formatted = data.map(item => {
      const course = item.course;
      const tutor = item.tutor;
      const tutorAccount = tutor?.account;
      const detail = item.enrollmentdetail?.[0];

      return {
        enrollment_id: item.enrollment_id,
        student_id: item.student_id,
        enrollment_date: detail?.enrolled_date || null,
        parent_need: detail?.parent_need || null,
        book_id: detail?.book_id || null,

        course_id: course?.course_id,
        course_name_thai: course?.course_name_thai,
        course_name_eng: course?.course_name_eng,
        course_subject: course?.course_subject,
        price: course?.price,
        course_description: course?.course_description,
        course_image: course?.course_image,
        grade_level: course?.grade_level,

        tutor_id: tutor?.tutor_id,
        tutor_name: tutorAccount ?
          `${tutorAccount.fname || ''} ${tutorAccount.lname || ''}`.trim() :
          null
      };
    });

    // เรียงตาม enrolled_date ล่าสุด
    const sorted = formatted.sort((a, b) => {
      if (!a.enrollment_date) return 1;
      if (!b.enrollment_date) return -1;
      return new Date(b.enrollment_date) - new Date(a.enrollment_date);
    });

    res.json(sorted);
  } catch (err) {
    console.error("Fetch enrollments error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getStudentParent = async (req, res) => {
      try {
    const { parent_id } = req.query;

    if (!parent_id) {
      return res.status(400).json({ error: "parent_id is required" });
    }

    const { data, error } = await supabase
      .from("student")
      .select(`
        student_id,
        student_fname,
        student_lname,
        student_nickname
      `)
      .eq("parent_id", parent_id)
      .order("student_fname");

    if (error) throw error;

    const formatted = data.map(s => ({
      student_id: s.student_id,
      student_fullname: `${s.student_fname} ${s.student_lname}`.trim(),
      student_nickname: s.student_nickname
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch students error:", err.message);
    res.status(500).json({ error: err.message });
  }
};