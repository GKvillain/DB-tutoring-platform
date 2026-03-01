import "./PaymentTutor.css";
import Navigation from "../components/Navigation";
import { useEffect, useState, useMemo } from "react";
import nonggk from "../assets/nonggk.jpg";
import { DailyTracker } from "../utils/DailyTracker";
import { useDateInfo } from "../hooks/useDateInfo";

export function PaymentTutor() {
  const { todayFormatted, month, year, isLastDay } = useDateInfo();
  const accountId = localStorage.getItem("account_id");

  const [expandedId, setExpandedId] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [selectedCourseByStudent, setSelectedCourseByStudent] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const christianYear = year > 2500 ? year - 543 : year;

  const toggleCard = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCourseChange = (studentId, courseValue) => {
    setSelectedCourseByStudent((prev) => ({
      ...prev,
      [studentId]: courseValue,
    }));

    if (expandedId === studentId) {
      setExpandedId(null);
    }
  };

  useEffect(() => {
    async function fetchPaymentData() {
      if (!accountId || !month || !year) return;

      setLoading(true);
      setError(null);

      try {
        // 1️⃣ Get tutor ID
        const tutorRes = await fetch(
          `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
        );
        const tutorData = await tutorRes.json();

        if (!tutorRes.ok) {
          throw new Error(tutorData.error || "Failed to fetch tutor ID");
        }

        const tutor_id = tutorData.tutor_id || tutorData;

        // 2️⃣ Fetch pending hours
        const hoursRes = await fetch(
          `http://localhost:3000/api/getHoursPending?current_tutor_id=${tutor_id}`,
        );

        const hoursData = await hoursRes.json();

        if (!hoursRes.ok) {
          throw new Error(hoursData.error || "Failed to fetch hours");
        }

        setPendingData(Array.isArray(hoursData) ? hoursData : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setPendingData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentData();
  }, [month, year, accountId]);

  // 🔥 Group pending data by student
  const studentsWithCourses = useMemo(() => {
    const studentMap = new Map();

    pendingData.forEach((record) => {
      if (!studentMap.has(record.student_id)) {
        studentMap.set(record.student_id, {
          student_id: record.student_id,
          student_name: record.student_name,
          courses: [],
        });
      }

      studentMap.get(record.student_id).courses.push({
        course_name_thai: record.course_name_thai,
        total_pending_hours: record.total_pending_hours,
        course_price: record.course_price,
        total_outstanding: record.total_outstanding,
        payment_status: record.payment_status,
      });
    });

    // Initialize dropdown selection
    const initialSelections = {};
    Array.from(studentMap.keys()).forEach((studentId) => {
      initialSelections[studentId] = "";
    });
    setSelectedCourseByStudent(initialSelections);

    return Array.from(studentMap.values());
  }, [pendingData]);

  // 🔥 Filter courses per student
  const getFilteredCoursesForStudent = (student) => {
    const selectedCourse = selectedCourseByStudent[student.student_id];

    if (!selectedCourse) return student.courses;

    return student.courses.filter((c) => c.course_name_thai === selectedCourse);
  };

  // 🔥 Calculate totals
  const calculateStudentTotals = (student) => {
    const filteredCourses = getFilteredCoursesForStudent(student);

    const totals = filteredCourses.reduce(
      (acc, course) => ({
        total_pending_hours:
          acc.total_pending_hours + (course.total_pending_hours || 0),
        total_outstanding:
          acc.total_outstanding + (course.total_outstanding || 0),
      }),
      { total_pending_hours: 0, total_outstanding: 0 },
    );

    const coursePrice =
      filteredCourses.length === 1
        ? filteredCourses[0].course_price
        : filteredCourses.length > 1
          ? "หลายรายการ"
          : 0;

    return {
      ...totals,
      course_price: coursePrice,
    };
  };

  return (
    <>
      <title>Check Payment</title>
      <Navigation />

      <div className="payment-container">
        <h1 className="payment-title">อัปเดตสถานะการชำระเงิน</h1>

        <h3 className="payment-date">
          <DailyTracker />
        </h3>

        {loading && <p>กำลังโหลดข้อมูล...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <div className="payment-header">
          <div className="header-image-space"></div>
          <div className="header-name-space"></div>
          <div className="header-details">
            <span>คาบเรียนที่ยังไม่ชำระ (ชั่วโมง)</span>
            <span>ราคาต่อชั่วโมง (บาท)</span>
            <span>ยอดชำระทั้งหมด (บาท)</span>
            <span>สถานะการชำระเงิน</span>
          </div>
        </div>

        {studentsWithCourses.length > 0
          ? studentsWithCourses.map((student) => {
              const totals = calculateStudentTotals(student);
              const filteredCourses = getFilteredCoursesForStudent(student);
              const hasOutstanding = totals.total_outstanding > 0;

              // 🔥 remove duplicate courses for dropdown
              const uniqueCourses = [
                ...new Map(
                  student.courses.map((c) => [c.course_name_thai, c]),
                ).values(),
              ];

              return (
                <div
                  key={student.student_id}
                  className={`student-card ${
                    expandedId === student.student_id ? "active" : ""
                  }`}
                  onClick={() => toggleCard(student.student_id)}
                >
                  <div className="student-card-content">
                    <img
                      src={nonggk}
                      alt={student.student_name}
                      className="student-image"
                    />

                    <div className="student-name-container">
                      <p className="student-name">{student.student_name}</p>

                      <select
                        className="selectCourse"
                        value={
                          selectedCourseByStudent[student.student_id] || ""
                        }
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCourseChange(
                            student.student_id,
                            e.target.value,
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">ทั้งหมด</option>
                        {uniqueCourses.map((c, index) => (
                          <option
                            key={index}
                            value={c.course_name_thai}
                            className="selectCourse"
                          >
                            {c.course_name_thai}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="student-details">
                      <span>{totals.total_pending_hours}</span>
                      <span>{totals.course_price}</span>
                      <span>{totals.total_outstanding}</span>
                      <span>
                        {hasOutstanding ? "มียอดค้างชำระ" : "ไม่มียอดค้างชำระ"}
                      </span>
                    </div>
                  </div>

                  {expandedId === student.student_id && (
                    <div className="expanded-detail">
                      <p>รายละเอียดคาบเรียน</p>

                      {filteredCourses.map((course, index) => (
                        <div key={index} className="payment-details">
                          <div className="topic-inner-detail">
                            <h4>ครั้งที่</h4>
                            <h4>คอร์ส</h4>
                            <h4>เดือน</h4>
                            <h4>คาบเรียน</h4>
                            <h4>ราคาต่อชั่วโมง</h4>
                            <h4>ยอดชำระ</h4>
                            <h4>วันที่คำนวณ</h4>
                            <h4>วันที่ชำระ</h4>
                            <h4>สถานะ</h4>
                          </div>

                          <div className="topic-inner-detail">
                            <p>{index + 1}</p>
                            <p>{course.course_name_thai}</p>
                            <p>
                              เดือน {month}/{christianYear}
                            </p>
                            <p>{course.total_pending_hours}</p>
                            <p>{course.course_price}</p>
                            <p>{course.total_outstanding}</p>
                            <p>{isLastDay ? todayFormatted : "-"}</p>
                            <p>-</p>
                            <p>
                              {course.total_outstanding > 0
                                ? "รอชำระ"
                                : "ชำระแล้ว"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          : !loading && (
              <div className="no-data-container">
                <p className="no-data">ไม่มีข้อมูลการชำระเงิน</p>
              </div>
            )}
      </div>
    </>
  );
}
