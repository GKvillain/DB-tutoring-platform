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

        const accRes = await fetch(
          `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
        );

        if (!accRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูล tutor ได้");
        }

        const tutorData = await accRes.json();
        const tutor_id = tutorData.tutor_id;

        const statRes = await fetch(
          `http://localhost:3000/api/income-finance/statistics/${tutor_id}`,
        );

        if (!statRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลรายได้ได้");
        }

        const statData = await statRes.json();

        console.log("Raw data from API:", statData);

        const formattedStats = {
          today: 0,
          week: 0,
          month: 0,
          year: 0,
          total: 0,
          outstanding: 0,
        };

        statData.forEach((item) => {
          switch (item.period) {
            case "today":
              formattedStats.today = item.amount;
              break;
            case "week":
              formattedStats.week = item.amount;
              break;
            case "month":
              formattedStats.month = item.amount;
              break;
            case "year":
              formattedStats.year = item.amount;
              break;
            case "total":
              formattedStats.total = item.amount;
              break;
            case "outstanding":
              formattedStats.outstanding = item.amount;
              break;
            default:
              break;
          }
        });

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
        <h1 className="finance-title">รายงานการเงิน</h1>

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
      </div>
    </>
  );
}
