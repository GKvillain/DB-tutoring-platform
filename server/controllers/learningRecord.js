import supabase from "../config/supabaseClient.js";

export const getSummaryLearning = async (req, res) => {
  try {
    const { current_tutor_id } = req.query;

    console.log("Received request with tutor_id:", current_tutor_id);

    if (!current_tutor_id) {
      return res.status(400).json({ error: "tutor_id is required" });
    }

    const { data, error } = await supabase.rpc("get_summary_learning", {
      current_tutor_id: current_tutor_id,
    });

    console.log("Supabase response:", { data, error });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Learning Record error: ", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch summary learning",
    });
  }
};

export const getSummaryLearningDetail = async (req, res) => {
  try {
    // This should be student_id, not current_tutor_id
    const { student_id } = req.query;

    console.log("Received request with student_id:", student_id);

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    // Call the RPC function with the correct parameter
    const { data, error } = await supabase.rpc("get_summary_learning_detail", {
      current_student_id: student_id, // The function expects current_student_id
    });

    console.log("Supabase response:", { data, error });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Learning Detail error: ", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch learning details",
    });
  }
};
