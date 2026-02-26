import "./PaymentTutor.css";
import Navigation from "../components/Navigation";
// import { useEffect, useState } from "react";
import nonggk from "../assets/nonggk.jpg";

export function PaymentTutor() {
  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // const [students, setStudents] = useState([]);
  // const [search, setSearch] = useState("");

  return (
    <>
      <title>Check Payment</title>
      <Navigation />

      <div className="payment-container">
        <div className="search-section">
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อนักเรียน"
            className="search-input"
          />
        </div>

        <h1 className="payment-title">อัปเดตสถานะการชำระเงิน</h1>
        <h3 className="payment-date">{today}</h3>

        <div className="filter-section">
          <select className="status-filter">
            <option value="" disabled hidden>
              ทั้งหมด
            </option>
            <option value="paid">ชำระแล้ว</option>
            <option value="pending">รอชำระ</option>
            <option value="overdue">เลยกำหนด</option>
          </select>
        </div>

        <div className="payment-header">
          <h4 className="header-item">คาบเรียนที่ยังไม่ชำระ (ชั่วโมง)</h4>
          <h4 className="header-item">ราคาต่อชั่วโมง (บาท)</h4>
          <h4 className="header-item">ยอดชำระทั้งหมด (บาท)</h4>
          <h4 className="header-item">สถานะการชำระเงิน</h4>
        </div>

        <div className="student-card">
          <img src={nonggk} alt="น้องมิคาสะ" className="student-image" />
          <div className="student-info">
            <p className="student-name">น้องมิคาสะ</p>
            <div className="student-details">
              <span className="hours-remaining">2 ชั่วโมง</span>
              <span className="hourly-rate">300 บาท</span>
              <span className="total-amount">600 บาท</span>
              <select className="payment-status-select">
                <option value="paid">ชำระแล้ว</option>
                <option value="pending" selected>
                  รอชำระ
                </option>
                <option value="overdue">เลยกำหนด</option>
              </select>
            </div>
          </div>
        </div>

        <div className="student-card">
          <img src={nonggk} alt="น้องเอเรน" className="student-image" />
          <div className="student-info">
            <p className="student-name">น้องเอเรน</p>
            <div className="student-details">
              <span className="hours-remaining">4 ชั่วโมง</span>
              <span className="hourly-rate">300 บาท</span>
              <span className="total-amount">1,200 บาท</span>
              <select className="payment-status-select">
                <option value="paid">ชำระแล้ว</option>
                <option value="pending">รอชำระ</option>
                <option value="overdue" selected>
                  เลยกำหนด
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
