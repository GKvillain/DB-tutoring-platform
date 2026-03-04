import supabase from "../config/supabaseClient.js";

export const getParentInfo = async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    const { data, error } = await supabase
      .from("parent")
      .select(`
        parent_id,
        account_id,
        account:account_id (
          fname,
          lname,
          email,
          tel,
          line_id,
          fb_name
        )
      `)
      .eq("account_id", account_id)
      .single();

    if (error) throw error;

    res.json({
      parent_id: data.parent_id,
      account_id: data.account_id,
      account: {
        fname: data.account?.fname || "",
        lname: data.account?.lname || "",
        email: data.account?.email || "",
        tel: data.account?.tel || "",
        line_id: data.account?.line_id || "",
        fb_name: data.account?.fb_name || ""
      }
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const editInfoParent = async (req, res) => {
  try {
    const { account_id, fname, lname, tel, line_id, fb_name } = req.body; // ใช้ req.body ไม่ใช่ req.query

    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    // อัปเดตข้อมูลในตาราง account
    const { data, error } = await supabase
      .from("account")
      .update({
        fname,
        lname,
        tel,
        line_id,
        fb_name
      })
      .eq("account_id", account_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      data,
      message: "อัปเดตข้อมูลสำเร็จ" 
    });

  } catch (err) {
    console.error("Error updating parent info:", err);
    res.status(500).json({ error: err.message });
  }
};