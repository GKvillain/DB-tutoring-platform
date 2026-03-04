import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentWeekCalen.css";
import Navigation from "../components/ParentSidebar";

const StudentWeekCalen = () => {
  const navigate = useNavigate();
  const parent_id = localStorage.getItem("parent_id");
  
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [viewMode, setViewMode] = useState("weekly");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // คำนวณช่วงวันที่ของสัปดาห์ปัจจุบัน
  const { startOfWeek, endOfWeek } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
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

  // ดึงรายชื่อนักเรียน
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const res = await fetch(
          `http://localhost:3000/api/parent/students?parent_id=${parent_id}`
        );

        if (!res.ok) throw new Error("Fetch students failed");

        const data = await res.json();
        setStudents(data);

        if (data.length > 0) {
          setSelectedStudentId(data[0].student_id);
        }
      } catch (err) {
        console.error("Fetch students error:", err);
        alert("โหลดรายชื่อนักเรียนไม่สำเร็จ");
      } finally {
        setLoadingStudents(false);
      }
    };

    if (parent_id) {
      fetchStudents();
    }
  }, [parent_id]);

  // ดึงตารางเรียน
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedStudentId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3000/api/student/schedule?student_id=${selectedStudentId}`
        );
        
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        console.log("Schedule data:", data);
        setSessions(data);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedStudentId) {
      fetchSchedule();
    }
  }, [selectedStudentId]);

  // แปลงเวลา HH:MM:SS เป็น HH:MM
  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.slice(0, 5);
  };

  // ค้นหาว่า slot นี้อยู่ในช่วงของ lesson หรือไม่
  const isSlotInLesson = (lesson, slotStart, slotEnd) => {
    return lesson.start_time < slotEnd && lesson.end_time > slotStart;
  };

  // กรองเฉพาะ sessions ที่มี schedules
  const sessionsWithSchedule = useMemo(() => {
    return sessions.filter(session => session.schedules && session.schedules.length > 0);
  }, [sessions]);

  // สร้างรายการคาบเรียนที่ไม่ซ้ำกัน (สำหรับรายสัปดาห์)
  const uniqueLessons = useMemo(() => {
    const lessonMap = new Map();
    
    sessionsWithSchedule.forEach(session => {
      session.schedules.forEach(schedule => {
        const key = `${session.enrollment_id}-${schedule.day_of_week}-${schedule.start_time}`;
        if (!lessonMap.has(key)) {
          lessonMap.set(key, {
            session_id: session.session_id,
            course_name: session.enrollment?.course?.course_name_thai || "ไม่ระบุคอร์ส",
            description: session.description || "เรียน",
            day_of_week: parseInt(schedule.day_of_week),
            start_time: formatTime(schedule.start_time),
            end_time: formatTime(schedule.end_time),
            date: session.session_date
          });
        }
      });
    });
    
    return Array.from(lessonMap.values());
  }, [sessionsWithSchedule]);

  // จัดกลุ่มคาบเรียนตามวันสำหรับมุมมองรายเดือน (ใช้ session_date โดยตรง)
  const lessonsByDate = useMemo(() => {
    const byDate = {};
    
    sessionsWithSchedule.forEach(session => {
      if (session.session_date) {
        // ใช้ session_date โดยตรง ไม่แปลง
        const dateStr = session.session_date.split('T')[0];
        
        if (!byDate[dateStr]) {
          byDate[dateStr] = [];
        }
        
        session.schedules.forEach(schedule => {
          const lesson = {
            course_name: session.enrollment?.course?.course_name_thai || "ไม่ระบุคอร์ส",
            start_time: formatTime(schedule.start_time),
            end_time: formatTime(schedule.end_time)
          };
          
          // ป้องกันข้อมูลซ้ำ
          if (!byDate[dateStr].some(l => l.start_time === schedule.start_time)) {
            byDate[dateStr].push(lesson);
          }
        });
      }
    });
    
    return byDate;
  }, [sessionsWithSchedule]);

  const selectedStudent = students.find(s => s.student_id === selectedStudentId);

  // เปลี่ยนเดือน
  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  if (loadingStudents) {
    return (
      <>
        <Navigation />
        <div className="schedule-page">
          <div className="loading">กำลังโหลดรายชื่อนักเรียน...</div>
        </div>
      </>
    );
  }

  if (students.length === 0) {
    return (
      <>
        <Navigation />
        <div className="schedule-page">
          <div className="empty-state">
            <p>ไม่พบข้อมูลนักเรียน กรุณาเพิ่มนักเรียนก่อน</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="schedule-page">
        <div className="schedule-header">
          <h1 className="page-title">ตารางเรียน</h1>
          
          <div className="header-controls">
            <div className="student-selector">
              <label htmlFor="student-select">เลือกนักเรียน:</label>
              <select
                id="student-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="student-select"
              >
                {students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.student_fullname} ({student.student_nickname})
                  </option>
                ))}
              </select>
            </div>

            <div className="view-selector">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="view-select"
              >
                <option value="weekly">รายสัปดาห์</option>
                <option value="monthly">รายเดือน</option>
              </select>
            </div>
          </div>
        </div>

        {selectedStudent && (
          <div className="student-info">
            <p>
              ตารางเรียนของ: <strong>{selectedStudent.student_fullname}</strong>
              {selectedStudent.student_nickname && ` (${selectedStudent.student_nickname})`}
            </p>
          </div>
        )}

        {viewMode === "weekly" ? (
          <>
            <div className="week-info">
              <p>
                สัปดาห์นี้: {startOfWeek.toLocaleDateString("th-TH")} - {endOfWeek.toLocaleDateString("th-TH")}
              </p>
            </div>

            {loading ? (
              <div className="loading">กำลังโหลดตารางเรียน...</div>
            ) : (
              <div className="table-wrapper">
                <table className="schedule-table">
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
                                  className="slot-td has-lesson"
                                >
                                  <div className="lesson-block">
                                    <span className="course-name">{startingLesson.course_name}</span>
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
            )}
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

            {loading ? (
              <div className="loading">กำลังโหลดตารางเรียน...</div>
            ) : (
              <div className="month-grid">
                <div className="month-weekdays">
                  {days.map(day => (
                    <div key={day.val} className="month-weekday">{day.label}</div>
                  ))}
                </div>

                <div className="month-days">
                  {daysInMonth.map((date, index) => {
                    // สร้าง date string จากวันที่ในปฏิทินให้ตรงกับรูปแบบที่ได้จาก API
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
            )}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="no-sessions">
            <p>ไม่มีคอร์สที่ลงทะเบียน</p>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentWeekCalen;