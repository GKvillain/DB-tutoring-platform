// StatTutor.jsx - Fixed version
import "./StatTutor.css";
import "../App.css";
import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";

export function StatTutor() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statisticsCourse, setStatisticsCourse] = useState([]);
  const accountId = localStorage.getItem("account_id");

  // Add this before your fetch calls to verify the endpoint exists
  async function testAPI() {
    try {
      const test = await fetch("http://localhost:3000/api/test");
      const text = await test.text();
      console.log("Test response:", text.substring(0, 200));
    } catch (err) {
      console.error("Test failed:", err);
    }
  }

  useEffect(() => {
    testAPI();
  }, []);

  useEffect(() => {
    async function fetchStatistics() {
      if (!selectedMonth || !selectedYear) return;

      setLoading(true);

      try {
        const get_prepare = await fetch(
          `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
        );

        if (!get_prepare.ok) {
          const errorData = await get_prepare.json();
          throw new Error(errorData.error || "Failed to fetch tutor ID");
        }

        const tutorData = await get_prepare.json();
        const tutor_id = tutorData.tutor_id;

        const yearParam =
          selectedYear === "all"
            ? "all"
            : (parseInt(selectedYear) - 543).toString();

        const res = await fetch(
          `http://localhost:3000/api/dashboard?month=${selectedMonth}&year=${yearParam}&tutor_id=${tutor_id}`,
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch dashboard");
        }

        const data = await res.json();
        setStatistics(data);

        // Fetch course summary data
        const res2 = await fetch(
          `http://localhost:3000/api/getCourseSummary?month=${selectedMonth}&year=${yearParam}&tutor_id=${tutor_id}`,
        );

        if (!res2.ok) {
          const errorData = await res2.json();
          throw new Error(errorData.error || "Failed to fetch course summary");
        }

        const data2 = await res2.json();

        if (Array.isArray(data2)) {
          setStatisticsCourse(data2);
        } else if (data2 && typeof data2 === "object") {
          setStatisticsCourse(data2.courses_name || []);
        } else {
          setStatisticsCourse([]);
        }

        console.log("Dashboard data:", data);
        console.log("Course summary data:", data2);
      } catch (err) {
        console.error("Error fetching statistics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatistics();
  }, [selectedMonth, selectedYear, accountId]);

  const clearFilters = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setStatistics(null);
    setStatisticsCourse([]);
  };

  return (
    <>
      <Navigation />
      <article className="container">
        <h1 className="topic">รายงานสถิติการสอน</h1>

        <div className="d-flex align-items-center gap-3 mb-4">
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#495057" }}>
            รายงานสถิติการสอนทั้งหมด
          </h3>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="selectStat"
          >
            <option value="" disabled hidden>
              เลือกเดือน
            </option>
            <option value="all">ทั้งหมด</option>
            <option value="01">มกราคม</option>
            <option value="02">กุมภาพันธ์</option>
            <option value="03">มีนาคม</option>
            <option value="04">เมษายน</option>
            <option value="05">พฤษภาคม</option>
            <option value="06">มิถุนายน</option>
            <option value="07">กรกฎาคม</option>
            <option value="08">สิงหาคม</option>
            <option value="09">กันยายน</option>
            <option value="10">ตุลาคม</option>
            <option value="11">พฤศจิกายน</option>
            <option value="12">ธันวาคม</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="selectStat"
          >
            <option value="" disabled hidden>
              เลือกปี
            </option>
            <option value="all">ทั้งหมด</option>
            <option value="2568">2568</option>
            <option value="2569">2569</option>
          </select>

          {(selectedMonth || selectedYear) && (
            <button onClick={clearFilters} className="btn-clear">
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {!loading && statistics && (
          <div className="success-message">โหลดข้อมูลสำเร็จ</div>
        )}

        {!loading && statistics && (
          <>
            <div className="d-flex gap-3 mt-4">
              <div className="block-stat">
                <h4>จำนวนชั่วโมงที่สอน</h4>
                <p>{statistics?.total_hours?.toFixed(2) || 0} ชม.</p>
              </div>

              <div className="block-stat">
                <h4>จำนวนนักเรียน</h4>
                <p>{statistics?.total_students || 0} คน</p>
              </div>

              <div className="block-stat">
                <h4>จำนวนคลาสที่สอน</h4>
                <p>{statistics?.total_sessions || 0} คลาส</p>{" "}
              </div>

              <div className="block-stat">
                <h4>รายรับทั้งหมด</h4>
                <p>
                  {Number(statistics?.total_income || 0).toLocaleString()} บาท
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h2 style={{ color: "#495057", marginBottom: "1rem" }}>
                รายงานสถิติการสอนต่อคอร์ส
              </h2>

              <div className="layout-course">
                <h4>ชื่อคอร์ส</h4>
                <h4>ชั่วโมง</h4>
                <h4>นักเรียน</h4>
                <h4>คลาส</h4>
                <h4>รายรับ</h4>
              </div>

              <div className="box-course">
                {Array.isArray(statisticsCourse) &&
                statisticsCourse.length > 0 ? (
                  statisticsCourse.map((stat, index) => (
                    <div
                      key={stat.course_name || index}
                      className="box-course-inner"
                    >
                      <h5>{stat.course_name || "ไม่ระบุชื่อคอร์ส"}</h5>
                      <div className="box-course-inner-divide">
                        <p>{stat.total_hours?.toFixed(2) || 0}</p>
                        <p>{stat.total_students || 0}</p>
                        <p>{stat.total_sessions || 0}</p>
                        <p>
                          {Number(stat.total_income || 0).toLocaleString()} บาท
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#6c757d",
                    }}
                  >
                    {statistics
                      ? "ยังไม่มีข้อมูลรายคอร์สในเดือนและปีที่เลือก"
                      : "ไม่พบข้อมูลการสอนในเดือนและปีที่เลือก"}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!loading && !statistics && selectedMonth && selectedYear && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "#6c757d",
              background: "#f8f9fa",
              borderRadius: "10px",
              marginTop: "2rem",
            }}
          >
            <p style={{ fontSize: "1.2rem" }}>
              กรุณาเลือกเดือนและปีเพื่อดูข้อมูล
            </p>
          </div>
        )}
      </article>
    </>
  );
}
