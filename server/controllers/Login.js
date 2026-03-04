import supabase from "../config/supabaseClient.js";
 
export const getLogin  = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบข้อมูลที่รับมา
    if (!email || !password) {
      return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    // ดึงข้อมูล account
    const { data: account, error } = await supabase
      .from("account")
      .select("account_id, fname, lname, account_role, email, tel, line_id, fb_name, password")
      .eq("email", email)
      .single();

    if (error || !account) {
      return res.status(401).json({ error: "ไม่พบบัญชีผู้ใช้นี้" });
    }

    // ตรวจสอบรหัสผ่าน (ควรใช้ bcrypt ใน production)
    if (account.password !== password) {
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }

    // เตรียม response object
    const response = {
      success: true,
      account_id: account.account_id,
      role: account.account_role,
      fname: account.fname || "",
      lname: account.lname || "",
      fullname: `${account.fname || ''} ${account.lname || ''}`.trim(),
      email: account.email || "",
      tel: account.tel || "",
      line_id: account.line_id || "",
      fb_name: account.fb_name || "",
      parent_id: null,
      tutor_id: null,
      student_id: null
    };

    // ดึงข้อมูลเพิ่มเติมตาม role
    if (account.account_role === "P") {
      const { data: parentData } = await supabase
        .from("parent")
        .select("parent_id")
        .eq("account_id", account.account_id)
        .single();

      response.parent_id = parentData?.parent_id || null;
    }
    else if (account.account_role === "T") {
      const { data: tutorData } = await supabase
        .from("tutor")
        .select("tutor_id")
        .eq("account_id", account.account_id)
        .single();

      response.tutor_id = tutorData?.tutor_id || null;
    }
    else if (account.account_role === "S") {
      const { data: studentData } = await supabase
        .from("student")
        .select("student_id")
        .eq("account_id", account.account_id)
        .single();

      response.student_id = studentData?.student_id || null;
    }

    console.log("Login successful:", response); // สำหรับ debug
    res.json(response);

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
};