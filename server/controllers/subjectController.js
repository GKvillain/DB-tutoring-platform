import supabase from "../config/supabaseClient.js";

export const getSubjects = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("get_subjects");
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Fetch subject error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const addSubject = async (req, res) => {
  try {
    const { subject_name } = req.body;

    if (!subject_name || subject_name.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        error: "กรุณากรอกชื่อวิชา" 
      });
    }

    const { data, error } = await supabase.rpc(
      "add_subject_transaction",
      { p_subject_name: subject_name.trim() }
    );

    if (error) throw error;

    res.json({
      success: true,
      subject_name: data.subject_name,
      message: "เพิ่มวิชาสำเร็จ"
    });

  } catch (err) {
    console.error("Create subject error:", err.message);
    
    if (err.message.includes('มีอยู่ในระบบแล้ว')) {
      return res.status(409).json({ 
        success: false, 
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message || "เกิดข้อผิดพลาดในการเพิ่มวิชา"
    });
  }
};