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

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
