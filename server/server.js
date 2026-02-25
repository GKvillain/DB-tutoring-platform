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
        p_tutor_id: tutor_id, // Changed from current_tutor_id
      }),
      supabase.rpc("get_student_count", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id, // Changed from current_tutor_id
      }),
      supabase.rpc("get_total_sessions", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id, // Changed from current_tutor_id
      }),
      supabase.rpc("get_total_income", {
        p_month: monthNum,
        p_year: yearNum,
        p_tutor_id: tutor_id, // Changed from current_tutor_id
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
