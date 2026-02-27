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
  const [hoursPending, setHoursPending] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPayment, setTotalPayment] = useState([]);

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
        const [courseRes, hoursRes, paymentRes] = await Promise.all([
          fetch(
            `http://localhost:3000/api/getcoursebystudent?current_tutor_id=${tutor_id}`,
          ),
          fetch(
            `http://localhost:3000/api/getHoursPending?current_tutor_id=${tutor_id}&course_name=${selectedCourse}`,
          ),
          fetch(
            `http://localhost:3000/api/getTotalPayment?current_tutor_id=${tutor_id}&course_name=${selectedCourse}`,
          ),
          fetch(`http://localhost:3000/api/`),
        ]);

        const courseData = await courseRes.json();
        const hoursData = await hoursRes.json();
        const paymentData = await paymentRes.json();

        if (!courseRes.ok)
          throw new Error(courseData.error || "Failed to fetch courses");

        if (!hoursRes.ok)
          throw new Error(hoursData.error || "Failed to fetch hours");

        if (!paymentRes.ok)
          throw new Error(paymentData.error || "Failed to fetch payments");

        setCourses(Array.isArray(courseData) ? courseData : []);
        setHoursPending(Array.isArray(hoursData) ? hoursData : [hoursData]);
        setTotalPayment(Array.isArray(paymentData) ? paymentData : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setCourses([]);
        setHoursPending([]);
        setTotalPayment([]);
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

        {Array.isArray(hoursPending) &&
          hoursPending.map((stat, index) => {
            const payment = totalPayment[index] || {};

            return (
              <div
                key={stat.student_id || index}
                className={`student-card ${
                  expandedId === stat.student_id ? "active" : ""
                }`}
                onClick={() => toggleCard(stat.student_id)}
              >
                <div className="student-card-content">
                  <img
                    src={nonggk}
                    alt={stat.student_name}
                    className="student-image"
                  />

                  <div className="student-name-container">
                    <p className="student-name">
                      {stat.student_nickname || "ไม่ระบุชื่อ"}
                    </p>

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
                    <span>{stat.total_pending_hours || 0}</span>
                    <span>{payment.course_price || 0}</span>
                    <span>{payment.course_total_price || 0}</span>
                    <span>
                      {payment.course_total_price > 0
                        ? "มียอดค้างชำระ"
                        : "ไม่มียอดค้างชำระ"}
                    </span>
                  </div>
                </div>

                {expandedId === stat.student_id && (
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
                        <p>{stat.session_hours || 0}</p>
                        <p>{stat.price || 0}</p>
                        <p>{stat.total_price || 0}</p>
                        <p>{isLastDay ? todayFormatted : "-"}</p>
                        <p>-</p>
                        <p>{stat.payment_status || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </>
  );
}
