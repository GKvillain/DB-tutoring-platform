import supabase from "../config/supabaseClient.js";

export const getSummaryLearning = async (req, res) => {
  try {
    const { current_tutor_id } = req.query;

    console.log("Received request with tutor_id:", current_tutor_id);

    if (!current_tutor_id) {
      return res.status(400).json({ error: "tutor_id is required" });
    }

    const { data, error } = await supabase.rpc("get_summary_learning", {
      current_tutor_id: current_tutor_id,
    });

    console.log("Supabase response:", { data, error });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Learning Record error: ", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch summary learning",
    });
  }
};

export const getSummaryLearningDetail = async (req, res) => {
  try {
    const { student_id } = req.query;

    console.log("Received request with student_id:", student_id);

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    const { data, error } = await supabase.rpc("get_summary_learning_detail", {
      current_student_id: student_id,
    });

    console.log("Supabase response:", { data, error });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Learning Detail error: ", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch learning details",
    });
  }
};

// FIXED: Update function to match frontend data structure
export const updateLearningDetail = async (req, res) => {
  try {
    let {
      record_id,
      attendance_id,
      lesson_topic,
      homework_status,
      attendance_status,
    } = req.body;

    // console.log("=================================");
    // console.log("UPDATE REQUEST RECEIVED");
    // console.log("=================================");
    // console.log("record_id:", record_id);
    // console.log("attendance_id:", attendance_id);
    // console.log("lesson_topic:", lesson_topic);
    // console.log("homework_status:", homework_status);
    // console.log("attendance_status:", attendance_status);

    const results = [];

    // 1. UPDATE ATTENDANCEDETAIL
    if (attendance_id && attendance_status) {
      console.log("\n--- Updating attendancedetail ---");

      // Check if attendancedetail exists
      const { data: existingDetail, error: checkError } = await supabase
        .from("attendancedetail")
        .select("attendance_id")
        .eq("attendance_id", attendance_id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking attendancedetail:", checkError);
        return res.status(500).json({
          error: "Failed to check attendancedetail",
          details: checkError,
        });
      }

      if (existingDetail) {
        // Update existing
        const { data: updateData, error: updateError } = await supabase
          .from("attendancedetail")
          .update({ attendance_status })
          .eq("attendance_id", attendance_id)
          .select();

        if (updateError) {
          console.error("Error updating attendancedetail:", updateError);
          return res.status(500).json({
            error: "Failed to update attendancedetail",
            details: updateError,
          });
        }
        console.log("attendancedetail updated:", updateData);
        if (updateData) results.push(...updateData);
      } else {
        // Insert new
        const { data: insertData, error: insertError } = await supabase
          .from("attendancedetail")
          .insert([{ attendance_id, attendance_status }])
          .select();

        if (insertError) {
          console.error("Error inserting attendancedetail:", insertError);
          return res.status(500).json({
            error: "Failed to insert attendancedetail",
            details: insertError,
          });
        }
        console.log("attendancedetail inserted:", insertData);
        if (insertData) results.push(...insertData);
      }
    }

    // 2. UPDATE LEARNINGRECORDDETAIL
    if (record_id && (lesson_topic || homework_status)) {
      console.log("\n--- Updating learningrecorddetail ---");

      const updates = {};
      if (lesson_topic !== undefined) updates.lesson_topic = lesson_topic;
      if (homework_status !== undefined)
        updates.homework_status = homework_status;

      // Check if learningrecorddetail exists
      const { data: existingDetail, error: checkError } = await supabase
        .from("learningrecorddetail")
        .select("record_id")
        .eq("record_id", record_id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking learningrecorddetail:", checkError);
        return res.status(500).json({
          error: "Failed to check learningrecorddetail",
          details: checkError,
        });
      }

      if (existingDetail) {
        // Update existing
        const { data: updateData, error: updateError } = await supabase
          .from("learningrecorddetail")
          .update(updates)
          .eq("record_id", record_id)
          .select();

        if (updateError) {
          console.error("Error updating learningrecorddetail:", updateError);
          return res.status(500).json({
            error: "Failed to update learningrecorddetail",
            details: updateError,
          });
        }
        console.log("learningrecorddetail updated:", updateData);
        if (updateData) results.push(...updateData);
      } else {
        // Insert new
        const { data: insertData, error: insertError } = await supabase
          .from("learningrecorddetail")
          .insert([{ record_id, ...updates }])
          .select();

        if (insertError) {
          console.error("Error inserting learningrecorddetail:", insertError);
          return res.status(500).json({
            error: "Failed to insert learningrecorddetail",
            details: insertError,
          });
        }
        console.log("learningrecorddetail inserted:", insertData);
        if (insertData) results.push(...insertData);
      }
    }

    console.log("\n=== UPDATE SUCCESSFUL ===");
    console.log("Results:", results);

    res.json({
      message: "บันทึกข้อมูลสำเร็จ",
      data: results,
    });
  } catch (err) {
    console.error("=== CATCH ERROR ===");
    console.error(err);
    res.status(500).json({
      error: err.message,
      details: "Server error",
    });
  }
};
export const addLearningRecord = async (req, res) => {
  try {
    const {
      student_id,
      course_id,
      enrollment_id,
      session_date,
      lesson_topic,
      homework_status,
      attendance_status,
    } = req.body;

    console.log("Received add request:", {
      student_id,
      course_id,
      enrollment_id,
      session_date,
      lesson_topic,
      homework_status,
      attendance_status,
    });

    if (!student_id || !enrollment_id || !session_date) {
      return res.status(400).json({
        error: "student_id, enrollment_id, and session_date are required",
      });
    }

    // Get tutor_id from the course
    const { data: courseData, error: courseError } = await supabase
      .from("Course")
      .select("tutor_id")
      .eq("course_id", course_id)
      .single();

    if (courseError) {
      console.error("Error fetching course:", courseError);
      throw courseError;
    }

    // Create ClassSession
    const { data: sessionData, error: sessionError } = await supabase
      .from("ClassSession")
      .insert([
        {
          session_date,
          enrollment_id,
          description: lesson_topic || null,
          tutor_id: courseData.tutor_id,
        },
      ])
      .select();

    if (sessionError) {
      console.error("Error creating class session:", sessionError);
      throw sessionError;
    }

    const session_id = sessionData[0].session_id;

    // Create Attendance record
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("Attendance")
      .insert([
        {
          student_id,
          session_id,
        },
      ])
      .select();

    if (attendanceError) {
      console.error("Error creating attendance:", attendanceError);
      throw attendanceError;
    }

    const attendance_id = attendanceData[0].attendance_id;

    // Create AttendanceDetail
    if (attendance_status) {
      const { error: attendanceDetailError } = await supabase
        .from("AttendanceDetail")
        .insert([
          {
            attendance_id,
            attendance_status,
          },
        ]);

      if (attendanceDetailError) {
        console.error(
          "Error creating attendance detail:",
          attendanceDetailError,
        );
        throw attendanceDetailError;
      }
    }

    // Create LearningRecords
    const { data: learningRecordsData, error: learningRecordsError } =
      await supabase
        .from("LearningRecords")
        .insert([
          {
            session_id,
            attendance_id,
            enrollment_id,
          },
        ])
        .select();

    if (learningRecordsError) {
      console.error("Error creating learning records:", learningRecordsError);
      throw learningRecordsError;
    }

    const record_id = learningRecordsData[0].record_id;

    // Create LearningRecordDetail
    if (lesson_topic || homework_status) {
      const { error: learningDetailError } = await supabase
        .from("LearningRecordDetail")
        .insert([
          {
            record_id,
            lesson_topic: lesson_topic || null,
            homework_status: homework_status || null,
          },
        ]);

      if (learningDetailError) {
        console.error("Error creating learning detail:", learningDetailError);
        throw learningDetailError;
      }
    }

    res.status(201).json({
      message: "เพิ่มบันทึกการเรียนรู้สำเร็จ",
      data: {
        session_id,
        attendance_id,
        record_id,
      },
    });
  } catch (err) {
    console.error("Error adding learning record:", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to add learning record",
    });
  }
};

