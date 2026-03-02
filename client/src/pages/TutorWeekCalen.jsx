import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./TutorWeekCalen.css";
import Navigation from "../components/Navigation";

const TutorWeekCalen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState("weekly");
  const tutor_id = location.state?.tutor_id;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. คำนวณช่วงวันที่ของสัปดาห์ปัจจุบัน (อาทิตย์ - เสาร์) ---
  const { startOfWeek, endOfWeek } = useMemo(() => {
    const now = new Date(); // วันนี้คือ 2026-03-03
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { startOfWeek: start, endOfWeek: end };
  }, []);

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

  useEffect(() => {
    const fetchTutorSchedule = async () => {
      if (!tutor_id) return;
      try {
        setLoading(true);
        // ดึงข้อมูลทั้งหมดของ Tutor คนนี้
        const response = await fetch(
          `http://localhost:3000/api/TutorWeekCalen?tutor_id=${tutor_id}`,
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutorSchedule();
  }, [tutor_id]);

  // --- 2. กรองข้อมูลเฉพาะสัปดาห์นี้ โดยใช้ session_date จากฐานข้อมูล ---
  const sessionsThisWeek = useMemo(() => {
    return sessions.filter((session) => {
      if (!session.session_date) return false;
      const sessionDate = new Date(session.session_date);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    });
  }, [sessions, startOfWeek, endOfWeek]);

  const getLessonInSubSlot = (dayVal, subStart, subEnd) => {
    return sessionsThisWeek.find((session) => {
      const schedules = session.enrollment?.enrollmentschedule || [];
      return schedules.some((sch) => {
        const schDay = parseInt(sch.day_of_week); // เทียบกับ 0-6 ในรูป
        const start = sch.start_time.slice(0, 5);
        const end = sch.end_time.slice(0, 5);
        return schDay === dayVal && start < subEnd && end > subStart;
      });
    });
  };

  if (loading) return <div className="loading">กำลังดึงข้อมูล...</div>;

const handleViewChange = (e) => {
    const selectedValue = e.target.value;
    setViewType(selectedValue);

    if (selectedValue === "monthly") {

      navigate("/TutorMonthCalen", { state: { tutor_id } });
    }
  };

  
  
  return (
    <>
      <Navigation />
      <div className="container-calen">
        <h1 className="title">ตารางสอนรายสัปดาห์</h1>
        <div className="dropdown-wrapper">
            <select
              className="view-selector"
              value={viewType}
              onChange={handleViewChange} 
            >
              <option value="weekly">สัปดาห์</option>
              <option value="monthly">รายเดือน</option>
            </select>
          </div>
        <p className="date-display">
          สัปดาห์นี้ วันที่: {startOfWeek.toLocaleDateString("th-TH")} -{" "}
          {endOfWeek.toLocaleDateString("th-TH")}
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
                const shownInDay = new Set();
                return (
                  <tr key={day.val}>
                    <td className="day-label sticky-col">{day.label}</td>
                    {timeSlots.slice(0, -1).map((slotStart, i) => {
                      const subIntervals = [];
                      let curr = new Date(`1970-01-01T${slotStart}`);
                      for (let j = 0; j < 3; j++) {
                        const s = curr.toTimeString().slice(0, 5);
                        curr.setMinutes(curr.getMinutes() + 30);
                        const e = curr.toTimeString().slice(0, 5);
                        subIntervals.push({ s, e });
                      }

                      return (
                        <td key={i} className="slot-td">
                          <div className="sub-slot-row-wrapper">
                            {subIntervals.map((interval, idx) => {
                              const lesson = getLessonInSubSlot(
                                day.val,
                                interval.s,
                                interval.e,
                              );
                              let shouldShowDetail = false;
                              if (
                                lesson &&
                                !shownInDay.has(lesson.enrollment_id)
                              ) {
                                shouldShowDetail = true;
                                shownInDay.add(lesson.enrollment_id);
                              }
                              return (
                                <div
                                  key={idx}
                                  className={`sub-slot-vertical ${lesson ? "has-lesson" : ""}`}
                                >
                                  {shouldShowDetail && (
                                    <div className="vertical-lesson-content">
                                      <span className="desc">
                                        {lesson.description}
                                      </span>
                                      <span className="nick">
                                        {
                                          lesson.enrollment?.student
                                            ?.student_nickname
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TutorWeekCalen;
