import supabase from "../config/supabaseClient.js";

export const getTutorProfileParent = async (req, res) => {
  try {
    const { tutorId } = req.params;

    console.log("Fetching tutor profile for ID:", tutorId);

    // 1. ดึงข้อมูลติวเตอร์ - ใช้ maybeSingle() แทน single()
    const { data: tutorData, error: tutorError } = await supabase
      .from("tutor")
      .select(`
        tutor_id,
        account_id,
        specialize,
        tutor_picture
      `)
      .eq("tutor_id", tutorId)
      .maybeSingle();

    if (tutorError) {
      console.error("Tutor fetch error:", tutorError);
      return res.status(500).json({ error: tutorError.message });
    }
    
    if (!tutorData) {
      return res.status(404).json({ error: "Tutor not found" });
    }

    console.log("Tutor data found:", tutorData);

    // 2. ดึงข้อมูล account - ใช้ maybeSingle() แทน single()
    const { data: accountData, error: accountError } = await supabase
      .from("account")
      .select(`
        fname, 
        lname,
        email,
        tel,
        line_id,
        fb_name
      `)
      .eq("account_id", tutorData.account_id)
      .maybeSingle();

    if (accountError) {
      console.error("Account fetch error:", accountError);
      return res.status(500).json({ error: accountError.message });
    }

    if (!accountData) {
      console.log("No account data found for tutor");
    }

    console.log("Account data found:", accountData);

    // 3. ดึงคอร์สที่ติวเตอร์คนนี้สอน
    const { data: coursesData, error: coursesError } = await supabase
      .from("course")
      .select(`
        course_id,
        course_name_thai,
        course_name_eng,
        course_subject,
        price,
        course_description,
        course_image,
        grade_level (
          grade_level_id,
          grade_level_name
        )
      `)
      .eq("tutor_id", tutorId);

    if (coursesError) {
      console.error("Courses fetch error:", coursesError);
      return res.status(500).json({ error: coursesError.message });
    }

    console.log("Courses found:", coursesData?.length || 0);

    // 4. จัดรูปแบบข้อมูลติดต่อ
    const contacts = [];
    if (accountData?.email) contacts.push({ type: 'email', value: accountData.email });
    if (accountData?.tel) contacts.push({ type: 'tel', value: accountData.tel });
    if (accountData?.line_id) contacts.push({ type: 'line', value: accountData.line_id });
    if (accountData?.fb_name) contacts.push({ type: 'facebook', value: accountData.fb_name });

    // 5. จัดรูปแบบข้อมูล
    const tutor = {
      tutor_id: tutorData.tutor_id,
      fullname: accountData ? 
        `${accountData.fname || ''} ${accountData.lname || ''}`.trim() : 
        'ไม่ระบุชื่อ',
      specialize: tutorData.specialize ?
        (Array.isArray(tutorData.specialize) ? tutorData.specialize : [tutorData.specialize]) :
        [],
      tutor_picture: tutorData.tutor_picture || null,
      contacts: contacts
    };

    // 6. ส่งข้อมูลกลับ
    res.json({
      tutor: tutor,
      courses: coursesData || []
    });

  } catch (err) {
    console.error("Error in /api/tutor/:tutorId/profile:", err);
    res.status(500).json({ 
      error: err.message,
      details: "Failed to fetch tutor profile"
    });
  }
};