export const getSummaryExam = async (req, res) => {
  try {
    // Accept both tutor_id and current_tutor_id
    const tutor_id = req.query.tutor_id || req.query.current_tutor_id;

    console.log("Received request with tutor id in summary exam: ", tutor_id);

    if (!tutor_id) {
      return res.status(400).json({
        error: "tutor_id is required",
        received: req.query,
      });
    }

    const { data, error } = await supabase.rpc("get_summary_exam", {
      current_tutor_id: tutor_id, // Pass the value to the RPC function
    });

    console.log("Supabase response:", { data, error });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Exam record error: ", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch summary exam",
    });
  }
};

export const getExamDetail = async (req, res) => {
  try {
    const { student_id, tutor_id } = req.query;

    console.log("Received request for exam detail:", { student_id, tutor_id });

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    let finalTutorId = tutor_id;

    // If tutor_id not provided in query, try to get it from enrollment
    if (!finalTutorId) {
      console.log(
        "No tutor_id provided, trying to get from enrollment for student:",
        student_id,
      );

      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("enrollment")
        .select("tutor_id")
        .eq("student_id", student_id)
        .limit(1)
        .maybeSingle();

      if (enrollmentError) {
        console.error("Error fetching enrollment:", enrollmentError);
        return res
          .status(400)
          .json({ error: "Could not determine tutor from enrollment" });
      }

      if (!enrollmentData) {
        return res
          .status(404)
          .json({ error: "No enrollment found for this student" });
      }

      finalTutorId = enrollmentData.tutor_id;
      console.log("Found tutor_id from enrollment:", finalTutorId);
    }

    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc("get_exam_detail", {
      current_tutor_id: finalTutorId,
      student_id_param: student_id,
    });

    console.log("Supabase response:", { data, error });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Exam detail error: ", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch exam details",
    });
  }
};
