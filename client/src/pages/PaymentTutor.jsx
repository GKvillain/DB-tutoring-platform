import "./PaymentTutor.css";
import Navigation from "../components/Navigation";
import { useEffect, useState } from "react";
import nonggk from "../assets/nonggk.jpg";
import { DailyTracker } from "../utils/DailyTracker";
import { useDateInfo } from "../hooks/useDateInfo";

export function PaymentTutor() {
  const [expandedId, setExpandedId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState([]);
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState(null);
  const { todayFormatted, month, year, isLastDay } = useDateInfo();
  const accountId = localStorage.getItem("account_id");

  const toggleCard = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const christianYear = year > 2500 ? year - 543 : year;

  useEffect(() => {
    async function fetchPaymentSum() {
      if (!accountId || !month || !year) return;

      try {
        console.log("Fetching with params:", {
          month,
          year: christianYear,
          accountId,
        });

        // Get tutor ID first
        const tutorResponse = await fetch(
          `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
        );

        if (!tutorResponse.ok) throw new Error("Failed to fetch tutor ID");

        const tutorData = await tutorResponse.json();
        console.log("Tutor data:", tutorData);

        const tutor_id = tutorData.tutor_id || tutorData;

        // Now fetch payment summary
        const paymentResponse = await fetch(
          `http://localhost:3000/api/paymentStatus?month=${12}&year=${2025}&current_tutor_id=${tutor_id}`,
        );

        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text();
          console.error("Payment summary error response:", errorText);
          throw new Error(
            `Failed to fetch payment summary: ${paymentResponse.status}`,
          );
        }

        const sumPayment = await paymentResponse.json();
        console.log("Payment summary:", sumPayment);
        setPaymentStatus(sumPayment);
      } catch (error) {
        console.error("Error fetching payment summary:", error);
      }
    }
    fetchPaymentSum();
  }, [month, christianYear, accountId, year]);

  // useEffect(() => {
  //   async function fetchPaymentSum() {
  //     if (!accountId || !month || !year) return;

  //     try {
  //       console.log("Using mockup data");

  //       // Get tutor ID first (you might still need this for real data)
  //       const tutorResponse = await fetch(
  //         `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
  //       );

  //       if (!tutorResponse.ok) throw new Error("Failed to fetch tutor ID");

  //       const tutorData = await tutorResponse.json();
  //       console.log("Tutor data:", tutorData);

  //       // const tutor_id = tutorData.tutor_id || tutorData;

  //       // Use mockup data instead of actual API call
  //       setPaymentStatus(mockPaymentData);
  //     } catch (error) {
  //       console.error("Error:", error);
  //       // Fallback to mockup data even if tutor ID fetch fails
  //       setPaymentStatus(mockPaymentData);
  //     }
  //   }
  //   fetchPaymentSum();
  // }, [month, christianYear, accountId, year, , mockPaymentData]);

  return (
    <>
      <title>Check Payment</title>
      <Navigation />

      <div className="payment-container">
        <h1 className="payment-title">อัปเดตสถานะการชำระเงิน</h1>
        <h3 className="payment-date">
          <DailyTracker />
        </h3>
        <div className="search-section">
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อนักเรียน"
            className="search-input"
          />
        </div>

        <div className="payment-header">
          <div className="header-image-space"></div>
          <div className="header-name-space"></div>
          <div className="header-details">
            <span className="header-item">คาบเรียนที่ยังไม่ชำระ (ชั่วโมง)</span>
            <span className="header-item">ราคาต่อชั่วโมง (บาท)</span>
            <span className="header-item">ยอดชำระทั้งหมด (บาท)</span>
            <span className="header-item">สถานะการชำระเงิน</span>
          </div>
        </div>

        {paymentStatus.map((stat, index) => (
          <div
            key={`${stat.student_name}-${index}`}
            className={`student-card ${expandedId === index ? "active" : ""}`}
            onClick={() => toggleCard(index)}
          >
            <div className="student-card-content">
              <img
                src={nonggk}
                alt={stat.student_name}
                className="student-image"
              />
              <div className="student-name-container">
                <p className="student-name">{stat.student_name}</p>
                <select onClick={(e) => e.stopPropagation()}>
                  {paymentStatus.map((stat2, index) => {
                    <>
                      <select>stat2.course_name</select>
                    </>;
                  })}
                  <option></option>
                </select>
              </div>

              <div className="student-details">
                <span className="hours-remaining">
                  {stat.total_pending_hours}
                </span>
                <span className="hourly-rate">{stat.price}</span>
                <span className="total-amount">{stat.total_outstanding}</span>
                <span className="total-status">{stat.payment_status}</span>
              </div>
            </div>

            {expandedId === index && (
              <div className="expanded-detail">
                <p>รายละเอียดคาบเรียน</p>
                <div className="payment-details">
                  <div className="topic-inner-detail">
                    <h4>ครั้งที่</h4>
                    <h4>เดือน</h4>
                    <h4>คาบเรียน (ชั่วโมง)</h4>
                    <h4>ราคาต่อชั่วโมง (บาท)</h4>
                    <h4>ยอดชำระ (บาท)</h4>
                    <h4>วันที่คำนวณยอดชำระ</h4>
                    <h4>วันที่ชำระเงิน</h4>
                    <h4>สถานะการชำระเงิน</h4>
                  </div>

                  <div className="topic-inner-detail">
                    <p>{index + 1}</p>
                    <p>สิงหาคม 2568</p>
                    <p>{stat.session_hours}</p>
                    <p>{stat.price}</p>
                    <p>{stat.total_price}</p>
                    <p>{isLastDay ? todayFormatted : "-"}</p>
                    <p>-</p>
                    <p>{stat.payment_status}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
