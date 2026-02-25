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
    const { month, year } = req.query;

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    // Call all four RPC functions in parallel
    const [incomeRes, sessionsRes, hoursRes, studentsRes] = await Promise.all([
      supabase.rpc("get_total_income", {
        p_month: parseInt(month),
        p_year: parseInt(year),
      }),
      supabase.rpc("get_total_sessions", {
        p_month: parseInt(month),
        p_year: parseInt(year),
      }),
      supabase.rpc("get_total_hours_month_year", {
        p_month: parseInt(month),
        p_year: parseInt(year),
      }),
      supabase.rpc("get_student_count", {
        p_month: parseInt(month),
        p_year: parseInt(year),
      }),
    ]);

    // Check for errors
    if (incomeRes.error) {
      console.error("Income RPC error:", incomeRes.error);
      throw incomeRes.error;
    }
    if (sessionsRes.error) {
      console.error("Sessions RPC error:", sessionsRes.error);
      throw sessionsRes.error;
    }
    if (hoursRes.error) {
      console.error("Hours RPC error:", hoursRes.error);
      throw hoursRes.error;
    }
    if (studentsRes.error) {
      console.error("Students RPC error:", studentsRes.error);
      throw studentsRes.error;
    }

    // Log for debugging (remove in production)
    // console.log("Dashboard data for:", { month, year });
    // console.log("Income:", incomeRes.data);
    // console.log("Sessions:", sessionsRes.data);
    // console.log("Hours:", hoursRes.data);
    // console.log("Students:", studentsRes.data);

    // Send response with all four metrics
    res.json({
      total_income: incomeRes.data || 0,
      total_sessions: sessionsRes.data || 0,
      total_hours: hoursRes.data || 0,
      total_students: studentsRes.data || 0,
      month: month,
      year: year,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    res.status(500).json({
      error: err.message,
      details: "Failed to fetch dashboard statistics",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
