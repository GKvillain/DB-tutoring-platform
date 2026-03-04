import "./HomeParent.css";
import "../App.css";
import "./GeneralImage.css";
import Navigation from "../components/ParentSidebar";
import { useState, useEffect } from "react";

export function HomeParent() {
  const [allSessions, setAllSessions] = useState([]);
  const [displaySessions, setDisplaySessions] = useState([]);
  const [openSessionId, setOpenSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      const filtered = allSessions.filter(session => 
        session.student_name === selectedStudent
      );
      setDisplaySessions(filtered);
    } else {
      setDisplaySessions(allSessions);
    }
  }, [selectedStudent, allSessions]);

  const fetchSessions = async () => {
    try {
      const parent_id = localStorage.getItem("parent_id");
      
      if (!parent_id) {
        console.error("No parent_id found in localStorage");
        return;
      }

      const url = `http://localhost:3000/api/parent/classsessions?parent_id=${parent_id}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        console.error("API Error:", data.error);
        return;
      }

      const sessionsData = Array.isArray(data) ? data : [];
      
      setAllSessions(sessionsData);
      setDisplaySessions(sessionsData);
      
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const uniqueStudents = [
    ...new Map(allSessions.map((s) => [s.student_name, s])).values(),
  ].map(s => ({
    student_name: s.student_name,
    nickname: s.nickname,
    student_id: s.student_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'
  }));

  // ใช้วันที่ UTC เพื่อป้องกัน timezone shift
  const getTodayUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const today = getTodayUTC();
  const todayStr = today.toISOString().split("T")[0];

  const next7Days = new Date(today);
  next7Days.setUTCDate(today.getUTCDate() + 7);
  const next7DaysStr = next7Days.toISOString().split("T")[0];

  // แปลง session_date จาก API เป็น UTC date string
  const getSessionDateUTC = (dateString) => {
    if (!dateString) return null;
    // ใช้ส่วนวันที่โดยตรง ไม่แปลง timezone
    return dateString.split('T')[0];
  };

  const pastSessions = displaySessions.filter(
    (s) => {
      const sessionDate = getSessionDateUTC(s?.session_date);
      return sessionDate && sessionDate < todayStr;
    }
  );

  const todaySessions = displaySessions.filter(
    (s) => {
      const sessionDate = getSessionDateUTC(s?.session_date);
      return sessionDate === todayStr;
    }
  );

  const upcomingSessions = displaySessions.filter(
    (s) => {
      const sessionDate = getSessionDateUTC(s?.session_date);
      return sessionDate && sessionDate > todayStr && sessionDate <= next7DaysStr;
    }
  );

  const groupByDate = (sessionsArray) => {
    return sessionsArray.reduce((acc, session) => {
      const date = getSessionDateUTC(session.session_date) || "ไม่ระบุวันที่";
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      return acc;
    }, {});
  };

  // ฟังก์ชันจัดรูปแบบเวลา
  const formatTime = (dateString) => {
    if (!dateString) return "-";
    try {
      // ใช้ UTC เพื่อป้องกัน timezone
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      const [hour, minute] = dateString.split('T')[1]?.split(':').map(Number) || [0, 0];
      const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
      return date.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      });
    } catch {
      return "-";
    }
  };

  // ฟังก์ชันคำนวณเวลาสิ้นสุด (สมมติว่าคาบละ 2 ชั่วโมง)
  const calculateEndTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      const [hour, minute] = dateString.split('T')[1]?.split(':').map(Number) || [0, 0];
      const date = new Date(Date.UTC(year, month - 1, day, hour + 2, minute));
      return date.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      });
    } catch {
      return "-";
    }
  };

  // ฟังก์ชันแสดงสถานะการเข้าเรียน
  const renderAttendanceStatus = (session) => {
    const sessionDate = getSessionDateUTC(session?.session_date);
    if (!sessionDate || sessionDate >= todayStr) {
      return null;
    }

    let statusText = '';
    let statusClass = '';

    switch(session.attendance_status) {
      case 'Present':
        statusText = 'มาเรียน';
        statusClass = 'present';
        break;
      case 'Absent':
        statusText = 'ขาดเรียน';
        statusClass = 'absent';
        break;
      case 'Late':
        statusText = 'มาสาย';
        statusClass = 'late';
        break;
      default:
        statusText = 'ไม่มีข้อมูล';
        statusClass = 'unknown';
    }

    return (
      <span className={`attendance-badge ${statusClass}`}>
        {statusText}
      </span>
    );
  };

  const renderGroupedSessions = (sessionsArray) => {
    const grouped = groupByDate(sessionsArray);

    return Object.entries(grouped).map(([date, sessions]) => (
      <div className="date-group-card" key={date}>
        <h3 className="date-group-title">
          วันที่ {date} ({sessions.length} คาบ)
        </h3>

        <div className="session-list">
          {sessions.map(renderSessionCard)}
        </div>
      </div>
    ));
  };

  const renderSessionCard = (session) => {
  return (
    <div className="session-card" key={session.session_id}>
      <div className="session-header">
        {/* รูปคอร์ส */}
        <div className="course-image-wrapper">
          {session.course_image ? (
            <div className="imgUpload has-image">
              <img 
                src={session.course_image} 
                alt={session.course_name}
              />
            </div>
          ) : (
            <div className="imgUpload">
              <span></span>
            </div>
          )}
        </div>

        <div className="session-info">
          <div className="session-header-top">
            <h3>{session.course_name || "-"}</h3>
            <button
              className="toggle-btn"
              onClick={() =>
                setOpenSessionId(
                  openSessionId === session.session_id
                    ? null
                    : session.session_id
                )
              }
            >
              {openSessionId === session.session_id ? "ซ่อน" : "แสดง"}
            </button>
          </div>

          <div className="session-meta">
            <p className="student-name">
              👤 {session.student_name || "-"} ({session.nickname || "-"})
              {renderAttendanceStatus(session)}
            </p>
            
            <div className="session-time-info">
              <span className="time-range">
                เวลา {session.start_time || "00:00"} - {session.end_time || "00:00"}
              </span>
              
              {session.description && session.description !== "Auto Generated Class" && (
                <span className="description-badge">
                  📝 {session.description}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

        {openSessionId === session.session_id && (
          <div className="session-detail-wrapper">
            <div className="inner-detail-card">
              {session.records?.length > 0 ? (
                session.records.map((rec) => (
                  <div key={rec.record_id} className="record-card">
                    <div className="record-header">
                      <span className="lesson-topic">
                        📖 {rec.lesson_topic || "-"}
                      </span>
                      <span
                        className={`status-badge ${
                          rec.homework_status === "Done" ? "done" : "missing"
                        }`}
                      >
                        {rec.homework_status === "Done" ? "ส่งแล้ว" : "ยังไม่ส่ง"}
                      </span>
                    </div>
                    <div className="record-detail">
                      {rec.homework_detail && (
                        <p>
                          <strong>รายละเอียดการบ้าน:</strong> {rec.homework_detail}
                        </p>
                      )}
                      {rec.tutor_comment && (
                        <p>
                          <strong>ความคิดเห็นครู:</strong> {rec.tutor_comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-text">ยังไม่มีบันทึกผลการเรียน</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navigation />
      <div className="page-with-sidebar">
        <article className="session-container">

          <div className="filter-section">
            <label htmlFor="student-filter">เลือกนักเรียน: </label>
            <select
              id="student-filter"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="student-select"
            >
              <option value="">ทั้งหมด ({allSessions.length} คาบ)</option>
              {uniqueStudents.map((student) => {
                const sessionCount = allSessions.filter(
                  s => s.student_name === student.student_name
                ).length;
                
                return (
                  <option 
                    key={student.student_id} 
                    value={student.student_name}
                  >
                    {student.student_name} ({student.nickname}) - {sessionCount} คาบ
                  </option>
                );
              })}
            </select>
            
            {selectedStudent && (
              <div className="filter-info">
                แสดง {displaySessions.length} คาบ จากทั้งหมด {allSessions.length} คาบ
                <button 
                  className="clear-filter-btn"
                  onClick={() => setSelectedStudent("")}
                >
                  ล้างตัวกรอง
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="loading-text">กำลังโหลดข้อมูล...</p>
          ) : (
            <div className="session-grid">
              <div className="left-column">
                <section className="section-card">
                  <h1 className="session-title">คาบเรียนวันนี้</h1>
                  {todaySessions.length === 0
                    ? <p className="empty-text">ไม่มีคาบเรียนวันนี้</p>
                    : renderGroupedSessions(todaySessions)}
                </section>

                <section className="section-card">
                  <h1 className="session-title">คาบเรียนที่ผ่านมา</h1>
                  {pastSessions.length === 0
                    ? <p className="empty-text">ยังไม่มีข้อมูลคาบเรียน</p>
                    : renderGroupedSessions(pastSessions)}
                </section>
              </div>

              <div className="right-column">
                <h1 className="session-title upcoming-title">
                  คาบเรียนที่จะถึง (7 วัน)
                </h1>
                {upcomingSessions.length === 0
                  ? <p className="empty-text">ไม่มีคาบเรียนใน 7 วันข้างหน้า</p>
                  : renderGroupedSessions(upcomingSessions)}
              </div>
            </div>
          )}
        </article>
      </div>
    </>
  );
}