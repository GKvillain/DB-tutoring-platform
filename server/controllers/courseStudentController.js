import supabase from "../config/supabaseClient.js";

export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        error: "Enrollment ID is required"
      });
    }

    if (!status || !['กำลังเรียน', 'จบแล้ว'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "สถานะไม่ถูกต้อง"
      });
    }

    const { data, error } = await supabase
      .from("enrollmentdetail")
      .update({ enrollment_status: status })
      .eq("enrollment_id", enrollmentId);

    if (error) throw error;

    res.json({
      success: true,
      enrollment_id: enrollmentId,
      status: status
    });
  } catch (err) {
    console.error("Update status error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};