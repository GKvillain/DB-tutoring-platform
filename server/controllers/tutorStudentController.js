import supabase from "../config/supabaseClient.js";

export const searchStudents = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const { data, error } = await supabase.rpc(
      "search_students",
      { p_keyword: q.trim() }
    );

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    res.json(data || []);
  } catch (err) {
    console.error("Search students error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Student ID is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "get_student_by_id",
      { p_student_id: studentId }
    );

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบข้อมูลนักเรียน"
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Get student error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const getRecentStudents = async (req, res) => {
  try {
    const { tutor_id } = req.query;
    const { limit = 10 } = req.query;

    let query = supabase
      .from('enrollment')
      .select(`
        student:student_id (
          student_id,
          student_nickname,
          student_fname,
          student_lname,
          student_picture,
          parent:parent_id (
            account:account_id (
              fname,
              lname
            )
          )
        )
      `)
      .order('enrollment_id', { ascending: false })
      .limit(limit);

    if (tutor_id) {
      query = query.eq('tutor_id', tutor_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // จัดรูปแบบข้อมูล
    const students = data
      .map(item => item.student)
      .filter((student, index, self) => 
        index === self.findIndex(s => s.student_id === student.student_id)
      );

    res.json(students);
  } catch (err) {
    console.error("Get recent students error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};