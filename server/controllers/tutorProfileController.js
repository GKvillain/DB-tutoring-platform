import supabase from "../config/supabaseClient.js";
import { uploadImage } from "../utils/enrollHelper.js";

export const getTutorProfile = async (req, res) => {
  try {
    const { account_id } = req.params;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required"
      });
    }

    const { data, error } = await supabase.rpc(
      "get_tutor_profile",
      { p_account_id: account_id }
    );

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Fetch tutor profile error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const updateTutorProfile = async (req, res) => {
  const uploadedFiles = [];

  try {
    const { account_id } = req.params;
    
    // รับข้อมูลจาก FormData
    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.email;
    const tel = req.body.tel;
    const line_id = req.body.line_id;
    const fb_name = req.body.fb_name;
    const specialize = req.body.specialize;
    const existing_tutor_picture = req.body.existing_tutor_picture;
    const bank_account_name = req.body.bank_account_name;
    const existing_qr_image = req.body.existing_qr_image;

    console.log("Received data:", {
      fname, lname, email, tel, line_id, fb_name, specialize, bank_account_name
    });

    console.log("Files received:", req.files); // Debug ดูไฟล์ที่ได้รับ

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required"
      });
    }

    // จัดการรูปภาพติวเตอร์ - ตรวจสอบชื่อฟิลด์ให้ถูกต้อง
    let tutorPictureUrl = existing_tutor_picture;

    // ตรวจสอบทั้งสองชื่อเผื่อไว้
    const tutorPictureFile = req.files?.tutorPicture?.[0] || req.files?.tutorImg?.[0];
    
    if (tutorPictureFile) {
      const file = tutorPictureFile;
      const filePath = `tutor_images/${Date.now()}-${file.originalname}`;

      console.log("Uploading tutor picture:", file.originalname);

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      uploadedFiles.push(filePath);
      tutorPictureUrl = supabase.storage
        .from("images")
        .getPublicUrl(filePath).data.publicUrl;

      // ลบรูปเก่าถ้ามีและไม่ใช่ default
      if (existing_tutor_picture && !existing_tutor_picture.includes('default_tutor_image.png')) {
        const oldPath = existing_tutor_picture.split('/').pop();
        await supabase.storage
          .from("images")
          .remove([`tutor_images/${oldPath}`])
          .catch(console.error);
      }
    }

    // จัดการรูปภาพ QR code - ตรวจสอบชื่อฟิลด์ให้ถูกต้อง
    let qrImageUrl = existing_qr_image;

    // ตรวจสอบทั้งสองชื่อเผื่อไว้
    const qrImageFile = req.files?.qrImage?.[0] || req.files?.qrImg?.[0];
    
    if (qrImageFile) {
      const file = qrImageFile;
      const filePath = `qr_images/${Date.now()}-${file.originalname}`;

      console.log("Uploading QR image:", file.originalname);

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      uploadedFiles.push(filePath);
      qrImageUrl = supabase.storage
        .from("images")
        .getPublicUrl(filePath).data.publicUrl;

      // ลบรูปเก่าถ้ามี
      if (existing_qr_image && !existing_qr_image.includes('default_qr_image.png')) {
        const oldPath = existing_qr_image.split('/').pop();
        await supabase.storage
          .from("images")
          .remove([`qr_images/${oldPath}`])
          .catch(console.error);
      }
    }

    // เตรียมข้อมูลสำหรับส่งไป RPC
    const accountData = {
      fname: fname || "",
      lname: lname || "",
      email: email || "",
      tel: tel || "",
      line_id: line_id || "",
      fb_name: fb_name || ""
    };

    const tutorData = {
      specialize: specialize || "",
      tutor_picture: tutorPictureUrl || ""
    };

    const bankData = {};
    if (bank_account_name) bankData.bank_account_name = bank_account_name;
    if (qrImageUrl) bankData.qr_image = qrImageUrl;

    console.log("Sending to RPC:", {
      account_id,
      accountData,
      tutorData,
      bankData: Object.keys(bankData).length > 0 ? bankData : null
    });

    const { data, error } = await supabase.rpc(
      "update_tutor_profile_transaction",
      {
        p_account_id: account_id,
        p_account_data: accountData,
        p_tutor_data: tutorData,
        p_bank_data: Object.keys(bankData).length > 0 ? bankData : null
      }
    );

    if (error) {
      console.error("RPC Error:", error);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: "อัปเดตโปรไฟล์สำเร็จ",
      data: data
    });

  } catch (err) {
    // ลบรูปที่อัปโหลดใหม่ถ้าเกิด error
    if (uploadedFiles.length) {
      await supabase.storage
        .from("images")
        .remove(uploadedFiles)
        .catch(console.error);
    }

    console.error("Update tutor profile error:", err.message);
    console.error("Full error:", err);

    res.status(500).json({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์"
    });
  }
};