import supabase from "../config/supabaseClient.js";
import multer from "multer";

export const getParentHomeData = async (req, res) => {
  try {
    const { parent_id, student_id } = req.query;

    if (!parent_id) {
      return res.status(400).json({ error: "parent_id is required" });
    }

    let studentQuery = supabase
      .from("student")
      .select("student_id")
      .eq("parent_id", parent_id);

    if (student_id) {
      studentQuery = studentQuery.eq("student_id", student_id);
    }

    const { data: students, error: studentError } = await studentQuery;

    if (studentError) throw studentError;

    if (!students || students.length === 0) {
      return res.json([]);
    }

    const studentIds = students.map(s => s.student_id);

    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollment")
      .select("enrollment_id")
      .in("student_id", studentIds);

    if (enrollError) throw enrollError;

    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }

    const enrollmentIds = enrollments.map(e => e.enrollment_id);

    // ดึง class sessions พร้อม enrollmentschedule เพื่อเอาเวลา
    const { data, error } = await supabase
      .from("classsession")
      .select(`
        session_id,
        session_date,
        description,
        note,
        enrollment (
          enrollment_id,
          student (
            student_id,
            student_fname,
            student_lname,
            student_nickname
          ),
          course (
            course_name_thai,
            course_image
          ),
          enrollmentschedule (
            start_time,
            end_time
          )
        ),
        learningrecords (
          attendance_id,
          learningrecorddetail (
            record_id,
            lesson_topic,
            homework_status,
            homework_detail,
            tutor_comment
          )
        )
      `)
      .in("enrollment_id", enrollmentIds);

    if (error) throw error;

    const attendanceIds = data
      .flatMap(item => item.learningrecords || [])
      .map(lr => lr.attendance_id)
      .filter(id => id);

    let attendanceStatusMap = {};

    if (attendanceIds.length > 0) {
      const { data: statusData, error: statusError } = await supabase
        .from("attendancedetail")
        .select("attendance_id, attendance_status")
        .in("attendance_id", attendanceIds);

      if (statusError) {
        console.error("Status query error:", statusError);
      } else if (statusData) {
        attendanceStatusMap = statusData.reduce((acc, item) => {
          acc[item.attendance_id] = item.attendance_status;
          return acc;
        }, {});
      }
    }

    // ฟังก์ชันจัดรูปแบบวันที่และเวลาให้ถูกต้อง
    const formatSessionDateTime = (sessionDate, schedule) => {
      if (!sessionDate) return { date: null, startTime: null, endTime: null };
      
      // แยกวันที่จาก session_date (รูปแบบ YYYY-MM-DD)
      const [year, month, day] = sessionDate.split('T')[0].split('-').map(Number);
      
      let startTime = null;
      let endTime = null;
      
      if (schedule && schedule.length > 0) {
        const sch = schedule[0];
        
        // แยกเวลา start_time
        if (sch.start_time) {
          const [startHour, startMinute] = sch.start_time.split(':').map(Number);
          // สร้าง Date object ใน UTC เพื่อป้องกัน timezone shift
          const startDateTime = new Date(Date.UTC(year, month - 1, day, startHour, startMinute));
          startTime = startDateTime.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false,
            timeZone: 'UTC'
          });
        }
        
        // แยกเวลา end_time
        if (sch.end_time) {
          const [endHour, endMinute] = sch.end_time.split(':').map(Number);
          const endDateTime = new Date(Date.UTC(year, month - 1, day, endHour, endMinute));
          endTime = endDateTime.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false,
            timeZone: 'UTC'
          });
        }
      }
      
      return {
        date: `${day}/${month}/${year}`,
        startTime,
        endTime
      };
    };

    // จัดรูปแบบข้อมูล
    const formatted = data.map((item) => {
      const records =
        item.learningrecords?.flatMap(
          (lr) => lr.learningrecorddetail || []
        ) || [];

      let attendance_status = null;
      const today = new Date();
      const sessionDate = new Date(item.session_date);

      if (sessionDate <= today) {
        if (item.learningrecords && item.learningrecords.length > 0) {
          const attendanceId = item.learningrecords[0]?.attendance_id;
          if (attendanceId && attendanceStatusMap[attendanceId]) {
            attendance_status = attendanceStatusMap[attendanceId];
          }
        }
      }

      // จัดรูปแบบวันที่และเวลา
      const formattedDateTime = formatSessionDateTime(
        item.session_date, 
        item.enrollment?.enrollmentschedule
      );

      return {
        session_id: item.session_id,
        session_date: item.session_date,
        display_date: formattedDateTime.date,
        start_time: formattedDateTime.startTime,
        end_time: formattedDateTime.endTime,
        description: item.description,
        note: item.note,
        attendance_status: attendance_status,
        student_id: item.enrollment?.student?.student_id,
        student_name: `${item.enrollment?.student?.student_fname ?? ""} ${item.enrollment?.student?.student_lname ?? ""}`.trim(),
        nickname: item.enrollment?.student?.student_nickname,
        course_name: item.enrollment?.course?.course_name_thai ?? null,
        course_image: item.enrollment?.course?.course_image ?? null,
        records,
        is_past_session: sessionDate <= today,
      };
    });

    res.json(formatted);

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};