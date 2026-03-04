import supabase from "../config/supabaseClient.js";

export const getIncomeFinance = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const { data, error } = await supabase.rpc("get_income_statistics", {
      p_tutor_id: tutorId,
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getDetailPayment = async (req, res) => {
  try {
    const { current_tutor_id, p_student_id, p_course_name } = req.params;

    if (!current_tutor_id) {
      return res.status(400).json({ error: "current_tutor_id is required" });
    }

    const { data, error } = await supabase.rpc("get_monthly_payment_details", {
      p_tutor_id: current_tutor_id,
      p_student_id: p_student_id || null,
      p_course_name: p_course_name || null,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
};
