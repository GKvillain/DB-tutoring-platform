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
  try {
    const { month, year, tutor_id } = req.query;

    const { data, error } = await supabase.rpc("get_course_monthly_summary", {
      p_month: month,
      p_year: year,
      current_tutor_id: tutor_id,
    });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// REMOVED DUPLICATE LOGIN ENDPOINT - Keeping only one
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

    // Insert account
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

    // Fetch contact channels
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

    // Insert contacts
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
      console.log("No contacts to insert");
    }

    // Send success response
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
    .update({ note: note })
    .eq("session_id", session_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.get("/api/TutorWeekCalen", async (req, res) => {
  const { tutor_id } = req.query;

  if (!tutor_id) return res.status(400).json({ error: "tutor_id is required" });

  const today = new Date();
  const first = today.getDate() - today.getDay();
  const last = first + 6;
  const firstDay = new Date(new Date().setDate(first))
    .toISOString()
    .split("T")[0];

  const lastDay = new Date(new Date().setDate(last))
    .toISOString()
    .split("T")[0];

  try {
    const { data, error } = await supabase
      .from("classsession")
      .select(
        `
        session_id,
        session_date,
        description,
        enrollment (
          enrollment_id,
          student ( student_nickname ),
          enrollmentschedule ( start_time, end_time, day_of_week )
        )
      `,
      )
      .eq("tutor_id", tutor_id)
      .gte("session_date", firstDay)
      .lte("session_date", lastDay);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tutor ID from account ID
app.get("/api/getTutorId", async (req, res) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: "account_id is required" });
    }

    const { data, error } = await supabase
      .from("tutor") // Fixed: Changed from "Tutor" to "tutor" (lowercase)
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

app.get("/api/income-finance/statistics/:tutorId", async (req, res) => {
  try {
    const { tutorId } = req.params;

    const { data, error } = await supabase.rpc("get_income_statistics", {
      p_tutor_id: tutorId,
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
