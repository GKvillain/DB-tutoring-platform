import "./PaymentTutor.css";
import Navigation from "../components/Navigation";
import { useEffect, useState, useMemo } from "react";
import nonggk from "../assets/nonggk.jpg";
import { DailyTracker } from "../utils/DailyTracker";
import { useDateInfo } from "../hooks/useDateInfo";

export function PaymentTutor() {
  const { month, year } = useDateInfo();
  const accountId = localStorage.getItem("account_id");

  const [expandedId, setExpandedId] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [selectedCourseByStudent, setSelectedCourseByStudent] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState([]);

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
        const tutorRes = await fetch(
          `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
        );
        const tutorData = await tutorRes.json();

        if (!tutorRes.ok) {
          throw new Error(tutorData.error || "Failed to fetch tutor ID");
        }

        const tutor_id = tutorData.tutor_id || tutorData;

        const hoursRes = await fetch(
          `http://localhost:3000/api/getHoursPending?current_tutor_id=${tutor_id}`,
        );

        const hoursData = await hoursRes.json();

        const detailRes = await fetch(
          `http://localhost:3000/api/getDetailPayment?current_tutor_id=${tutor_id}`,
        );

        const detailData = await detailRes.json();

        if (!hoursRes.ok) {
          throw new Error(hoursData.error || "Failed to fetch hours");
        }

        setPendingData(Array.isArray(hoursData) ? hoursData : []);
        setDetail(Array.isArray(detailData) ? detailData : []);
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

  const studentsWithCourses = useMemo(() => {
    const studentMap = new Map();

    pendingData.forEach((record) => {
      if (!studentMap.has(record.student_id)) {
        studentMap.set(record.student_id, {
          student_id: record.student_id,
          student_name: record.student_name,
          student_picture: record.student_picture,
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

    const initialSelections = {};
    Array.from(studentMap.keys()).forEach((studentId) => {
      initialSelections[studentId] = "";
    });
    setSelectedCourseByStudent(initialSelections);

    return Array.from(studentMap.values());
  }, [pendingData]);

  const groupedDetailsByStudent = useMemo(() => {
    const grouped = {};

    detail.forEach((session) => {
      if (!grouped[session.student_id]) {
        grouped[session.student_id] = {};
      }

      if (!grouped[session.student_id][session.course_name_thai]) {
        grouped[session.student_id][session.course_name_thai] = [];
      }

      grouped[session.student_id][session.course_name_thai].push(session);
    });

    return grouped;
  }, [detail]);

  const getFilteredCoursesForStudent = (student) => {
    const selectedCourse = selectedCourseByStudent[student.student_id];

    if (!selectedCourse) return student.courses;

    return student.courses.filter((c) => c.course_name_thai === selectedCourse);
  };

  const getFilteredGroupedDetailsForStudent = (studentId) => {
    const selectedCourse = selectedCourseByStudent[studentId];
    const studentGrouped = groupedDetailsByStudent[studentId] || {};

    if (selectedCourse) {
      return {
        [selectedCourse]: studentGrouped[selectedCourse] || [],
      };
    }

    return studentGrouped;
  };

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
              const groupedDetails = getFilteredGroupedDetailsForStudent(
                student.student_id,
              );
              const hasOutstanding = totals.total_outstanding > 0;

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
                      src={student.student_picture || nonggk}
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

                      {Object.keys(groupedDetails).length > 0 ? (
                        Object.entries(groupedDetails).map(
                          ([courseName, sessions], courseIndex) => (
                            <div key={courseIndex} className="course-section">
                              <h3 className="course-title">{courseName}</h3>

                              <div className="topic-inner-detail">
                                <h4>ครั้งที่</h4>
                                <h4>เดือน</h4>
                                <h4>คาบเรียน (ชม.)</h4>
                                <h4>ราคาต่อชั่วโมง</h4>
                                <h4>ยอดชำระ</h4>
                                <h4>วันที่คำนวณยอดชำระ</h4>
                                <h4>วันที่ชำระเงิน</h4>
                                <h4>สถานะ</h4>
                              </div>

                              {sessions.map((session, index) => (
                                <div
                                  key={index}
                                  className="topic-inner-detail session-row"
                                >
                                  <p>{index + 1}</p>
                                  <p>{session.month_name}</p>
                                  <p>{session.total_hours}</p>
                                  <p>{session.price_per_hour}</p>
                                  <p>{session.total_amount}</p>
                                  <p>{session.payment_date}</p>
                                  <p>{session.paid_date || "-"}</p>
                                  <p>
                                    <span
                                      className={`status-badge ${session.payment_status === "PAID" ? "paid" : "pending"}`}
                                    >
                                      {session.payment_status === "PAID"
                                        ? "ชำระแล้ว"
                                        : "รอชำระ"}
                                    </span>
                                  </p>
                                </div>
                              ))}

                              <div className="course-summary">
                                <p>รวมทั้งสิ้น: {sessions.length} ครั้ง</p>
                                <p>
                                  รวมชั่วโมง:{" "}
                                  {sessions
                                    .reduce(
                                      (sum, s) =>
                                        sum + parseFloat(s.total_hours || 0),
                                      0,
                                    )
                                    .toFixed(2)}{" "}
                                  ชม.
                                </p>
                                <p>
                                  รวมยอด:{" "}
                                  {sessions
                                    .reduce(
                                      (sum, s) =>
                                        sum + parseFloat(s.total_amount || 0),
                                      0,
                                    )
                                    .toFixed(2)}{" "}
                                  บาท
                                </p>
                              </div>

                              {courseIndex <
                                Object.keys(groupedDetails).length - 1 && (
                                <hr className="course-divider" />
                              )}
                            </div>
                          ),
                        )
                      ) : (
                        <p className="no-details">ไม่มีรายละเอียดคาบเรียน</p>
                      )}
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
