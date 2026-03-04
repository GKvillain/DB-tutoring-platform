import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./TutorWeekCalen.css";
import Navigation from "../components/Navigation";

const TutorWeekCalen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // รับ tutor_id จากทั้ง localStorage และ state ที่ส่งมา
  const [tutor_id, setTutorId] = useState(null);
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("weekly"); // เปลี่ยนจาก viewType เป็น viewMode
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // คำนวณช่วงวันที่ของสัปดาห์ปัจจุบัน
  const { startOfWeek, endOfWeek } = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // เริ่มวันอาทิตย์
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // สิ้นสุดวันเสาร์
    end.setHours(23, 59, 59, 999);

    return { startOfWeek: start, endOfWeek: end };
  }, []);

  // คำนวณวันในเดือนปัจจุบัน
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [currentMonth]);

  const days = [
    { label: "อาทิตย์", val: 0 },
    { label: "จันทร์", val: 1 },
    { label: "อังคาร", val: 2 },
    { label: "พุธ", val: 3 },
    { label: "พฤหัสบดี", val: 4 },
    { label: "ศุกร์", val: 5 },
    { label: "เสาร์", val: 6 },
  ];

  const timeSlots = [
    "09:00",
    "10:30",
    "12:00",
    "13:30",
    "15:00",
    "16:30",
    "18:00",
    "19:30",
    "21:00",
  ];

  // useEffect สำหรับตั้งค่า tutor_id จากทั้งสองแหล่ง
  useEffect(() => {
    if (location.state?.tutor_id) {
      setTutorId(location.state.tutor_id);
      localStorage.setItem("tutor_id", location.state.tutor_id);
    } else {
      const storedTutorId = localStorage.getItem("tutor_id");
      if (storedTutorId) {
        setTutorId(storedTutorId);
      } else {
        setError("ไม่พบข้อมูลครูผู้สอน กรุณาเข้าสู่ระบบอีกครั้ง");
        setLoading(false);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchTutorSchedule = async () => {
      if (!tutor_id) {
        console.error("No tutor_id found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching schedule for tutor_id:", tutor_id);
        
        const response = await fetch(
          `http://localhost:3000/api/begin/TutorWeekCalen?tutor_id=${tutor_id}`,
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Network response was not ok");
        }
        
        const data = await response.json();
        console.log("Fetched data:", data);
        setSessions(data);
      } catch (error) {
        console.error("Error fetching schedule:", error);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (tutor_id) {
      fetchTutorSchedule();
    }
  }, [tutor_id]);

  // แปลงเวลา HH:MM:SS เป็น HH:MM
  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.slice(0, 5);
  };

  // ค้นหาว่า slot นี้อยู่ในช่วงของ lesson หรือไม่
  const isSlotInLesson = (lesson, slotStart, slotEnd) => {
    return lesson.start_time < slotEnd && lesson.end_time > slotStart;
  };

  // กรองเฉพาะ Session ที่อยู่ในสัปดาห์นี้
  const sessionsThisWeek = useMemo(() => {
    return sessions.filter((session) => {
      if (!session.session_date) return false;
      const sessionDate = new Date(session.session_date);
      sessionDate.setHours(0, 0, 0, 0);
      
      const start = new Date(startOfWeek);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endOfWeek);
      end.setHours(0, 0, 0, 0);
      
      return sessionDate >= start && sessionDate <= end;
    });
  }, [sessions, startOfWeek, endOfWeek]);

  // สร้างรายการคาบเรียนที่ไม่ซ้ำกัน (สำหรับรายสัปดาห์)
  const uniqueLessons = useMemo(() => {
    const lessonMap = new Map();
    
    sessionsThisWeek.forEach(session => {
      // ดึง schedules จาก enrollment.enrollmentschedule
      const schedules = session.enrollment?.enrollmentschedule || [];
      const dayVal = new Date(session.session_date).getDay();
      
      schedules.forEach(schedule => {
        if (parseInt(schedule.day_of_week) === dayVal) {
          const key = `${session.enrollment_id}-${dayVal}-${schedule.start_time}`;
          if (!lessonMap.has(key)) {
            lessonMap.set(key, {
              session_id: session.session_id,
              course_name: session.enrollment?.course?.course_name_thai || "วิชาสอน",
              student_name: session.enrollment?.student?.student_nickname || "นักเรียน",
              description: session.description || "",
              day_of_week: dayVal,
              start_time: formatTime(schedule.start_time),
              end_time: formatTime(schedule.end_time),
              date: session.session_date
            });
          }
        }
      });
    });
    
    return Array.from(lessonMap.values());
  }, [sessionsThisWeek]);

  // จัดกลุ่มคาบเรียนตามวันสำหรับมุมมองรายเดือน (ใช้ session_date โดยตรง)
  const lessonsByDate = useMemo(() => {
    const byDate = {};
    
    sessions.forEach(session => {
      if (session.session_date) {
        const dateStr = session.session_date.split('T')[0];
        const schedules = session.enrollment?.enrollmentschedule || [];
        const dayVal = new Date(session.session_date).getDay();
        
        schedules.forEach(schedule => {
          if (parseInt(schedule.day_of_week) === dayVal) {
            if (!byDate[dateStr]) {
              byDate[dateStr] = [];
            }
            
            const lesson = {
              course_name: session.enrollment?.course?.course_name_thai || "วิชาสอน",
              student_name: session.enrollment?.student?.student_nickname || "นักเรียน",
              start_time: formatTime(schedule.start_time),
              end_time: formatTime(schedule.end_time)
            };
            
            // ป้องกันข้อมูลซ้ำ
            if (!byDate[dateStr].some(l => l.start_time === schedule.start_time)) {
              byDate[dateStr].push(lesson);
            }
          }
        });
      }
    });
    
    return byDate;
  }, [sessions]);

  // เปลี่ยนเดือน
  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  if (loading) return <div className="loading">กำลังดึงข้อมูลตารางสอน...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!tutor_id) return <div className="error">ไม่พบข้อมูลครูผู้สอน</div>;

  return (
    <>
      <Navigation />
      <div className="container-calen">
        <div className="schedule-header-flex">
          <h1 className="title">ตารางสอน</h1>
          <div className="dropdown-wrapper">
            <select
              className="view-selector"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="weekly">มุมมองรายสัปดาห์</option>
              <option value="monthly">มุมมองรายเดือน</option>
            </select>
          </div>
        </div>

        {viewMode === "weekly" ? (
          <>
            <p className="date-display">
              สัปดาห์นี้:{" "}
              <strong>{startOfWeek.toLocaleDateString("th-TH")}</strong> ถึง{" "}
              <strong>{endOfWeek.toLocaleDateString("th-TH")}</strong>
            </p>

            <div className="table-wrapper">
              <table className="calendar-table">
                <thead>
                  <tr>
                    <th className="sticky-col">วัน / เวลา</th>
                    {timeSlots.slice(0, -1).map((time, i) => (
                      <th key={i}>
                        {time} - {timeSlots[i + 1]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const dayLessons = uniqueLessons.filter(l => l.day_of_week === day.val);
                    const columnUsed = new Array(timeSlots.length - 1).fill(false);
                    
                    return (
                      <tr key={day.val}>
                        <td className="day-label sticky-col">{day.label}</td>
                        {timeSlots.slice(0, -1).map((slotStart, i) => {
                          const slotEnd = timeSlots[i + 1];
                          
                          if (columnUsed[i]) return null;
                          
                          const startingLesson = dayLessons.find(lesson => 
                            lesson.start_time >= slotStart && lesson.start_time < slotEnd
                          );

                          if (startingLesson) {
                            let colSpan = 1;
                            for (let j = i + 1; j < timeSlots.length - 1; j++) {
                              const nextSlotStart = timeSlots[j];
                              const nextSlotEnd = timeSlots[j + 1];
                              if (isSlotInLesson(startingLesson, nextSlotStart, nextSlotEnd)) {
                                colSpan++;
                                columnUsed[j] = true;
                              } else {
                                break;
                              }
                            }

                            return (
                              <td
                                key={i}
                                colSpan={colSpan}
                                className="slot-td has-lesson tutor-highlight"
                              >
                                <div className="lesson-block">
                                  <span className="course-name">{startingLesson.course_name}</span>
                                  <span className="student-name">{startingLesson.student_name}</span>
                                  <span className="lesson-time">
                                    {startingLesson.start_time} - {startingLesson.end_time}
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          return <td key={i} className="slot-td"></td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          // มุมมองรายเดือน
          <div className="monthly-view">
            <div className="month-header">
              <button onClick={() => changeMonth(-1)} className="month-nav-btn">‹</button>
              <h2 className="month-title">
                {currentMonth.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
              </h2>
              <button onClick={() => changeMonth(1)} className="month-nav-btn">›</button>
            </div>

            <div className="month-grid">
              <div className="month-weekdays">
                {days.map(day => (
                  <div key={day.val} className="month-weekday">{day.label}</div>
                ))}
              </div>

              <div className="month-days">
                {daysInMonth.map((date, index) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  
                  const dayLessons = lessonsByDate[dateStr] || [];
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div key={index} className={`month-day ${isToday ? 'today' : ''}`}>
                      <div className="month-day-number">{date.getDate()}</div>
                      <div className="month-day-lessons">
                        {dayLessons.map((lesson, idx) => (
                          <div key={idx} className="month-lesson-item">
                            <span className="month-course-name">{lesson.course_name}</span>
                            <span className="month-student-name"> {lesson.student_name}</span>
                            <span className="month-lesson-time">
                              {lesson.start_time} - {lesson.end_time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <p className="no-data-info">ไม่มีตารางสอน</p>
        )}
      </div>

      
    </>
  );
};

export default TutorWeekCalen;
