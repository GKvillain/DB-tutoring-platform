import "./FinanceReport.css";
import Navigation from "../components/Navigation";
import { useState, useEffect } from "react";
import {
  Calendar,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Wallet,
  Clock,
} from "lucide-react";

export function FinanceReport() {
  const [statistics, setStatistics] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    total: 0,
    outstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listPayment, setListPayment] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const accountId = localStorage.getItem("account_id");

  useEffect(() => {
    async function fetchStat() {
      if (!accountId) {
        setError("ไม่พบ account_id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get tutor_id from account_id
        const accRes = await fetch(
          `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
        );

        if (!accRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูล tutor ได้");
        }

        const tutorData = await accRes.json();
        const tutor_id = tutorData.tutor_id;

        // Fetch statistics
        const statRes = await fetch(
          `http://localhost:3000/api/income-finance/statistics/${tutor_id}`,
        );

        // Fetch monthly payments
        const paymentRes = await fetch(
          `http://localhost:3000/api/get_monthly_student_payments/${tutor_id}`,
        );

        if (!statRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลรายได้ได้");
        }

        if (!paymentRes.ok) {
          console.warn("ไม่สามารถดึงข้อมูลรายการชำระเงินได้");
        }

        const statData = await statRes.json();

        // Only try to parse payment data if response is OK
        let paymentData = [];
        if (paymentRes.ok) {
          paymentData = await paymentRes.json();
        }

        setListPayment(paymentData);
        console.log("Raw data from API:", statData);

        const formattedStats = {
          today: 0,
          week: 0,
          month: 0,
          year: 0,
          total: 0,
          outstanding: 0,
        };

        // Handle different response formats
        if (Array.isArray(statData)) {
          statData.forEach((item) => {
            switch (item.period) {
              case "today":
                formattedStats.today = item.amount || 0;
                break;
              case "week":
                formattedStats.week = item.amount || 0;
                break;
              case "month":
                formattedStats.month = item.amount || 0;
                break;
              case "year":
                formattedStats.year = item.amount || 0;
                break;
              case "total":
                formattedStats.total = item.amount || 0;
                break;
              case "outstanding":
                formattedStats.outstanding = item.amount || 0;
                break;
              default:
                break;
            }
          });
        } else if (statData && typeof statData === "object") {
          // If API returns object directly
          formattedStats.today = statData.today || 0;
          formattedStats.week = statData.week || 0;
          formattedStats.month = statData.month || 0;
          formattedStats.year = statData.year || 0;
          formattedStats.total = statData.total || 0;
          formattedStats.outstanding = statData.outstanding || 0;
        }

        console.log("Formatted stats:", formattedStats);

        setStatistics(formattedStats);
        setError(null);
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStat();
  }, [accountId]);

  // Filter payments by selected month
  const filteredPayments = selectedMonth
    ? listPayment.filter((payment) => {
        const paymentMonth = new Date(payment.month).getMonth() + 1;
        return paymentMonth.toString() === selectedMonth;
      })
    : listPayment;

  // Calculate total amount
  const totalAmount = filteredPayments
    .slice(0, 10)
    .reduce((sum, p) => sum + (p.total_payment || 0), 0);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="loading-container">
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="error-container">
          <p style={{ color: "red" }}>เกิดข้อผิดพลาด: {error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />

      <div className="finance-container">
        <div className="finance-header">
          <h1 className="finance-title">รายงานการเงิน</h1>
          <div className="month-filter">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-select"
            >
              <option value="">ทุกเดือน</option>
              <option value="1">มกราคม</option>
              <option value="2">กุมภาพันธ์</option>
              <option value="3">มีนาคม</option>
              <option value="4">เมษายน</option>
              <option value="5">พฤษภาคม</option>
              <option value="6">มิถุนายน</option>
              <option value="7">กรกฎาคม</option>
              <option value="8">สิงหาคม</option>
              <option value="9">กันยายน</option>
              <option value="10">ตุลาคม</option>
              <option value="11">พฤศจิกายน</option>
              <option value="12">ธันวาคม</option>
            </select>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar size={32} color="#a084dc" />
            </div>
            <div className="stat-content">
              <h4>รายรับวันนี้</h4>
              <p className="stat-value">
                {statistics.today.toLocaleString()} บาท
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CalendarDays size={32} color="#a084dc" />
            </div>
            <div className="stat-content">
              <h4>รายรับสัปดาห์นี้</h4>
              <p className="stat-value">
                {statistics.week.toLocaleString()} บาท
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={32} color="#a084dc" />
            </div>
            <div className="stat-content">
              <h4>รายรับเดือนนี้</h4>
              <p className="stat-value">
                {statistics.month.toLocaleString()} บาท
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={32} color="#a084dc" />
            </div>
            <div className="stat-content">
              <h4>รายรับปีนี้</h4>
              <p className="stat-value">
                {statistics.year.toLocaleString()} บาท
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Wallet size={32} color="#a084dc" />
            </div>
            <div className="stat-content">
              <h4>รายรับทั้งหมด</h4>
              <p className="stat-value">
                {statistics.total.toLocaleString()} บาท
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={32} color="#ff6b6b" />
            </div>
            <div className="stat-content">
              <h4>รอการชำระเงิน</h4>
              <p className="stat-value outstanding">
                {statistics.outstanding.toLocaleString()} บาท
              </p>
            </div>
          </div>
        </div>

        {filteredPayments.length > 0 ? (
          <div className="payment-list">
            <h2>รายการชำระเงินล่าสุด</h2>
            <table className="payment-table">
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th>นักเรียน</th>
                  <th>คอร์ส</th>
                  <th>วันที่ชำระ</th>
                  <th>จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.slice(0, 10).map((payment, index) => (
                  <tr key={index}>
                    <td>
                      {new Date(payment.month).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        timeZone: "Asia/Bangkok",
                      })}
                    </td>
                    <td>{payment.student_name}</td>
                    <td>
                      {payment.course_name_thai || payment.course_name_eng}
                    </td>
                    <td>
                      {payment.paid_date
                        ? new Date(payment.paid_date).toLocaleDateString(
                            "th-TH",
                            {
                              timeZone: "Asia/Bangkok",
                            },
                          )
                        : "-"}
                    </td>
                    <td className="amount-column">
                      {payment.total_payment?.toLocaleString()} บาท
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              <div className="total-row">
                <span>
                  รวมทั้งหมด ({filteredPayments.slice(0, 10).length} รายการ):
                </span>
                <span>{totalAmount.toLocaleString()} บาท</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-data-message">
            <p>ไม่มีข้อมูลการชำระเงินในเดือนนี้</p>
          </div>
        )}
      </div>
    </>
  );
}
