import "./LearningRecord.css";
import Navigation from "../components/Navigation";
import { useState, useEffect, useCallback } from "react";
import nonggk from "../assets/nonggk.jpg"; // Default image
import { ChevronDown, ChevronUp } from "lucide-react";

export function LearningRecord() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [learningData, setLearningData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [studentDetails, setStudentDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const accountId = localStorage.getItem("account_id");

  // Helper function to format date consistently
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Bangkok",
      });
    } catch {
      return "-";
    }
  };

  // Fetch detailed learning records for a specific student
  const fetchStudentDetails = useCallback(async (studentId) => {
    try {
      setLoadingDetails((prev) => ({ ...prev, [studentId]: true }));

      const detailRes = await fetch(
        `http://localhost:3000/api/learningRecord/learningDetail?student_id=${studentId}`,
      );
      if (!detailRes.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลรายละเอียดได้");
      }

      const detailData = await detailRes.json();

      setStudentDetails((prev) => ({
        ...prev,
        [studentId]: Array.isArray(detailData) ? detailData : [],
      }));
    } catch (err) {
      console.error("Error fetching student details:", err);
      setStudentDetails((prev) => ({
        ...prev,
        [studentId]: [],
      }));
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [studentId]: false }));
    }
  }, []);

  // Toggle expand/collapse for a student
  const toggleExpand = useCallback(
    (studentId) => {
      setExpandedId((prev) => {
        const newExpandedId = prev === studentId ? null : studentId;
        // Fetch details if not already loaded and expanding
        if (newExpandedId && !studentDetails[newExpandedId]) {
          fetchStudentDetails(newExpandedId);
        }
        return newExpandedId;
      });
    },
    [studentDetails, fetchStudentDetails],
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchLearningSummary() {
      if (!accountId) {
        if (isMounted) {
          setError("ไม่พบ account_id");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // Get tutor_id from account_id
        const tutorRes = await fetch(
          `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
        );

        if (!tutorRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูล tutor ได้");
        }

        const tutorData = await tutorRes.json();
        const tutor_id = tutorData.tutor_id || tutorData;

        // Fetch learning summary
        const summaryRes = await fetch(
          `http://localhost:3000/api/learningRecord/learningSummary?current_tutor_id=${tutor_id}`,
        );

        if (!summaryRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลบันทึกการเรียนรู้ได้");
        }

        const summaryData = await summaryRes.json();

        if (isMounted) {
          setLearningData(Array.isArray(summaryData) ? summaryData : []);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching learning summary:", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLearningSummary();

    return () => {
      isMounted = false;
    };
  }, [accountId]);

  // Loading state
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navigation />
        <div className="error-container">
          <p>เกิดข้อผิดพลาด: {error}</p>
        </div>
      </>
    );
  }

  // No data state
  if (!learningData.length) {
    return (
      <>
        <Navigation />
        <div className="learning-container">
          <h1 className="learning-title">บันทึกการเรียนรู้</h1>
          <div className="no-data-message">
            <p>ไม่มีข้อมูลการเรียนรู้</p>
          </div>
        </div>
      </>
    );
  }

  // Group data by student for better organization
  const groupedByStudent = learningData.reduce((acc, item) => {
    if (!acc[item.student_id]) {
      acc[item.student_id] = {
        student_id: item.student_id,
        student_name: item.student_name,
        student_picture: item.student_picture,
        courses: [],
      };
    }
    acc[item.student_id].courses.push({
      course_name: item.course_name,
      last_topic: item.last_topic,
      class_session_latest: item.class_session_latest,
      parent_need: item.parent_need,
      missing_homework: item.missing_homework,
    });
    return acc;
  }, {});

  const studentsList = Object.values(groupedByStudent);

  // Main render
  return (
    <>
      <Navigation />
      <div className="learning-container">
        <h1 className="learning-title">บันทึกการเรียนรู้</h1>

        <div className="learning-list">
          {/* Header */}
          <div className="learning-header">
            <div className="header-expand-space"></div>
            <div className="header-image-space"></div>
            <div className="header-name-space">นักเรียน</div>
            <div className="header-details">
              <span className="header-item">คอร์ส</span>
              <span className="header-item">หัวข้อล่าสุด</span>
              <span className="header-item">เรียนล่าสุด</span>
              <span className="header-item">ความต้องการ</span>
              <span className="header-item">การบ้านขาด</span>
            </div>
          </div>

          {/* Data rows */}
          <div className="learning-rows">
            {studentsList.map((student) => {
              const isExpanded = expandedId === student.student_id;
              const details = studentDetails[student.student_id] || [];
              const isLoadingDetail = loadingDetails[student.student_id];

              return (
                <div
                  key={student.student_id}
                  className={`learning-item ${isExpanded ? "active" : ""}`}
                >
                  {/* Main row - Click to expand */}
                  <div
                    className="learning-row"
                    onClick={() => toggleExpand(student.student_id)}
                  >
                    {/* Expand/collapse icon */}
                    <div className="expand-cell">
                      {isExpanded ? (
                        <ChevronUp size={20} color="#a084dc" />
                      ) : (
                        <ChevronDown size={20} color="#a084dc" />
                      )}
                    </div>

                    {/* Picture cell */}
                    <img
                      src={student.student_picture || nonggk}
                      alt={student.student_name}
                      className="student-avatar"
                      onError={(e) => {
                        e.target.src = nonggk;
                      }}
                    />

                    {/* Student name */}
                    <div className="student-name-container">
                      <span className="student-name">
                        {student.student_name || "-"}
                      </span>
                    </div>

                    {/* Student details - showing first course summary */}
                    <div className="learning-details">
                      <span className="detail-item" data-label="คอร์ส">
                        {student.courses.length} คอร์ส
                      </span>
                      <span className="detail-item" data-label="หัวข้อล่าสุด">
                        {student.courses[0]?.last_topic || "-"}
                      </span>
                      <span className="detail-item" data-label="เรียนล่าสุด">
                        {formatDate(student.courses[0]?.class_session_latest)}
                      </span>
                      <span className="detail-item" data-label="ความต้องการ">
                        {student.courses[0]?.parent_need || "-"}
                      </span>
                      <span className="detail-item" data-label="การบ้านขาด">
                        <span
                          className={`badge ${
                            student.courses.reduce(
                              (sum, c) => sum + (c.missing_homework || 0),
                              0,
                            ) > 0
                              ? "badge-warning"
                              : "badge-success"
                          }`}
                        >
                          {student.courses.reduce(
                            (sum, c) => sum + (c.missing_homework || 0),
                            0,
                          )}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Expanded details section */}
                  {isExpanded && (
                    <div className="expanded-details">
                      <h3 className="details-title">
                        รายละเอียดการเรียนรู้ - {student.student_name}
                      </h3>

                      {isLoadingDetail ? (
                        <div className="details-loading">
                          <div className="small-spinner"></div>
                          <p>กำลังโหลดรายละเอียด...</p>
                        </div>
                      ) : details.length > 0 ? (
                        <div className="details-table">
                          {/* Details header */}
                          <div className="details-header-row">
                            <div className="details-header-cell">วันที่</div>
                            <div className="details-header-cell">คอร์ส</div>
                            <div className="details-header-cell">หัวข้อ</div>
                            <div className="details-header-cell">การบ้าน</div>
                            <div className="details-header-cell">
                              สถานะเข้าเรียน
                            </div>
                          </div>

                          {/* Details rows */}
                          {details.map((detail, idx) => (
                            <div key={idx} className="details-row">
                              <div className="details-cell" data-label="วันที่">
                                {formatDate(detail.session_date)}
                              </div>
                              <div className="details-cell" data-label="คอร์ส">
                                {detail.course_name || "-"}
                              </div>
                              <div className="details-cell" data-label="หัวข้อ">
                                {detail.lesson_topic || "-"}
                              </div>
                              <div
                                className="details-cell"
                                data-label="การบ้าน"
                              >
                                <span
                                  className={`badge-small ${
                                    detail.homework_status?.toLowerCase() ===
                                    "done"
                                      ? "badge-success"
                                      : detail.homework_status?.toLowerCase() ===
                                          "missing"
                                        ? "badge-warning"
                                        : "badge-secondary"
                                  }`}
                                >
                                  {detail.homework_status?.toLowerCase() ===
                                  "done"
                                    ? "ส่งแล้ว"
                                    : detail.homework_status?.toLowerCase() ===
                                        "missing"
                                      ? "ขาดส่ง"
                                      : detail.homework_status || "-"}
                                </span>
                              </div>
                              <div className="details-cell" data-label="สถานะ">
                                <span
                                  className={`badge-small ${
                                    detail.attendance_status?.toLowerCase() ===
                                    "present"
                                      ? "badge-success"
                                      : detail.attendance_status?.toLowerCase() ===
                                          "absent"
                                        ? "badge-danger"
                                        : "badge-secondary"
                                  }`}
                                >
                                  {detail.attendance_status?.toLowerCase() ===
                                  "present"
                                    ? "มาเรียน"
                                    : detail.attendance_status?.toLowerCase() ===
                                        "absent"
                                      ? "ขาดเรียน"
                                      : detail.attendance_status || "-"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-details">ไม่มีรายละเอียดการเรียนรู้</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer with total count */}
          <div className="learning-footer">
            <div className="total-row">
              <span>นักเรียนทั้งหมด {studentsList.length} คน</span>
              <span>รายการทั้งหมด {learningData.length} รายการ</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
