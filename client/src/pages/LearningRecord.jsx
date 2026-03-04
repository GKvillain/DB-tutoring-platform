import "./LearningRecord.css";
import Navigation from "../components/Navigation";
import { useState, useEffect, useCallback } from "react";
import nonggk from "../assets/nonggk.jpg"; // Default image
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
} from "lucide-react";

export function LearningRecord() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [learningData, setLearningData] = useState([]);
  const [examData, setExamData] = useState([]);
  const [expandedLearningId, setExpandedLearningId] = useState(null);
  const [expandedExamId, setExpandedExamId] = useState(null);
  const [studentDetails, setStudentDetails] = useState({});
  const [examDetails, setExamDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [loadingExamDetails, setLoadingExamDetails] = useState({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  // Remove unused examSummary state
  // const [examSummary, setExamSummary] = useState({});
  const [editFormData, setEditFormData] = useState({
    lesson_topic: "",
    homework_status: "",
    attendance_status: "",
  });
  const [savingId, setSavingId] = useState(null);

  // Pagination state for each student
  const [learningPages, setLearningPages] = useState({});
  const [examPages, setExamPages] = useState({});
  const [itemsPerPage] = useState(10); // Fixed items per page

  const accountId = localStorage.getItem("account_id");

  // Get current date for filtering
  const getCurrentDate = useCallback(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }, []);

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

  // Format score with 2 decimal places
  const formatScore = (score) => {
    if (score === null || score === undefined) return "-";
    return Number(score).toFixed(2);
  };

  // Check if date is in the future
  const isFutureDate = useCallback((dateString) => {
    if (!dateString) return false;
    const sessionDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate > today;
  }, []);

  // Get display text for homework status
  const getHomeworkStatusText = (status) => {
    if (!status) return "-";

    const statusMap = {
      Done: "ส่งแล้ว",
      Missing: "ขาดส่ง",
      "Not Assigned": "ไม่ได้สั่ง",
    };

    return statusMap[status] || status;
  };

  // Get display text for attendance status
  const getAttendanceStatusText = (status) => {
    if (!status) return "-";

    const statusMap = {
      Present: "มาเรียน",
      Absent: "ขาดเรียน",
      Late: "มาสาย",
    };

    return statusMap[status] || status;
  };

  // Filter details to only show up to current date
  const filterUpToCurrentDate = useCallback(
    (details) => {
      if (!details || !Array.isArray(details)) return [];

      const currentDate = getCurrentDate();
      return details.filter((detail) => {
        const sessionDate = detail.session_date;
        return sessionDate <= currentDate;
      });
    },
    [getCurrentDate],
  );

  // Get paginated learning details for a student
  const getPaginatedLearningDetails = useCallback(
    (studentId) => {
      const allDetails = studentDetails[studentId] || [];
      const filteredDetails = filterUpToCurrentDate(allDetails);
      const currentPage = learningPages[studentId] || 1;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      return {
        paginatedDetails: filteredDetails.slice(startIndex, endIndex),
        totalPages: Math.ceil(filteredDetails.length / itemsPerPage),
        totalItems: filteredDetails.length,
        currentPage,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, filteredDetails.length),
      };
    },
    [studentDetails, learningPages, itemsPerPage, filterUpToCurrentDate],
  );

  // Get paginated exam details for a student
  const getPaginatedExamDetails = useCallback(
    (studentId) => {
      const allDetails = examDetails[studentId] || [];
      const filteredDetails = allDetails; // Add any filtering if needed
      const currentPage = examPages[studentId] || 1;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      return {
        paginatedDetails: filteredDetails.slice(startIndex, endIndex),
        totalPages: Math.ceil(filteredDetails.length / itemsPerPage),
        totalItems: filteredDetails.length,
        currentPage,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, filteredDetails.length),
      };
    },
    [examDetails, examPages, itemsPerPage],
  );

  // Handle page change for learning
  const handleLearningPageChange = useCallback((studentId, page) => {
    setLearningPages((prev) => ({
      ...prev,
      [studentId]: page,
    }));
  }, []);

  // Handle page change for exam
  const handleExamPageChange = useCallback((studentId, page) => {
    setExamPages((prev) => ({
      ...prev,
      [studentId]: page,
    }));
  }, []);

  // Handle previous page for learning
  const handlePrevLearningPage = useCallback(
    (studentId, currentPage) => {
      if (currentPage > 1) {
        handleLearningPageChange(studentId, currentPage - 1);
      }
    },
    [handleLearningPageChange],
  );

  // Handle next page for learning
  const handleNextLearningPage = useCallback(
    (studentId, currentPage, totalPages) => {
      if (currentPage < totalPages) {
        handleLearningPageChange(studentId, currentPage + 1);
      }
    },
    [handleLearningPageChange],
  );

  // Handle previous page for exam
  const handlePrevExamPage = useCallback(
    (studentId, currentPage) => {
      if (currentPage > 1) {
        handleExamPageChange(studentId, currentPage - 1);
      }
    },
    [handleExamPageChange],
  );

  // Handle next page for exam
  const handleNextExamPage = useCallback(
    (studentId, currentPage, totalPages) => {
      if (currentPage < totalPages) {
        handleExamPageChange(studentId, currentPage + 1);
      }
    },
    [handleExamPageChange],
  );

  // Get tutor_id from account_id using your API
  const getTutorId = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/getTutorId?account_id=${accountId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tutor ID");
      }
      const data = await response.json();
      return data.tutor_id;
    } catch (error) {
      console.error("Error fetching tutor ID:", error);
      throw error;
    }
  }, [accountId]);

  // Fetch detailed learning records for a specific student
  const fetchStudentDetails = useCallback(
    async (studentId) => {
      if (loadingDetails[studentId]) {
        return;
      }

      try {
        setLoadingDetails((prev) => ({ ...prev, [studentId]: true }));

        const detailRes = await fetch(
          `http://localhost:3000/api/learningRecord/learningDetail?student_id=${studentId}`,
        );

        if (!detailRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลรายละเอียดได้");
        }

        const detailData = await detailRes.json();
        const filteredData = filterUpToCurrentDate(detailData);

        setStudentDetails((prev) => ({
          ...prev,
          [studentId]: Array.isArray(filteredData) ? filteredData : [],
        }));

        setLearningPages((prev) => ({
          ...prev,
          [studentId]: 1,
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
    },
    [loadingDetails, filterUpToCurrentDate],
  );

  // Fetch detailed exam records for a specific student
  const fetchExamDetails = useCallback(
    async (studentId) => {
      if (loadingExamDetails[studentId]) {
        return;
      }

      try {
        setLoadingExamDetails((prev) => ({ ...prev, [studentId]: true }));

        const detailRes = await fetch(
          `http://localhost:3000/api/learningRecord/examDetail?student_id=${studentId}`,
        );

        if (!detailRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลรายละเอียดการสอบได้");
        }

        const detailData = await detailRes.json();

        setExamDetails((prev) => ({
          ...prev,
          [studentId]: Array.isArray(detailData) ? detailData : [],
        }));

        setExamPages((prev) => ({
          ...prev,
          [studentId]: 1,
        }));
      } catch (err) {
        console.error("Error fetching exam details:", err);
        setExamDetails((prev) => ({
          ...prev,
          [studentId]: [],
        }));
      } finally {
        setLoadingExamDetails((prev) => ({ ...prev, [studentId]: false }));
      }
    },
    [loadingExamDetails],
  );

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    try {
      const tutor_id = await getTutorId();

      // Fetch fresh learning summary
      const summaryRes = await fetch(
        `http://localhost:3000/api/learningRecord/learningSummary?current_tutor_id=${tutor_id}`,
      );

      if (!summaryRes.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลบันทึกการเรียนรู้ได้");
      }

      const summaryData = await summaryRes.json();
      setLearningData(Array.isArray(summaryData) ? summaryData : []);

      // Fetch fresh exam summary
      const examRes = await fetch(
        `http://localhost:3000/api/learningRecord/examSummary?tutor_id=${tutor_id}`,
      );

      if (examRes.ok) {
        const examData = await examRes.json();
        setExamData(Array.isArray(examData) ? examData : []);
      }

      // Refresh details for expanded items if any
      if (expandedLearningId) {
        await fetchStudentDetails(expandedLearningId);
      }
      if (expandedExamId) {
        await fetchExamDetails(expandedExamId);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  }, [
    getTutorId,
    expandedLearningId,
    expandedExamId,
    fetchStudentDetails,
    fetchExamDetails,
  ]);

  // Start editing a detail record
  const startEditing = (detail) => {
    if (isFutureDate(detail.session_date)) {
      alert("ไม่สามารถแก้ไขข้อมูลในอนาคตได้");
      return;
    }

    const editId =
      detail.session_date + detail.course_name + (detail.course_id || "");
    setEditingDetail(editId);
    setEditFormData({
      lesson_topic: detail.lesson_topic || "",
      homework_status: detail.homework_status || "",
      attendance_status: detail.attendance_status || "",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingDetail(null);
    setEditFormData({
      lesson_topic: "",
      homework_status: "",
      attendance_status: "",
    });
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save edited detail
  const saveDetail = async (detail) => {
    try {
      if (isFutureDate(detail.session_date)) {
        alert("ไม่สามารถแก้ไขข้อมูลในอนาคตได้");
        return;
      }

      const saveId =
        detail.session_date + detail.course_name + (detail.course_id || "");
      setSavingId(saveId);

      const response = await fetch(
        `http://localhost:3000/api/learningRecord/updateLearningDetail`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            record_id: detail.record_id,
            attendance_id: detail.attendance_id,
            lesson_topic: editFormData.lesson_topic,
            homework_status: editFormData.homework_status,
            attendance_status: editFormData.attendance_status,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }

      await refreshAllData();

      setEditingDetail(null);
      setEditFormData({
        lesson_topic: "",
        homework_status: "",
        attendance_status: "",
      });
    } catch (err) {
      console.error("Error saving detail:", err);
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  // Toggle expand/collapse for learning
  const toggleLearningExpand = useCallback(
    (studentId) => {
      setExpandedLearningId((prev) => {
        const newExpandedId = prev === studentId ? null : studentId;
        if (
          newExpandedId &&
          !studentDetails[newExpandedId] &&
          !loadingDetails[newExpandedId]
        ) {
          fetchStudentDetails(newExpandedId);
        }
        return newExpandedId;
      });
    },
    [studentDetails, loadingDetails, fetchStudentDetails],
  );

  // Toggle expand/collapse for exam
  const toggleExamExpand = useCallback(
    (studentId) => {
      setExpandedExamId((prev) => {
        const newExpandedId = prev === studentId ? null : studentId;
        if (
          newExpandedId &&
          !examDetails[newExpandedId] &&
          !loadingExamDetails[newExpandedId]
        ) {
          fetchExamDetails(newExpandedId);
        }
        return newExpandedId;
      });
    },
    [examDetails, loadingExamDetails, fetchExamDetails],
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchAllData() {
      if (!accountId) {
        if (isMounted) {
          setError("กรุณาเข้าสู่ระบบ");
          setLoading(false);
          setInitialLoadComplete(true);
        }
        return;
      }

      try {
        setLoading(true);

        const tutor_id = await getTutorId();

        // Fetch learning summary
        const summaryRes = await fetch(
          `http://localhost:3000/api/learningRecord/learningSummary?current_tutor_id=${tutor_id}`,
        );

        if (!summaryRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลบันทึกการเรียนรู้ได้");
        }

        const summaryData = await summaryRes.json();

        // Fetch exam summary
        const examRes = await fetch(
          `http://localhost:3000/api/learningRecord/examSummary?tutor_id=${tutor_id}`,
        );

        const examData = examRes.ok ? await examRes.json() : [];

        if (isMounted) {
          setLearningData(Array.isArray(summaryData) ? summaryData : []);
          setExamData(Array.isArray(examData) ? examData : []);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (isMounted) {
          setError(
            "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า backend กำลังทำงานอยู่",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    }

    fetchAllData();
  }, [accountId, getTutorId]);

  // Group learning data by student
  const groupedLearningByStudent = learningData.reduce((acc, item) => {
    if (!acc[item.student_id]) {
      acc[item.student_id] = {
        student_id: item.student_id,
        student_name: item.student_name,
        student_picture: item.student_picture,
        last_topic: item.last_topic,
        parent_need: item.parent_need,
        courses: [],
      };
    }
    acc[item.student_id].courses.push({
      course_id: item.course_id,
      course_name: item.course_name,
      enrollment_id: item.enrollment_id,
      last_topic: item.last_topic,
      class_session_latest: item.class_session_latest,
      parent_need: item.parent_need,
      missing_homework: item.missing_homework,
    });
    return acc;
  }, {});

  // Group exam data by student
  // Group exam data by student
  const groupedExamByStudent = examData.reduce((acc, item) => {
    if (!acc[item.student_id]) {
      acc[item.student_id] = {
        student_id: item.student_id,
        student_name: item.student_name,
        picture_student: item.picture_student, // Changed from student_picture to picture_student
        exams: [],
      };
    }
    acc[item.student_id].exams.push({
      exam_id: item.exam_id,
      exam_topic: item.exam_lasted_topic,
      exam_date: item.exam_lasted_date,
      exam_score: item.exam_lasted_score,
    });
    return acc;
  }, {});

  const learningStudentsList = Object.values(groupedLearningByStudent);
  const examStudentsList = Object.values(groupedExamByStudent);

  // Loading state
  if (loading && !initialLoadComplete) {
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
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#a084dc",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </>
    );
  }

  // Main render
  return (
    <>
      <Navigation />
      <div className="learning-container">
        <h1 className="learning-title">บันทึกการเรียนรู้และผลการสอบ</h1>

        {/* Two-column layout for sections */}
        <div className="sections-container">
          {/* Learning Records Section */}
          <div className="section learning-section">
            <h2 className="section-title">
              <BookOpen size={24} /> บันทึกการเรียนรู้
            </h2>

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
                {learningStudentsList.map((student) => {
                  const isExpanded = expandedLearningId === student.student_id;
                  const allDetails = studentDetails[student.student_id] || [];
                  const details = filterUpToCurrentDate(allDetails);
                  const isLoadingDetail = loadingDetails[student.student_id];

                  const {
                    paginatedDetails,
                    totalPages,
                    totalItems,
                    currentPage,
                    startIndex,
                    endIndex,
                  } = getPaginatedLearningDetails(student.student_id);

                  return (
                    <div
                      key={student.student_id}
                      className={`learning-item ${isExpanded ? "active" : ""}`}
                    >
                      {/* Main row */}
                      <div
                        className="learning-row"
                        onClick={() => toggleLearningExpand(student.student_id)}
                      >
                        <div className="expand-cell">
                          {isExpanded ? (
                            <ChevronUp size={20} color="#a084dc" />
                          ) : (
                            <ChevronDown size={20} color="#a084dc" />
                          )}
                        </div>

                        <img
                          src={student.student_picture || nonggk}
                          alt={student.student_name}
                          className="student-avatar"
                          onError={(e) => {
                            e.target.src = nonggk;
                          }}
                        />

                        <div className="student-name-container">
                          <span className="student-name">
                            {student.student_name || "-"}
                          </span>
                        </div>

                        <div className="learning-details">
                          <span className="detail-item" data-label="คอร์ส">
                            {student.courses.length} คอร์ส
                          </span>
                          <span
                            className="detail-item"
                            data-label="หัวข้อล่าสุด"
                          >
                            {student.courses[0]?.last_topic || "-"}
                          </span>
                          <span
                            className="detail-item"
                            data-label="เรียนล่าสุด"
                          >
                            {formatDate(
                              student.courses[0]?.class_session_latest,
                            )}
                          </span>
                          <span
                            className="detail-item"
                            data-label="ความต้องการ"
                          >
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

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="expanded-details">
                          <div className="details-header">
                            <h3 className="details-title">
                              รายละเอียดการเรียนรู้ - {student.student_name}
                            </h3>

                            {totalPages > 1 && !isLoadingDetail && (
                              <div className="pagination-controls">
                                <span className="pagination-info">
                                  แสดง {startIndex} - {endIndex} จาก{" "}
                                  {totalItems} รายการ
                                </span>
                                <div className="pagination-arrows">
                                  <button
                                    className={`pagination-arrow ${currentPage === 1 ? "disabled" : ""}`}
                                    onClick={() =>
                                      handlePrevLearningPage(
                                        student.student_id,
                                        currentPage,
                                      )
                                    }
                                    disabled={currentPage === 1}
                                    title="หน้าก่อนหน้า"
                                  >
                                    <ChevronLeft size={18} />
                                  </button>
                                  <span className="pagination-page">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <button
                                    className={`pagination-arrow ${currentPage === totalPages ? "disabled" : ""}`}
                                    onClick={() =>
                                      handleNextLearningPage(
                                        student.student_id,
                                        currentPage,
                                        totalPages,
                                      )
                                    }
                                    disabled={currentPage === totalPages}
                                    title="หน้าถัดไป"
                                  >
                                    <ChevronRight size={18} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {isLoadingDetail ? (
                            <div className="details-loading">
                              <div className="small-spinner"></div>
                              <p>กำลังโหลดรายละเอียด...</p>
                            </div>
                          ) : paginatedDetails.length > 0 ? (
                            <div className="details-table">
                              <div className="details-header-row">
                                <div className="details-header-cell">
                                  วันที่
                                </div>
                                <div className="details-header-cell">คอร์ส</div>
                                <div className="details-header-cell">
                                  หัวข้อ
                                </div>
                                <div className="details-header-cell">
                                  สถานะการส่งงาน
                                </div>
                                <div className="details-header-cell">
                                  สถานะเข้าเรียน
                                </div>
                                <div className="details-header-cell">
                                  จัดการ
                                </div>
                              </div>

                              {paginatedDetails.map((detail, idx) => {
                                const editId =
                                  detail.session_date +
                                  detail.course_name +
                                  (detail.course_id || "");
                                const isEditing = editingDetail === editId;
                                const isSaving = savingId === editId;
                                const isFuture = isFutureDate(
                                  detail.session_date,
                                );

                                return (
                                  <div
                                    key={idx}
                                    className={`details-row ${isFuture ? "future-row" : ""}`}
                                  >
                                    <div
                                      className="details-cell"
                                      data-label="วันที่"
                                    >
                                      {formatDate(detail.session_date)}
                                      {isFuture && (
                                        <span className="future-badge">
                                          อนาคต
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className="details-cell"
                                      data-label="คอร์ส"
                                    >
                                      {detail.course_name || "-"}
                                    </div>

                                    <div
                                      className="details-cell"
                                      data-label="หัวข้อ"
                                    >
                                      {isEditing && !isFuture ? (
                                        <input
                                          type="text"
                                          className="edit-input"
                                          value={editFormData.lesson_topic}
                                          onChange={(e) =>
                                            handleInputChange(
                                              "lesson_topic",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="เพิ่มหัวข้อ"
                                          disabled={isSaving}
                                        />
                                      ) : (
                                        detail.lesson_topic || "-"
                                      )}
                                    </div>

                                    <div
                                      className="details-cell"
                                      data-label="การบ้าน"
                                    >
                                      {isEditing && !isFuture ? (
                                        <select
                                          className="edit-select"
                                          value={editFormData.homework_status}
                                          onChange={(e) =>
                                            handleInputChange(
                                              "homework_status",
                                              e.target.value,
                                            )
                                          }
                                          disabled={isSaving}
                                        >
                                          <option value="">เลือกสถานะ</option>
                                          <option value="Done">ส่งแล้ว</option>
                                          <option value="Missing">
                                            ขาดส่ง
                                          </option>
                                          <option value="Not Assigned">
                                            ไม่ได้สั่ง
                                          </option>
                                        </select>
                                      ) : (
                                        getHomeworkStatusText(
                                          detail.homework_status,
                                        )
                                      )}
                                    </div>

                                    <div
                                      className="details-cell"
                                      data-label="สถานะ"
                                    >
                                      {isEditing && !isFuture ? (
                                        <select
                                          className="edit-select"
                                          value={editFormData.attendance_status}
                                          onChange={(e) =>
                                            handleInputChange(
                                              "attendance_status",
                                              e.target.value,
                                            )
                                          }
                                          disabled={isSaving}
                                        >
                                          <option value="">เลือกสถานะ</option>
                                          <option value="Present">
                                            มาเรียน
                                          </option>
                                          <option value="Absent">
                                            ขาดเรียน
                                          </option>
                                          <option value="Late">มาสาย</option>
                                        </select>
                                      ) : (
                                        getAttendanceStatusText(
                                          detail.attendance_status,
                                        )
                                      )}
                                    </div>

                                    <div className="details-cell actions-cell">
                                      {!isFuture &&
                                        (isEditing ? (
                                          <div className="action-buttons">
                                            <button
                                              className="action-btn save-btn"
                                              onClick={() =>
                                                saveDetail({
                                                  ...detail,
                                                  student_id:
                                                    student.student_id,
                                                })
                                              }
                                              disabled={isSaving}
                                            >
                                              {isSaving ? (
                                                <div className="small-spinner"></div>
                                              ) : (
                                                <Save size={16} />
                                              )}
                                            </button>
                                            <button
                                              className="action-btn cancel-btn"
                                              onClick={cancelEditing}
                                              disabled={isSaving}
                                            >
                                              <X size={16} />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            className="action-btn edit-btn"
                                            onClick={() => startEditing(detail)}
                                            title="แก้ไขข้อมูล"
                                          >
                                            <Edit2 size={16} />
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="no-details">
                              ไม่มีรายละเอียดการเรียนรู้
                            </p>
                          )}

                          {allDetails.length > details.length && (
                            <p className="filtered-message">
                              *แสดงเฉพาะข้อมูลจนถึงวันนี้ (
                              {allDetails.length - details.length}{" "}
                              รายการในอนาคตถูกซ่อนไว้)
                            </p>
                          )}

                          {details.length > itemsPerPage &&
                            !isLoadingDetail && (
                              <div className="pagination-footer">
                                <span>กำลังแสดง 10 รายการ ต่อหน้า</span>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="learning-footer">
                <div className="total-row">
                  <span>นักเรียนทั้งหมด {learningStudentsList.length} คน</span>
                  <span>รายการทั้งหมด {learningData.length} รายการ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Records Section */}
          <div className="section exam-section">
            <h2 className="section-title">
              <FileText size={24} /> ผลการสอบ
            </h2>

            <div className="learning-list">
              {/* Header */}
              <div className="learning-header">
                <div className="header-expand-space"></div>
                <div className="header-image-space"></div>
                <div className="header-name-space">นักเรียน</div>
                <div className="header-details">
                  <span className="header-item">จำนวนสอบ</span>
                  <span className="header-item">วิชาล่าสุด</span>
                  <span className="header-item">วันที่สอบ</span>
                  <span className="header-item">คะแนน</span>
                  <span className="header-item">สถานะ</span>
                </div>
              </div>

              {/* Data rows */}
              <div className="learning-rows">
                {examStudentsList.map((student) => {
                  const isExpanded = expandedExamId === student.student_id;
                  const isLoadingDetail =
                    loadingExamDetails[student.student_id];
                  const latestExam = student.exams[0];

                  const {
                    paginatedDetails,
                    totalPages,
                    totalItems,
                    currentPage,
                    startIndex,
                    endIndex,
                  } = getPaginatedExamDetails(student.student_id);

                  return (
                    <div
                      key={student.student_id}
                      className={`learning-item ${isExpanded ? "active" : ""}`}
                    >
                      {/* Main row */}
                      <div
                        className="learning-row"
                        onClick={() => toggleExamExpand(student.student_id)}
                      >
                        <div className="expand-cell">
                          {isExpanded ? (
                            <ChevronUp size={20} color="#a084dc" />
                          ) : (
                            <ChevronDown size={20} color="#a084dc" />
                          )}
                        </div>

                        <img
                          src={student.picture_student || nonggk}
                          alt={student.student_name}
                          className="student-avatar"
                          onError={(e) => {
                            e.target.src = nonggk;
                          }}
                        />

                        <div className="student-name-container">
                          <span className="student-name">
                            {student.student_name || "-"}
                          </span>
                        </div>

                        <div className="learning-details">
                          <span className="detail-item" data-label="จำนวนสอบ">
                            {student.exams.length} ครั้ง
                          </span>
                          <span className="detail-item" data-label="วิชาล่าสุด">
                            {latestExam?.exam_topic || "-"}
                          </span>
                          <span className="detail-item" data-label="วันที่สอบ">
                            {formatDate(latestExam?.exam_date)}
                          </span>
                          <span className="detail-item" data-label="คะแนน">
                            <span className="exam-score-badge">
                              {formatScore(latestExam?.exam_score)}
                            </span>
                          </span>
                          <span className="detail-item" data-label="สถานะ">
                            <span
                              className={`badge ${
                                latestExam?.exam_score >= 50
                                  ? "badge-success"
                                  : "badge-warning"
                              }`}
                            >
                              {latestExam?.exam_score >= 50
                                ? "ผ่าน"
                                : "ไม่ผ่าน"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="expanded-details">
                          <div className="details-header">
                            <h3 className="details-title">
                              รายละเอียดผลการสอบ - {student.student_name}
                            </h3>

                            {totalPages > 1 && !isLoadingDetail && (
                              <div className="pagination-controls">
                                <span className="pagination-info">
                                  แสดง {startIndex} - {endIndex} จาก{" "}
                                  {totalItems} รายการ
                                </span>
                                <div className="pagination-arrows">
                                  <button
                                    className={`pagination-arrow ${currentPage === 1 ? "disabled" : ""}`}
                                    onClick={() =>
                                      handlePrevExamPage(
                                        student.student_id,
                                        currentPage,
                                      )
                                    }
                                    disabled={currentPage === 1}
                                    title="หน้าก่อนหน้า"
                                  >
                                    <ChevronLeft size={18} />
                                  </button>
                                  <span className="pagination-page">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <button
                                    className={`pagination-arrow ${currentPage === totalPages ? "disabled" : ""}`}
                                    onClick={() =>
                                      handleNextExamPage(
                                        student.student_id,
                                        currentPage,
                                        totalPages,
                                      )
                                    }
                                    disabled={currentPage === totalPages}
                                    title="หน้าถัดไป"
                                  >
                                    <ChevronRight size={18} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {isLoadingDetail ? (
                            <div className="details-loading">
                              <div className="small-spinner"></div>
                              <p>กำลังโหลดรายละเอียด...</p>
                            </div>
                          ) : paginatedDetails.length > 0 ? (
                            <div className="details-table">
                              <div className="details-header-row">
                                <div className="details-header-cell">
                                  วันที่สอบ
                                </div>
                                <div className="details-header-cell">
                                  วิชาที่สอบ
                                </div>
                                <div className="details-header-cell">คะแนน</div>
                                <div className="details-header-cell">
                                  ผลการสอบ
                                </div>
                                {/* Remove this line */}
                                {/* <div className="details-header-cell">หมายเหตุ</div> */}
                              </div>

                              {paginatedDetails.map((exam, idx) => (
                                <div key={idx} className="details-row">
                                  <div
                                    className="details-cell"
                                    data-label="วันที่สอบ"
                                  >
                                    {formatDate(exam.exam_date)}
                                  </div>
                                  <div
                                    className="details-cell"
                                    data-label="วิชาที่สอบ"
                                  >
                                    {exam.exam_topic || "-"}
                                  </div>
                                  <div
                                    className="details-cell"
                                    data-label="คะแนน"
                                  >
                                    <span className="exam-score-badge">
                                      {formatScore(exam.exam_score)}
                                    </span>
                                  </div>
                                  <div
                                    className="details-cell"
                                    data-label="ผลการสอบ"
                                  >
                                    <span
                                      className={`badge ${
                                        exam.exam_score >= 50
                                          ? "badge-success"
                                          : "badge-warning"
                                      }`}
                                    >
                                      {exam.exam_score >= 50
                                        ? "ผ่าน"
                                        : "ไม่ผ่าน"}
                                    </span>
                                  </div>
                                  {/* Remove this div */}
                                  {/* <div
                                    className="details-cell"
                                    data-label="หมายเหตุ"
                                  >
                                    {exam.remark || "-"}
                                  </div> */}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-details">ไม่มีรายละเอียดการสอบ</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="learning-footer">
                <div className="total-row">
                  <span>นักเรียนทั้งหมด {examStudentsList.length} คน</span>
                  <span>รายการทั้งหมด {examData.length} รายการ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
