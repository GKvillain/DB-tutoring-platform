import supabase from "../config/supabaseClient.js";

export const getGradeLevels = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("get_grade_levels");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch grade levels error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const addGradeLevel = async (req, res) => {
  try {
    const { grade_level_name } = req.body;

    if (!grade_level_name || grade_level_name.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        error: "กรุณากรอกชื่อระดับชั้น" 
      });
    }

    const { data, error } = await supabase.rpc(
      "add_grade_level_transaction",
      { p_grade_level_name: grade_level_name.trim() }
    );

    if (error) throw error;

    res.json({
      success: true,
      grade_level_id: data.grade_level_id,
      grade_level_name: data.grade_level_name,
      message: "เพิ่มระดับชั้นสำเร็จ"
    });

  } catch (err) {
    console.error("Create grade level error:", err.message);
    
    if (err.message.includes('มีอยู่ในระบบแล้ว')) {
      return res.status(409).json({ 
        success: false, 
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message || "เกิดข้อผิดพลาดในการเพิ่มระดับชั้น"
    });
  }
};