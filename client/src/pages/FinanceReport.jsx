import "./FinanceReport.css";
import Navigation from "../components/Navigation";
import { useState, useEffect, useMemo } from "react";
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
  const [sessions, setSessions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const accountId = localStorage.getItem("account_id");

  // Group sessions by month and student to create payment summaries
  const groupedPayments = useMemo(() => {
    const paymentMap = new Map();

    sessions.forEach((session) => {
      // Create a unique key for each month+student+course combination
      const key = `${session.year_month}-${session.student_id}-${session.course_name_thai}`;

      if (!paymentMap.has(key)) {
        paymentMap.set(key, {
          month: session.year_month,
          student_id: session.student_id,
          student_name: session.student_name,
          course_name_thai: session.course_name_thai,
          course_name_eng: session.course_name_eng,
          paid_date: session.paid_date,
          total_amount: 0,
          session_count: 0,
        });
      }

      const payment = paymentMap.get(key);
      payment.total_amount += session.total_amount || 0;
      payment.session_count += 1;

      // Use the most recent paid_date if multiple
      if (
        session.paid_date &&
        (!payment.paid_date ||
          new Date(session.paid_date) > new Date(payment.paid_date))
      ) {
        payment.paid_date = session.paid_date;
      }
    });

    // Convert to array and sort by paid_date in descending order (newest first)
    return Array.from(paymentMap.values()).sort((a, b) => {
      // Handle cases where paid_date might be null
      if (!a.paid_date && !b.paid_date) return 0;
      if (!a.paid_date) return 1; // Put null dates at the end
      if (!b.paid_date) return -1; // Put null dates at the end

      // Sort by paid_date descending (newest first)
      return new Date(b.paid_date) - new Date(a.paid_date);
    });
  }, [sessions]);

  // Filter payments by selected month
  const filteredPayments = useMemo(() => {
    const filtered = selectedMonth
      ? groupedPayments.filter((payment) => {
          if (!payment.month) return false;

          try {
            // Extract month from year_month (YYYY-MM)
            if (
              typeof payment.month === "string" &&
              payment.month.includes("-")
            ) {
              const month = parseInt(payment.month.split("-")[1], 10);
              return month.toString() === selectedMonth;
            }
            return false;
          } catch {
            return false;
          }
        })
      : groupedPayments;

    return filtered;
  }, [groupedPayments, selectedMonth]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Calculate total amount for current page
  const totalAmount = currentPayments.reduce(
    (sum, p) => sum + (p.total_amount || 0),
    0,
  );

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    const newRows = parseInt(e.target.value, 10);
    setRowsPerPage(newRows);
    setCurrentPage(1); // Reset to first page
  };

  // Helper function to format date to show only month and year in Thai
  const formatThaiMonth = (dateString) => {
    if (!dateString) return "-";

    try {
      let date;

      if (typeof dateString === "string") {
        if (
          dateString.trim() === "" ||
          dateString === "null" ||
          dateString === "undefined"
        ) {
          return "-";
        }

        // Handle YYYY-MM format
        if (dateString.match(/^\d{4}-\d{2}$/)) {
          const [year, month] = dateString.split("-").map(Number);
          date = new Date(year, month - 1, 1);
        }
        // Handle YYYY-MM-DD format
        else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split("-").map(Number);
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return "-";
      }

      if (
        date.getFullYear() === 1970 &&
        date.getMonth() === 0 &&
        date.getDate() === 1
      ) {
        return "-";
      }

      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        timeZone: "Asia/Bangkok",
      });
    } catch {
      return "-";
    }
  };

  // Helper function to format full date with day
  const formatThaiFullDate = (dateString) => {
    if (!dateString) return "-";

    try {
      let date;

      if (typeof dateString === "string") {
        if (
          dateString.trim() === "" ||
          dateString === "null" ||
          dateString === "undefined"
        ) {
          return "-";
        }

        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split("-").map(Number);
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return "-";
      }

      if (
        date.getFullYear() === 1970 &&
        date.getMonth() === 0 &&
        date.getDate() === 1
      ) {
        return "-";
      }

      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Bangkok",
      });
    } catch {
      return "-";
    }
  };

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

        // Fetch monthly payment details (sessions)
        const paymentRes = await fetch(
          `http://localhost:3000/api/getDetailPayment/${tutor_id}`,
        );

        if (!statRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลรายได้ได้");
        }

        if (!paymentRes.ok) {
          console.warn("ไม่สามารถดึงข้อมูลรายการชำระเงินได้");
        }

        const statData = await statRes.json();

        // Only try to parse payment data if response is OK
        let sessionData = [];
        if (paymentRes.ok) {
          sessionData = await paymentRes.json();
          console.log("Raw session data sample:", sessionData[0]);
        }

        setSessions(sessionData);
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
            <div className="payment-header-with-controls">
              <h2>รายการชำระเงินล่าสุด</h2>
              <div className="pagination-controls">
                <div className="rows-per-page">
                  <label htmlFor="rowsPerPage">แสดง:</label>
                  <select
                    id="rowsPerPage"
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    className="rows-select"
                  >
                    <option value="5">5 รายการ</option>
                    <option value="10">10 รายการ</option>
                    <option value="20">20 รายการ</option>
                    <option value="50">50 รายการ</option>
                  </select>
                </div>
                <div className="page-info">
                  {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredPayments.length)} จาก{" "}
                  {filteredPayments.length} รายการ
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="payment-header-row">
              <div className="payment-header-cell">เดือน</div>
              <div className="payment-header-cell">นักเรียน</div>
              <div className="payment-header-cell">คอร์ส</div>
              <div className="payment-header-cell">วันที่ชำระ</div>
              <div className="payment-header-cell">จำนวนเงิน</div>
            </div>

            {/* Payment rows with dividers */}
            <div className="payment-rows">
              {currentPayments.map((payment, index) => {
                return (
                  <div
                    key={`${payment.student_id}-${payment.month}-${payment.course_name_thai}`}
                  >
                    <div className="payment-row">
                      <div className="payment-cell">
                        {payment.month ? formatThaiMonth(payment.month) : "-"}
                      </div>
                      <div className="payment-cell">
                        {payment.student_name || "-"}
                      </div>
                      <div className="payment-cell">
                        {payment.course_name_thai ||
                          payment.course_name_eng ||
                          "-"}
                      </div>
                      <div className="payment-cell">
                        {payment.paid_date
                          ? formatThaiFullDate(payment.paid_date)
                          : "-"}
                      </div>
                      <div className="payment-cell amount-column">
                        {(payment.total_amount || 0).toLocaleString()} บาท
                      </div>
                    </div>
                    {/* Add divider except for the last item */}
                    {index < currentPayments.length - 1 && (
                      <div className="payment-divider"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  «
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  ‹
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-button ${currentPage === pageNum ? "active" : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  ›
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  »
                </button>
              </div>
            )}

            {/* Footer with total */}
            <div className="payment-footer">
              <div className="total-row">
                <span>รวมทั้งหมด ({currentPayments.length} รายการ):</span>
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
