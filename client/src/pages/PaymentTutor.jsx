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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedStudentPage, setExpandedStudentPage] = useState(1);
  const rowsPerPage = 10;

  // Helper function to format date to Buddhist year in YYYY-MM-DD format
  const formatThaiDate = (dateString) => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const year = date.getFullYear() + 543; // Convert to Buddhist year
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch {
      return dateString;
    }
  };

  // Helper function to get month order for sorting
  const getMonthOrder = (monthName) => {
    const monthOrderMap = {
      มกราคม: 1,
      กุมภาพันธ์: 2,
      มีนาคม: 3,
      เมษายน: 4,
      พฤษภาคม: 5,
      มิถุนายน: 6,
      กรกฎาคม: 7,
      สิงหาคม: 8,
      กันยายน: 9,
      ตุลาคม: 10,
      พฤศจิกายน: 11,
      ธันวาคม: 12,
    };
    return monthOrderMap[monthName] || 0;
  };

  // Helper function to extract year from month_name (e.g., "มีนาคม 2569" -> 2569)
  const extractYearFromMonthName = (monthName) => {
    if (!monthName) return 0;
    const parts = monthName.split(" ");
    return parts.length > 1 ? parseInt(parts[1]) : 0;
  };

  // Helper function to extract month name without year
  const extractMonthNameOnly = (monthName) => {
    if (!monthName) return "";
    const parts = monthName.split(" ");
    return parts[0];
  };

  const toggleCard = (id) => {
    setExpandedId(expandedId === id ? null : id);
    // Reset session page when opening a new student card
    setExpandedStudentPage(1);
  };

  const handleCourseChange = (studentId, courseValue) => {
    setSelectedCourseByStudent((prev) => ({
      ...prev,
      [studentId]: courseValue,
    }));
    // Reset session page when changing course
    setExpandedStudentPage(1);
  };

  // Pagination handlers
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextSessionPage = () => {
    setExpandedStudentPage((prev) =>
      Math.min(prev + 1, getCurrentSessionPages()),
    );
  };

  const handlePrevSessionPage = () => {
    setExpandedStudentPage((prev) => Math.max(prev - 1, 1));
  };

  // Function to get current session pages based on expanded student
  const getCurrentSessionPages = () => {
    if (!expandedId) return 1;
    const student = studentsWithCourses.find(
      (s) => s.student_id === expandedId,
    );
    if (!student) return 1;

    const selectedCourse = selectedCourseByStudent[expandedId];
    const filteredGroupedDetails =
      getFilteredGroupedDetailsForStudent(expandedId);
    const sessions = filteredGroupedDetails[selectedCourse] || [];
    return Math.ceil(sessions.length / rowsPerPage);
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
          `http://localhost:3000/api/payment/getHoursPending?current_tutor_id=${tutor_id}`,
        );

        const hoursData = await hoursRes.json();

        const detailRes = await fetch(
          `http://localhost:3000/api/payment/getDetailPayment/${tutor_id}?p_student_id=&p_course_name=`,
        );

        const detailData = await detailRes.json();

        if (!hoursRes.ok) {
          throw new Error(hoursData.error || "Failed to fetch hours");
        }

        setPendingData(Array.isArray(hoursData) ? hoursData : []);

        // Sort detail data by year and month (descending - newest first)
        if (Array.isArray(detailData)) {
          const sortedDetail = [...detailData].sort((a, b) => {
            // Extract years from month_name
            const yearA = extractYearFromMonthName(a.month_name);
            const yearB = extractYearFromMonthName(b.month_name);

            // First sort by year (descending - newer first)
            if (yearA !== yearB) {
              return yearB - yearA; // Descending order
            }

            // Then sort by month within the same year (descending)
            const monthNameA = extractMonthNameOnly(a.month_name);
            const monthNameB = extractMonthNameOnly(b.month_name);
            return getMonthOrder(monthNameB) - getMonthOrder(monthNameA); // Descending order
          });
          setDetail(sortedDetail);
        } else {
          setDetail([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setPendingData([]);
        setDetail([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentData();
  }, [month, year, accountId]);

  const studentsWithCourses = useMemo(() => {
    const studentMap = new Map();
    const initialSelections = {};

    pendingData.forEach((record) => {
      if (!studentMap.has(record.student_id)) {
        studentMap.set(record.student_id, {
          student_id: record.student_id,
          student_name: record.student_name,
          student_picture: record.student_picture,
          courses: [],
        });

        // Initialize with first course as default selection
        initialSelections[record.student_id] = record.course_name_thai;
      }

      studentMap.get(record.student_id).courses.push({
        course_name_thai: record.course_name_thai,
        total_pending_hours: record.total_pending_hours,
        course_price: record.course_price,
        total_outstanding: record.total_outstanding,
        payment_status: record.payment_status,
      });
    });

    // Set initial selections
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

    // Sort sessions within each course by year and month (descending - newest first)
    Object.keys(grouped).forEach((studentId) => {
      Object.keys(grouped[studentId]).forEach((courseName) => {
        grouped[studentId][courseName].sort((a, b) => {
          // Extract years from month_name
          const yearA = extractYearFromMonthName(a.month_name);
          const yearB = extractYearFromMonthName(b.month_name);

          // Sort by year first (descending - newer first)
          if (yearA !== yearB) {
            return yearB - yearA; // Descending order
          }

          // Then sort by month within the same year (descending)
          const monthNameA = extractMonthNameOnly(a.month_name);
          const monthNameB = extractMonthNameOnly(b.month_name);
          return getMonthOrder(monthNameB) - getMonthOrder(monthNameA); // Descending order
        });
      });
    });

    return grouped;
  }, [detail]);

  const getFilteredCoursesForStudent = (student) => {
    const selectedCourse = selectedCourseByStudent[student.student_id];

    if (!selectedCourse) return [];

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

    return {};
  };

  const calculateStudentTotals = (student) => {
    const filteredCourses = getFilteredCoursesForStudent(student);

    if (filteredCourses.length === 0) {
      return { total_pending_hours: 0, total_outstanding: 0, course_price: 0 };
    }

    const totals = filteredCourses.reduce(
      (acc, course) => ({
        total_pending_hours:
          acc.total_pending_hours + (course.total_pending_hours || 0),
        total_outstanding:
          acc.total_outstanding + (course.total_outstanding || 0),
      }),
      { total_pending_hours: 0, total_outstanding: 0 },
    );

    const coursePrice = filteredCourses[0].course_price;

    return {
      ...totals,
      course_price: coursePrice,
    };
  };

  // Pagination calculations for students
  const totalPages = Math.ceil(studentsWithCourses.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedStudents = studentsWithCourses.slice(startIndex, endIndex);

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
          <div className="header-content">
            <div className="header-image-placeholder"></div>
            <div className="header-name-placeholder"></div>
            <div className="header-details-fixed">
              <span>คาบเรียนที่ยังไม่ชำระ (ชั่วโมง)</span>
              <span>ราคาต่อชั่วโมง (บาท)</span>
              <span>ยอดชำระทั้งหมด (บาท)</span>
              <span>สถานะการชำระเงิน</span>
            </div>
          </div>
        </div>

        {studentsWithCourses.length > 0
          ? paginatedStudents.map((student) => {
              const totals = calculateStudentTotals(student);
              const filteredGroupedDetails =
                getFilteredGroupedDetailsForStudent(student.student_id);
              const hasOutstanding = totals.total_outstanding > 0;

              // Get sessions for the selected course
              const selectedCourseSessions =
                filteredGroupedDetails[
                  selectedCourseByStudent[student.student_id]
                ] || [];
              const totalSessionPages = Math.ceil(
                selectedCourseSessions.length / rowsPerPage,
              );
              const sessionStartIndex = (expandedStudentPage - 1) * rowsPerPage;
              const sessionEndIndex = sessionStartIndex + rowsPerPage;
              const paginatedSessions = selectedCourseSessions.slice(
                sessionStartIndex,
                sessionEndIndex,
              );

              return (
                <div
                  key={student.student_id}
                  className={`student-card ${
                    expandedId === student.student_id ? "active" : ""
                  }`}
                  onClick={() => toggleCard(student.student_id)}
                >
                  <div className="student-card-content-fixed">
                    <img
                      src={student.student_picture || nonggk}
                      alt={student.student_name}
                      className="student-image"
                    />

                    <div className="student-name-container">
                      <span className="student-name-fixed">
                        {student.student_name}
                      </span>
                      <select
                        className="course-select"
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
                        {student.courses.map((course, index) => (
                          <option key={index} value={course.course_name_thai}>
                            {course.course_name_thai}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="student-details-fixed">
                      <span data-label="คาบเรียนที่ยังไม่ชำระ">
                        {totals.total_pending_hours}
                      </span>
                      <span data-label="ราคาต่อชั่วโมง">
                        {totals.course_price}
                      </span>
                      <span data-label="ยอดชำระทั้งหมด">
                        {totals.total_outstanding}
                      </span>
                      <span data-label="สถานะ">
                        {hasOutstanding ? "มียอดค้างชำระ" : "ไม่มียอดค้างชำระ"}
                      </span>
                    </div>
                  </div>

                  {expandedId === student.student_id && (
                    <div className="expanded-detail">
                      <p>รายละเอียดคาบเรียน (เรียงจากล่าสุดไปล่าสุด)</p>

                      {Object.keys(filteredGroupedDetails).length > 0 ? (
                        Object.entries(filteredGroupedDetails).map(
                          ([courseName, sessions], courseIndex) => {
                            // Only show the selected course
                            if (
                              courseName !==
                              selectedCourseByStudent[student.student_id]
                            )
                              return null;

                            return (
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

                                {paginatedSessions.map((session, index) => {
                                  const actualIndex =
                                    sessionStartIndex + index + 1;
                                  return (
                                    <div
                                      key={index}
                                      className="topic-inner-detail session-row"
                                    >
                                      <p>{actualIndex}</p>
                                      <p>{session.month_name}</p>
                                      <p>{session.total_hours}</p>
                                      <p>{session.price_per_hour}</p>
                                      <p>{session.total_amount}</p>
                                      <p>
                                        {formatThaiDate(session.payment_date)}
                                      </p>
                                      <p>{formatThaiDate(session.paid_date)}</p>
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
                                  );
                                })}

                                {/* Session Pagination Controls */}
                                {totalSessionPages > 1 && (
                                  <div className="pagination-controls">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrevSessionPage();
                                      }}
                                      disabled={expandedStudentPage === 1}
                                      className="pagination-button"
                                    >
                                      ←
                                    </button>
                                    <span className="pagination-info">
                                      {expandedStudentPage} /{" "}
                                      {totalSessionPages}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNextSessionPage();
                                      }}
                                      disabled={
                                        expandedStudentPage ===
                                        totalSessionPages
                                      }
                                      className="pagination-button"
                                    >
                                      →
                                    </button>
                                  </div>
                                )}

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
                              </div>
                            );
                          },
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

        {/* Student Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-controls main-pagination">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              ←
            </button>
            <span className="pagination-info">
              หน้า {currentPage} / {totalPages} (ทั้งหมด{" "}
              {studentsWithCourses.length} รายการ)
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
