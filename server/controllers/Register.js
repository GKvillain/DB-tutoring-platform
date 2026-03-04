import supabase from "../config/supabaseClient.js";
 
export const getRegister =  async (req, res) => {
  try {
    const { role, fname, lname, email, password, phone, line, facebook } =
      req.body;

    // 1. บันทึกลงตาราง account ทีเดียวจบ
    const { data: account, error: accountError } = await supabase
      .from("account")
      .insert([
        {
          account_role: role,
          fname: fname,
          lname: lname,
          email: email,
          password: password, // แนะนำให้ Hash รหัสผ่านด้วย bcrypt ตามที่เคยแนะนำนะครับ
          tel: phone,
          line_id: line,
          fb_name: facebook,
          date_create: new Date(),
        },
      ])
      .select()
      .single();

    if (accountError) {
      console.error("Insert Error:", accountError);
      return res.status(500).json({ error: accountError.message });
    }

    // 2. ไม่ต้อง Query 'contactchannel' แล้ว เพราะข้อมูลรวมอยู่ใน account แล้ว
    res.status(201).json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
      account_id: account.account_id,
    });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};