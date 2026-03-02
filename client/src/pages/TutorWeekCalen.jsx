import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./TutorWeekCalen.css";
import Navigation from "../components/Navigation";
import { useNavigate } from "react-router-dom";

const TutorWeekCalen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState("week");
  const tutor_id = location.state?.tutor_id;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // ฟังก์ชันเช็คว่าช่วงเวลาย่อย 30 นาทีนี้ มีเรียนหรือไม่
  const getLessonInSubSlot = (dayVal, subStart, subEnd) => {
    return sessions.find((session) => {
      const schedules = session.enrollment?.enrollmentschedule || [];
      return schedules.some((sch) => {
        const schDay = parseInt(sch.day_of_week);
        const start = sch.start_time.slice(0, 5); // เช่น "15:00"
        const end = sch.end_time.slice(0, 5); // เช่น "16:00"
        return schDay === dayVal && start < subEnd && end > subStart;
      });
    });
  };

  if (loading) return <div className="loading">กำลังดึงข้อมูล...</div>;

  return (
    <>
      <Navigation />
      <div className="container-calen">
        <h1 className="title">ตารางสอนรายสัปดาห์</h1>
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
                      // แบ่งช่อง 90 นาที ออกเป็น 3 ช่องย่อย (30 นาที)
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
                                shownInDay.add(lesson.enrollment_id); // จำไว้ว่าวันนี้แสดงชื่อวิชานี้ไปแล้ว
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
