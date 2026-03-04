import supabase from "../config/supabaseClient.js";

export const getCourseDetailParent = async (req, res) => {
      try {
        const { courseId } = req.params;
    
        // 1. ดึงข้อมูลคอร์ส
        const { data: courseData, error: courseError } = await supabase
          .from("course")
          .select(`
            course_id,
            course_name_thai,
            course_name_eng,
            course_subject,
            price,
            course_description,
            course_image,
            course_info,
            tutor_id,
            grade_level (
              grade_level_id,
              grade_level_name
            )
          `)
          .eq("course_id", courseId)
          .single();
    
        if (courseError) throw courseError;
        if (!courseData) {
          return res.status(404).json({ error: "Course not found" });
        }
    
        // 2. ดึงข้อมูล tutor
        let tutor = null;
        if (courseData.tutor_id) {
          const { data: tutorData, error: tutorError } = await supabase
            .from("tutor")
            .select(`
              tutor_id,
              account_id,
              specialize,
              tutor_picture
            `)
            .eq("tutor_id", courseData.tutor_id)
            .maybeSingle();
    
          if (tutorError) {
            console.error("Tutor fetch error:", tutorError);
          } else if (tutorData) {
            // ดึงข้อมูล account
            const { data: accountData, error: accountError } = await supabase
              .from("account")
              .select("fname, lname, email, tel, line_id, fb_name")
              .eq("account_id", tutorData.account_id)
              .maybeSingle();
    
            if (accountError) {
              console.error("Account fetch error:", accountError);
            }
    
            // สร้าง contacts array
            const contacts = [];
            if (accountData?.email) contacts.push({ type: 'email', value: accountData.email });
            if (accountData?.tel) contacts.push({ type: 'tel', value: accountData.tel });
            if (accountData?.line_id) contacts.push({ type: 'line', value: accountData.line_id });
            if (accountData?.fb_name) contacts.push({ type: 'facebook', value: accountData.fb_name });
    
            tutor = {
              tutor_id: tutorData.tutor_id,
              fullname: accountData ? 
                `${accountData.fname || ''} ${accountData.lname || ''}`.trim() : 
                'ไม่พบชื่อผู้สอน',
              specialize: tutorData.specialize ?
                (Array.isArray(tutorData.specialize) ? tutorData.specialize : [tutorData.specialize]) :
                [],
              tutor_picture: tutorData.tutor_picture || null,  // ← เพิ่มรูปติวเตอร์
              contacts: contacts  // ← เพิ่มข้อมูลติดต่อ
            };
          }
        }
    
        res.json({
          course: courseData,
          tutor: tutor
        });
    
      } catch (err) {
        console.error("Fetch course detail error:", err.message);
        res.status(500).json({ error: err.message });
      }
    };