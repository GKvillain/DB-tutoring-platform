import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running!" });
});

app.get("/api/students", async (req, res) => {
  const { data, error } = await supabase.from("student").select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/classsession", async (req, res) => {
  try {
    const { month, year } = req.query;

    let query = supabase.from("classsession").select("*");

    if (month !== "all" && year !== "all" && month && year) {
      const startDate = `${year}-${month}-01`;

      const nextMonth =
        parseInt(month) === 12
          ? `${parseInt(year) + 1}-01-01`
          : `${year}-${String(parseInt(month) + 1).padStart(2, "0")}-01`;

      query = query
        .gte("session_date", startDate)
        .lt("session_date", nextMonth);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Backend Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/test", async (req, res) => {
  const { data, error } = await supabase.from("account").select("*").limit(1);

  if (error) return res.json({ error: error.message });
  res.json(data);
});

app.get("/api/statistics", async (req, res) => {
  try {
    const { month, year } = req.query;

    const { data, error } = await supabase.rpc("get_statistics", {
      p_month: month,
      p_year: year,
    });

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    console.error("RPC Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/statisticsCourse", async (req, res) => {
  try {
    const { month, year } = req.query;

    const { data, error } = await supabase.rpc("get_course_statistics", {
      p_month: month,
      p_year: year,
    });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("RPC Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const { month, year, tutor_id } = req.query;

    if (!month || !year || !tutor_id) {
      return res.status(400).json({
        error: "Month, year, and tutor_id are required",
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Call RPC functions with updated parameter names
    const [hoursRes, studentsRes, sessionsRes, incomeRes] = await Promise.all([
      supabase.rpc("get_total_hours_month_year", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id,
      }),
      supabase.rpc("get_student_count", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id,
      }),
      supabase.rpc("get_total_sessions", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id,
      }),
      supabase.rpc("get_total_income", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id,
      }),
    ]);

    // Check for errors
    if (hoursRes.error) throw hoursRes.error;
    if (studentsRes.error) throw studentsRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (incomeRes.error) throw incomeRes.error;

    res.json({
      total_hours: hoursRes.data || 0,
      total_students: studentsRes.data || 0,
      total_sessions: sessionsRes.data || 0,
      total_income: incomeRes.data || 0,
      month: monthNum,
      year: yearNum,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch dashboard statistics",
    });
  }
});

app.get("/api/getCourseSummary", async (req, res) => {
  const { month, year, tutor_id } = req.query;

  const { data, error } = await supabase.rpc("get_course_monthly_summary", {
    p_month: month,
    p_year: year,
    current_tutor_id: tutor_id,
  });

  if (error) throw error;

  res.json(data);
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from("account")
      .select("account_id, fname, lname, account_role, password")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "User not found" });
    }

    if (data.password !== password) {
      return res.status(401).json({ error: "Wrong password" });
    }

    res.json({
      success: true,
      account_id: data.account_id,
      role: data.account_role,
      fname: data.fname,
      lname: data.lname,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tutor ID from account ID
// Backend: /api/getTutorId
app.get("/api/getTutorId", async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    const { data, error } = await supabase
      .from("tutor")
      .select("tutor_id")
      .eq("account_id", account_id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Tutor not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/getTutorName", async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    const { data, error } = await supabase
      .from("account")
      .select("fname, lname")
      .eq("account_id", account_id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({
      tutor_name: `${data.fname} ${data.lname}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
///////////////////////////////////////////////////////////////////////////////////////////
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from("account")
      .select("account_id, fname, lname, account_role, password")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "User not found" });
    }

    if (data.password !== password) {
      return res.status(401).json({ error: "Wrong password" });
    }

    res.json({
      success: true,
      account_id: data.account_id,
      role: data.account_role,
      fname: data.fname,
      lname: data.lname,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    console.log("Incoming Register Data:", req.body);

    const { role, fname, lname, email, password, phone, line, facebook } =
      req.body;

    // ===============================
    const { data: account, error: accountError } = await supabase
      .from("account")
      .insert([
        {
          account_role: role,
          fname: fname,
          lname: lname,
          email: email,
          password: password,
          tel: phone,
          line_id: line,
          fb_name: facebook,
          date_create: new Date(),
        },
      ])
      .select()
      .single();

    if (accountError) {
      console.error("Account Insert Error:", accountError);
      return res.status(500).json({ error: accountError.message });
    }

    console.log("Account Inserted:", account);

    const accountId = account.account_id;

    // ===============================
    const { data: channels, error: channelError } = await supabase
      .from("contactchannel")
      .select("*");

    if (channelError) {
      console.error("ContactChannel Fetch Error:", channelError);
      return res.status(500).json({ error: channelError.message });
    }

    console.log("Contact Channels:", channels);

    const contactsToInsert = [];

    channels.forEach((ch) => {
      if (ch.application_name === "Phone" && phone) {
        contactsToInsert.push({
          account_id: accountId,
          chanel_id: ch.contact_channel_id,
          contact_value: phone,
        });
      }

      if (ch.application_name === "LINE" && line) {
        contactsToInsert.push({
          account_id: accountId,
          chanel_id: ch.contact_channel_id,
          contact_value: line,
        });
      }

      if (ch.application_name === "Facebook" && facebook) {
        contactsToInsert.push({
          account_id: accountId,
          chanel_id: ch.contact_channel_id,
          contact_value: facebook,
        });
      }
    });

    // ===============================
    if (contactsToInsert.length > 0) {
      const { error: contactError } = await supabase
        .from("accountcontact")
        .insert(contactsToInsert);

      if (contactError) {
        console.error("AccountContact Insert Error:", contactError);
        return res.status(500).json({ error: contactError.message });
      }

      console.log("Contacts Inserted:", contactsToInsert);
    } else {
      console.log(" No contacts to insert");
    }

    // ===============================
    res.status(201).json({
      success: true,
      message: "Register successful",
      account_id: accountId,
    });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/TutorHome", async (req, res) => {
  try {
    const { tutor_id } = req.body;
    if (!tutor_id) {
      return res.status(400).json({ error: "tutor_id is required" });
    }

    const { data, error } = await supabase
      .from("classsession")
      .select(
        `
        session_id,
        session_date,
        description,
        note,
        enrollment!inner (
          enrollment_id,
          student (
            student_nickname,
            grade_level(
              grade_level_name
            )
          ),
          enrollmentschedule (
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

    const result = [];
    const studentMap = new Map();

    for (const session of sessions) {
      const studentId = session.enrollment.student_id;
      const studentName = `${session.enrollment.student.first_name} ${session.enrollment.student.last_name}`;
      const course = session.enrollment.course;

      if (
        course_name &&
        course.course_name_thai !== course_name &&
        course.course_name_eng !== course_name
      ) {
        continue;
      }

      const sessionDate = new Date(session.session_date);
      const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth() + 1}`;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student_id: studentId,
          student_name: studentName,
          months: new Map(),
        });
      }

      const student = studentMap.get(studentId);

      if (!student.months.has(monthKey)) {
        student.months.set(monthKey, {
          month: sessionDate.getMonth() + 1,
          year: sessionDate.getFullYear(),
          courses: new Map(),
        });
      }

      const month = student.months.get(monthKey);
      const courseKey = course.course_id;

      if (!month.courses.has(courseKey)) {
        month.courses.set(courseKey, {
          course_name_thai: course.course_name_thai,
          course_name_eng: course.course_name_eng,
          price: course.price,
          total_hours: 0,
          sessions: [],
        });
      }

      const { data: schedule } = await supabase
        .from("EnrollmentSchedule")
        .select("start_time, end_time")
        .eq("enrollment_id", session.enrollment_id)
        .eq("day_of_week", sessionDate.getDay().toString());

      if (schedule && schedule.length > 0) {
        const start = new Date(`1970-01-01T${schedule[0].start_time}`);
        const end = new Date(`1970-01-01T${schedule[0].end_time}`);
        const hours = (end - start) / (1000 * 60 * 60);

        const courseData = month.courses.get(courseKey);
        courseData.total_hours += hours;
        courseData.sessions.push({
          date: session.session_date,
          hours: hours,
        });
      }
    }

    for (const [studentId, student] of studentMap) {
      for (const [monthKey, month] of student.months) {
        for (const [courseKey, course] of month.courses) {
          const { data: payments } = await supabase
            .from("Payment")
            .select(
              `
              payment_id,
              PaymentDetail!inner (
                payment_bill_date,
                payment_status
              )
            `,
            )
            .eq("enrollment.course_id", courseKey)
            .eq("PaymentDetail.payment_status", "PAID");

          const isPaid =
            payments &&
            payments.some((p) => {
              const paymentDate = new Date(
                p.PaymentDetail[0].payment_bill_date,
              );
              return (
                paymentDate.getMonth() + 1 === month.month &&
                paymentDate.getFullYear() === month.year
              );
            });

          result.push({
            student_id: studentId,
            student_name: student.student_name,
            month: month.month,
            year: month.year,
            course_name_thai: course.course_name_thai,
            course_name_eng: course.course_name_eng,
            total_hours: Math.round(course.total_hours * 100) / 100,
            price_per_hour: course.price,
            total_amount:
              Math.round(course.total_hours * course.price * 100) / 100,
            payment_status: isPaid ? "PAID" : "PENDING",
            session_count: course.sessions.length,
          });
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching monthly pending hours:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/getDetailPayment", async (req, res) => {
  try {
    const { current_tutor_id, p_student_id, p_course_name } = req.query;

    if (!current_tutor_id) {
      return res.status(400).json({ error: "current_tutor_id is required" });
    }

    const { data, error } = await supabase.rpc("get_monthly_payment_details", {
      p_tutor_id: current_tutor_id,
      p_student_id: p_student_id || null,
      p_course_name: p_course_name || null,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
