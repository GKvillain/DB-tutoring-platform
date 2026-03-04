import supabase from "../config/supabaseClient.js";

export const getExam = async (req, res) => {
    try {
    const { enrollment_id } = req.query;

    if (!enrollment_id) {
      return res.status(400).json({ error: "enrollment_id is required" });
    }

    const { data, error } = await supabase
      .from("examination")
      .select("*")
      .eq("enrollment_id", enrollment_id);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching examination:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getExamResult = async (req, res) => {
      try {
    const { exam_id } = req.query;

    if (!exam_id) {
      return res.status(400).json({ error: "exam_id is required" });
    }

    const { data, error } = await supabase
      .from("examinationdetail")
      .select("*")
      .eq("exam_id", exam_id);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching examination detail:", err.message);
    res.status(500).json({ error: err.message });
  }
};