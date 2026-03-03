import supabase from "../config/supabaseClient.js";

export const getDashboard = async (req, res) => {
  try {
    const { month, year, tutor_id } = req.query;

    if (!month || !year || !tutor_id) {
      return res.status(400).json({
        error: "Month, year, and tutor_id are required",
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const [hoursRes, studentsRes, sessionsRes, incomeRes] = await Promise.all([
      supabase.rpc("get_total_hours_month_year", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id,
      }),
      supabase.rpc("get_student_count", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id,
      }),
      supabase.rpc("get_total_sessions", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id,
      }),
      supabase.rpc("get_total_income", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id,
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
