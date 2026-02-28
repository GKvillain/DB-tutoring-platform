import "./PaymentTutor.css";
import Navigation from "../components/Navigation";
import { useEffect, useState } from "react";
import nonggk from "../assets/nonggk.jpg";
import { DailyTracker } from "../utils/DailyTracker";
import { useDateInfo } from "../hooks/useDateInfo";

export function PaymentTutor() {
  const { todayFormatted, month, year, isLastDay } = useDateInfo();
  const accountId = localStorage.getItem("account_id");

  const [expandedId, setExpandedId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [studentsWithPending, setStudentsWithPending] = useState([]); // Renamed for clarity
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Removed unused: totalPayment, students

  const christianYear = year > 2500 ? year - 543 : year;

  const toggleCard = (id) => {
    setExpandedId(expandedId === id ? null : id);
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

        // 2️⃣ Fetch data in parallel
        const [courseRes, hoursRes] = await Promise.all([
          fetch(
            `http://localhost:3000/api/getcoursebystudent?current_tutor_id=${tutor_id}`,
          ),
          fetch(
            `http://localhost:3000/api/getHoursPending?current_tutor_id=${tutor_id}&course_name=${selectedCourse}`,
          ),
          // Removed paymentRes and studentRes since hoursPending now has all data
        ]);

        const courseData = await courseRes.json();
        const hoursData = await hoursRes.json();

        if (!courseRes.ok)
          throw new Error(courseData.error || "Failed to fetch courses");
        if (!hoursRes.ok)
          throw new Error(hoursData.error || "Failed to fetch hours");

        console.log("Courses:", courseData);
        console.log("Students with pending hours:", hoursData);

        setCourses(Array.isArray(courseData) ? courseData : []);
        setStudentsWithPending(Array.isArray(hoursData) ? hoursData : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setCourses([]);
        setStudentsWithPending([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentData();
  }, [month, year, accountId, selectedCourse]);

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

        {studentsWithPending.length > 0
          ? studentsWithPending.map((student) => (
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
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">ทั้งหมด</option>
                      {courses.map((c) => (
                        <option key={c.course_id} value={c.course_name_thai}>
                          {c.course_name_thai}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="student-details">
                    <span>{student.total_pending_hours}</span>
                    <span>{student.course_price}</span>
                    <span>{student.total_outstanding}</span>
                    <span>
                      {student.total_outstanding > 0
                        ? "มียอดค้างชำระ"
                        : "ไม่มียอดค้างชำระ"}
                    </span>
                  </div>
                </div>

                {expandedId === student.student_id && (
                  <div className="expanded-detail">
                    <p>รายละเอียดคาบเรียน</p>

                    <div className="payment-details">
                      <div className="topic-inner-detail">
                        <h4>ครั้งที่</h4>
                        <h4>เดือน</h4>
                        <h4>คาบเรียน</h4>
                        <h4>ราคาต่อชั่วโมง</h4>
                        <h4>ยอดชำระ</h4>
                        <h4>วันที่คำนวณ</h4>
                        <h4>วันที่ชำระ</h4>
                        <h4>สถานะ</h4>
                      </div>

                      <div className="topic-inner-detail">
                        <p>1</p>
                        <p>
                          เดือน {month}/{christianYear}
                        </p>
                        <p>{student.total_pending_hours}</p>
                        <p>{student.course_price}</p>
                        <p>{student.total_outstanding}</p>
                        <p>{isLastDay ? todayFormatted : "-"}</p>
                        <p>-</p>
                        <p>
                          {student.total_outstanding > 0
                            ? "รอชำระ"
                            : "ชำระแล้ว"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          : !loading && <p className="no-data">ไม่มีข้อมูลการชำระเงิน</p>}
      </div>
    </>
  );
}
