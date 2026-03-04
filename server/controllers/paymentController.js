import supabase from "../config/supabaseClient.js";

export const getHoursPending = async (req, res) => {
  try {
    const { current_tutor_id, course_name } = req.query;

    if (!current_tutor_id) {
      return res.status(400).json({ error: "current_tutor_id is required" });
    }

    const { data, error } = await supabase.rpc(
      "get_hours_pending_per_student",
      {
        p_tutor_id: current_tutor_id,
        p_course_name: course_name || null,
      },
    );

    if (error) {
      console.error("RPC error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching pending hours:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getDetailPayment = async (req, res) => {
  try {
    const { tutor_id } = req.params;
    const { p_student_id, p_course_name } = req.query;

    console.log("getDetailPayment called with:", {
      tutor_id,
      p_student_id,
      p_course_name,
    });

    if (!tutor_id) {
      return res.status(400).json({ error: "tutor_id is required" });
    }

    // IMPORTANT: Match the exact parameter order from the hint
    // The function expects: (p_course_name, p_student_id, p_tutor_id)
    const { data, error } = await supabase.rpc("get_monthly_payment_details", {
      p_course_name: p_course_name || null, // First parameter
      p_student_id: p_student_id || null, // Second parameter
      p_tutor_id: tutor_id, // Third parameter
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return res.status(500).json({
        error: error.message,
        details: error.details,
        hint: error.hint,
      });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
};
