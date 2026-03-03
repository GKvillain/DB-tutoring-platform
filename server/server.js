app.get("/api/TutorWeekCalen", async (req, res) => {
  const { tutor_id } = req.query;

  if (!tutor_id) {
    return res.status(400).json({ error: "tutor_id is required" });
  }

  try {
    const { data, error } = await supabase
      .from("classsession")
      .select(
        `
        session_id,
        session_date,
        description,
        enrollment_id,
        enrollment (
          student (
            student_nickname
          ),
          enrollmentschedule (
            day_of_week,
            start_time,
            end_time
          )
        )
      `,
      )
      .eq("tutor_id", tutor_id);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    const formattedData = data.map((item) => {
      const enrollment = item.enrollment;
      const student = enrollment?.student;
      const schedule = enrollment?.enrollmentschedule?.[0];

      return {
        id: item.session_id,
        date: item.session_date,
        lesson: item.description,
        student_name: student?.student_nickname || "ไม่ระบุชื่อ",
        grade: student?.grade_level?.grade_level_name || "ไม่ระบุชั้น",
        start_time: schedule?.start_time || "-",
        end_time: schedule?.end_time || "-",
      };
    });

    res.json(formattedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/updateNote", async (req, res) => {
  const { session_id, note } = req.body;
  const { data, error } = await supabase
    .from("classsession")
    .update({ note: note }) // อัปเดตที่คอลัมน์ note
    .eq("session_id", session_id); // ระบุแถวที่ต้องการอัปเดต

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

// app.get("/api/paymentStatus", async (req, res) => {
//   try {
//     const { month, year, current_tutor_id } = req.query;

//     console.log("Params:", req.query);
//     console.log("Month:", month, "Year:", year, "Tutor ID:", current_tutor_id);

//     // Call the Supabase function (RPC)
//     const { data, error } = await supabase.rpc("get_summary_payment", {
//       p_month: month,
//       p_year: year,
//       current_tutor_id: current_tutor_id,
//     });

//     if (error) {
//       console.error("Supabase error:", error);
//       throw error;
//     }

//     console.log("Query result:", data);
//     console.log("Row count:", data?.length || 0);

//     res.json(data || []);
//   } catch (error) {
//     console.error("Error details:", error);
//     console.error("Error message:", error.message);
//     console.error("Error stack:", error.stack);

//     res.status(500).json({
//       error: "Internal server error",
//       message: error.message,
//     });
//   }
// });

// app.get("/api/getcoursebystudent", async (req, res) => {
//   const { current_tutor_id } = req.query;
//   const { data, error } = await supabase.rpc("get_course_student", {
//     current_tutor_id: current_tutor_id,
//   });

//   res.json(data);
// });

// app.get("/api/getHoursPending", async (req, res) => {
//   const { current_tutor_id, course_name } = req.query;

//   const { data, error } = await supabase.rpc("get_hours_pending", {
//     current_tutor_id: current_tutor_id,
//     course_name: course_name,
//   });

//   if (error) throw error;

//   res.json(data);
// });

// app.get("/api/getTotalPayment", async (req, res) => {
//   const { current_tutor_id, course_name } = req.query;

//   const { data, error } = await supabase.rpc("get_price_total_payment", {
//     current_tutor_id: current_tutor_id,
//     course_name: course_name,
//   });

//   if (error) throw error;

//   res.json(data);
// });

// Get tutor ID from account ID
// Get tutor ID by account ID
app.get("/api/getTutorId", async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    const { data, error } = await supabase
      .from("Tutor")
      .select("tutor_id")
      .eq("account_id", account_id)
      .single();

    if (error) throw error;

    res.json({ tutor_id: data.tutor_id });
  } catch (error) {
    console.error("Error fetching tutor ID:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/getcoursebystudent", async (req, res) => {
  try {
    const { current_tutor_id } = req.query;

    if (!current_tutor_id) {
      return res.status(400).json({ error: "current_tutor_id is required" });
    }

    const { data, error } = await supabase
      .from("course")
      .select("course_id, course_name_thai, course_name_eng, price")
      .eq("tutor_id", current_tutor_id);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/getHoursPending", async (req, res) => {
  try {
    const { current_tutor_id, course_name } = req.query;

    if (!current_tutor_id) {
      return res.status(400).json({ error: "current_tutor_id is required" });
    }

    // Call the PostgreSQL function we created
    const { data, error } = await supabase.rpc(
      "get_hours_pending_per_student",
      {
        p_tutor_id: current_tutor_id,
        p_course_name: course_name || null,
      },
    );

    if (error) {
      console.error("RPC error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching pending hours:", error);
    res.status(500).json({ error: error.message });
  }
});

// app.get("/api/getHoursPending", async (req, res) => {
//   try {
//     const { current_tutor_id, course_name } = req.query;

//     if (!current_tutor_id) {
//       return res.status(400).json({ error: "current_tutor_id is required" });
//     }

//     try {
//       const { data, error } = await supabase.rpc(
//         "get_hours_pending_per_student",
//         {
//           p_tutor_id: current_tutor_id,
//           p_course_name: course_name || null,
//         },
//       );

//       if (!error && data) {
//         return res.json(data);
//       }
//     } catch (rpcError) {
//       console.log(
//         "RPC failed, falling back to manual query:",
//         rpcError.message,
//       );
//     }
//     console.log("Using manual query for tutor:", current_tutor_id);

//     const { data: enrollments, error: enrollError } = await supabase
//       .from("Enrollment")
//       .select(
//         `
//         enrollment_id,
//         student_id,
//         course_id,
//         Student!inner (
//           student_id,
//           student_Fname,
//           student_Lname
//         ),
//         Course!inner (
//           course_id,
//           course_name_thai,
//           course_name_eng,
//           price
//         )
//       `,
//       )
//       .eq("Course.tutor_id", current_tutor_id);

//     if (enrollError) {
//       console.error("Enrollment error:", enrollError);
//       return res.status(500).json({ error: enrollError.message });
//     }

//     const result = [];

//     for (const enrollment of enrollments) {
//       const course = enrollment.Course;
//       const student = enrollment.Student;

//       if (
//         course_name &&
//         course.course_name_thai !== course_name &&
//         course.course_name_eng !== course_name
//       ) {
//         continue;
//       }
//       const { data: sessions, error: sessionError } = await supabase
//         .from("ClassSession")
//         .select("session_id, session_date")
//         .eq("enrollment_id", enrollment.enrollment_id);

//       if (sessionError) {
//         console.error("Session error:", sessionError);
//         continue;
//       }

//       let totalPendingHours = 0;

//       for (const session of sessions) {
//         const sessionDate = new Date(session.session_date);
//         const sessionMonth = new Date(
//           sessionDate.getFullYear(),
//           sessionDate.getMonth(),
//           1,
//         );

//         const { data: payments, error: paymentError } = await supabase
//           .from("Payment")
//           .select(
//             `
//             payment_id,
//             PaymentDetail!inner (
//               payment_bill_date,
//               payment_status
//             )
//           `,
//           )
//           .eq("enrollment_id", enrollment.enrollment_id)
//           .eq("PaymentDetail.payment_status", "PAID");

//         if (paymentError) continue;

//         const dayOfWeek = sessionDate.getDay().toString();
//         const { data: schedule, error: scheduleError } = await supabase
//           .from("EnrollmentSchedule")
//           .select("start_time, end_time")
//           .eq("enrollment_id", enrollment.enrollment_id)
//           .eq("day_of_week", dayOfWeek);

//         if (scheduleError || !schedule || schedule.length === 0) continue;

//         const start = schedule[0].start_time;
//         const end = schedule[0].end_time;

//         const [startHour, startMinute] = start.split(":").map(Number);
//         const [endHour, endMinute] = end.split(":").map(Number);

//         const hours = endHour + endMinute / 60 - (startHour + startMinute / 60);
//         const isPaid =
//           payments &&
//           payments.some(
//             (p) =>
//               p.PaymentDetail &&
//               p.PaymentDetail.some((pd) => {
//                 const paymentDate = new Date(pd.payment_bill_date);
//                 return (
//                   paymentDate.getMonth() === sessionDate.getMonth() &&
//                   paymentDate.getFullYear() === sessionDate.getFullYear()
//                 );
//               }),
//           );

//         if (!isPaid) {
//           totalPendingHours += hours;
//         }
//       }
//       if (totalPendingHours > 0 || !course_name) {
//         const existingIndex = result.findIndex(
//           (r) =>
//             r.student_id === student.student_id &&
//             r.course_name_thai === course.course_name_thai,
//         );

//         const studentName =
//           `${student.student_Fname || ""} ${student.student_Lname || ""}`.trim();
//         const pendingHours = Math.round(totalPendingHours * 100) / 100;
//         const outstanding =
//           Math.round(totalPendingHours * course.price * 100) / 100;

//         if (existingIndex >= 0) {
//           result[existingIndex].total_pending_hours += pendingHours;
//           result[existingIndex].total_outstanding += outstanding;
//         } else {
//           result.push({
//             student_id: student.student_id,
//             student_name: studentName || `Student ${student.student_id}`,
//             course_name_eng: course.course_name_eng,
//             course_name_thai: course.course_name_thai,
//             total_pending_hours: pendingHours,
//             course_price: course.price,
//             total_outstanding: outstanding,
//             payment_status: pendingHours > 0 ? "PENDING" : "PAID",
//           });
//         }
//       }
//     }

//     res.json(result);
//   } catch (error) {
//     console.error("Error in getHoursPending:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

app.get("/api/getTotalPayment", async (req, res) => {
  try {
    const { current_tutor_id, course_name } = req.query;

    if (!current_tutor_id) {
      return res.status(400).json({ error: "current_tutor_id is required" });
    }

    const { data, error } = await supabase.rpc("get_price_total_payment", {
      p_tutor_id: current_tutor_id,
      p_course_name: course_name || null,
    });

    if (error) {
      console.error("RPC error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching total payment:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/getStudentNameByTutor", async (req, res) => {
  try {
    const { current_tutor_id } = req.query;

    if (!current_tutor_id) {
      return res.status(400).json({ error: "tutor_id is required" });
    }

    const { data, error } = await supabase.rpc("get_students_by_tutor", {
      p_tutor_id: current_tutor_id,
    });

    if (error) {
      console.error("RPC error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching student names:", error);
    res.status(500).json({ error: error.message });
  }
});

// app.get("/api/studentName", async (req, res) => {
//   try {
//     const { current_tutor_id } = req.query;

//     if (!current_tutor_id) {
//       return res.status(400).json({ error: "Missing tutor ID" });
//     }

//     console.log("Fetching students for tutor:", current_tutor_id);

//     const { data, error } = await supabase.rpc("get_students_by_tutor", {
//       tutor_id_param: current_tutor_id,
//     });

//     if (error) {
//       console.error("RPC error:", error);

//       const { data: enrollments, error: enrollError } = await supabase
//         .from("enrollment")
//         .select("student_id")
//         .eq("tutor_id", current_tutor_id);

//       if (enrollError) {
//         throw enrollError;
//       }

//       const studentIds = [...new Set(enrollments.map((e) => e.student_id))];

//       const { data: students, error: studentError } = await supabase
//         .from("student")
//         .select("*")
//         .in("student_id", studentIds);

//       if (studentError) {
//         throw studentError;
//       }

//       return res.json(students);
//     }

//     res.json(data);
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({
//       error: "Internal server error",
//       message: error.message,
//     });
//   }
// });

app.get("/api/getMonthlyPendingHours", async (req, res) => {
  try {
    const { current_tutor_id, student_id, course_name } = req.query;

    if (!current_tutor_id) {
      return res.status(400).json({ error: "current_tutor_id is required" });
    }

    let query = supabase
      .from("ClassSession")
      .select(
        `
        session_id,
        session_date,
        enrollment_id,
        enrollment!inner (
          student_id,
          student!inner (
            first_name,
            last_name
          ),
          course_id,
          course!inner (
            course_name_thai,
            course_name_eng,
            price
          )
        )
      `,
      )
      .eq("enrollment.course.tutor_id", current_tutor_id);

    if (student_id) {
      query = query.eq("enrollment.student_id", student_id);
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
