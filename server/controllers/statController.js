import supabase from "../config/supabaseClient.js";

export const getDashboard = async (req, res) => {
  try {
    const { month, year, tutor_id } = req.query;

    if (!tutor_id) {
      return res.status(400).json({ error: "tutor_id is required" });
    }

    // console.log("Dashboard params:", { month, year, tutor_id });

    // Convert "all" to null, otherwise parse to integer
    const monthNum = month === "all" ? null : month ? parseInt(month) : null;
    const yearNum = year === "all" ? null : year ? parseInt(year) : null;

    const [hoursRes, studentsRes, sessionsRes, incomeRes] = await Promise.all([
      supabase.rpc("get_total_hours_month_year", {
        p_tutor_id: tutor_id, // First parameter
        p_month: monthNum, // Second parameter (can be null)
        p_year: yearNum, // Third parameter (can be null)
      }),
      supabase.rpc("get_student_count", {
        p_tutor_id: tutor_id,
        p_month: monthNum,
        p_year: yearNum,
      }),
      supabase.rpc("get_total_sessions", {
        p_tutor_id: tutor_id,
        p_month: monthNum,
        p_year: yearNum,
      }),
      supabase.rpc("get_total_income", {
        p_tutor_id: tutor_id,
        p_month: monthNum,
        p_year: yearNum,
      }),
    ]);

    if (hoursRes.error) throw hoursRes.error;
    if (studentsRes.error) throw studentsRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (incomeRes.error) throw incomeRes.error;

    res.json({
      total_hours: hoursRes.data || 0,
      total_students: studentsRes.data || 0,
      total_sessions: sessionsRes.data || 0,
      total_income: incomeRes.data || 0,
      month: monthNum,
      year: yearNum,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch dashboard statistics",
    });
  }
};
export const getCourseSum = async (req, res) => {
  try {
    const { month, year, tutor_id, course_name } = req.query; // Add course_name

    if (!tutor_id) {
      return res.status(400).json({ error: "tutor_id is required" });
    }

    console.log("Received params:", { month, year, tutor_id, course_name });

    // Convert "all" to null, otherwise parse to integer
    const monthNum = month === "all" ? null : month ? parseInt(month) : null;
    const yearNum = year === "all" ? null : year ? parseInt(year) : null;

    console.log("Calling RPC with:", {
      current_tutor_id: tutor_id,
      p_month: monthNum,
      p_year: yearNum,
      p_course_name: course_name || null, // Pass course_name
    });

    const { data, error } = await supabase.rpc("get_course_monthly_summary", {
      current_tutor_id: tutor_id,
      p_month: monthNum,
      p_year: yearNum,
      p_course_name: course_name || null, // Add this parameter
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      throw error;
    }

    console.log("Data received:", data);

    // If requesting a specific course, you might want to return just that one
    if (course_name && data && data.length > 0) {
      // Find the specific course in the results
      const specificCourse = data.find(
        (item) => item.course_name === course_name,
      );
      res.json(specificCourse ? [specificCourse] : []);
    } else {
      res.json(data || []);
    }
  } catch (err) {
    console.error("Error in getCourseSum:", err.message);
    res.status(500).json({ error: err.message });
  }
};
