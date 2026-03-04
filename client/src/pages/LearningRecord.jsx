import "./LearningRecord.css";
import Navigation from "../components/Navigation";
import { useState, useEffect, useCallback } from "react";
import nonggk from "../assets/nonggk.jpg"; // Default image
import { ChevronDown, ChevronUp, Edit2, Save, X } from "lucide-react";

export function LearningRecord() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [learningData, setLearningData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [studentDetails, setStudentDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [editFormData, setEditFormData] = useState({
    lesson_topic: "",
    homework_status: "",
    attendance_status: "",
  });
  const [savingId, setSavingId] = useState(null);

  const accountId = localStorage.getItem("account_id");

  // Get current date for filtering
  const getCurrentDate = useCallback(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
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
      if (loadingDetails[studentId] || studentDetails[studentId]) {
        return;
      }

      try {
        setLoadingDetails((prev) => ({ ...prev, [studentId]: true }));

        // Use your existing API endpoint
        const detailRes = await fetch(
          `http://localhost:3000/api/learningRecord/learningDetail?student_id=${studentId}`,
        );

        if (!detailRes.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลรายละเอียดได้");
        }

        const detailData = await detailRes.json();

        // Filter to only show up to current date
        const filteredData = filterUpToCurrentDate(detailData);

        setStudentDetails((prev) => ({
          ...prev,
          [studentId]: Array.isArray(filteredData) ? filteredData : [],
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
    [loadingDetails, studentDetails, filterUpToCurrentDate],
  );

  // Start editing a detail record
  const startEditing = (detail) => {
    // Check if this is a future date - if so, don't allow editing
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
      // Double-check if this is a future date
      if (isFutureDate(detail.session_date)) {
        alert("ไม่สามารถแก้ไขข้อมูลในอนาคตได้");
        return;
      }

      const saveId =
        detail.session_date + detail.course_name + (detail.course_id || "");
      setSavingId(saveId);

      console.log("Saving with:", {
        record_id: detail.record_id,
        attendance_id: detail.attendance_id,
        lesson_topic: editFormData.lesson_topic,
        homework_status: editFormData.homework_status,
        attendance_status: editFormData.attendance_status,
      });

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

      const result = await response.json();
      console.log("Save successful:", result);

      // IMPORTANT: Refresh the data for this student
      await fetchStudentDetails(detail.student_id);

      // Exit edit mode
      setEditingDetail(null);
      setEditFormData({
        lesson_topic: "",
        homework_status: "",
        attendance_status: "",
      });

      alert("บันทึกข้อมูลสำเร็จ");
    } catch (err) {
      console.error("Error saving detail:", err);
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };
  // Toggle expand/collapse for a student
  const toggleExpand = useCallback(
    (studentId) => {
      setExpandedId((prev) => {
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

  useEffect(() => {
    let isMounted = true;

    async function fetchLearningSummary() {
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

        // Get tutor_id from account_id using your API
        const tutor_id = await getTutorId();

        // Fetch learning summary using your API
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

    fetchLearningSummary();
  }, [accountId, getTutorId]);

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

  const studentsList = Object.values(groupedByStudent);

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

  // No data state
  if (!learningData.length && initialLoadComplete) {
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
              const allDetails = studentDetails[student.student_id] || [];
              // Filter details to only show up to current date
              const details = filterUpToCurrentDate(allDetails);
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
                            <div className="details-header-cell">
                              สถานะการส่งงาน
                            </div>
                            <div className="details-header-cell">
                              สถานะเข้าเรียน
                            </div>
                            <div className="details-header-cell">จัดการ</div>
                          </div>

                          {/* Details rows */}
                          {details.map((detail, idx) => {
                            const editId =
                              detail.session_date +
                              detail.course_name +
                              (detail.course_id || "");
                            const isEditing = editingDetail === editId;
                            const isSaving = savingId === editId;
                            const isFuture = isFutureDate(detail.session_date);

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
                                    <span className="future-badge">อนาคต</span>
                                  )}
                                </div>
                                <div
                                  className="details-cell"
                                  data-label="คอร์ส"
                                >
                                  {detail.course_name || "-"}
                                </div>

                                {/* Lesson topic field */}
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

                                {/* Homework status */}
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
                                      <option value="Missing">ขาดส่ง</option>
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

                                {/* Attendance status */}
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
                                      <option value="Present">มาเรียน</option>
                                      <option value="Absent">ขาดเรียน</option>
                                      <option value="Late">มาสาย</option>
                                    </select>
                                  ) : (
                                    getAttendanceStatusText(
                                      detail.attendance_status,
                                    )
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div className="details-cell actions-cell">
                                  {!isFuture &&
                                    (isEditing ? (
                                      <div className="action-buttons">
                                        <button
                                          className="action-btn save-btn"
                                          onClick={() =>
                                            saveDetail({
                                              ...detail,
                                              student_id: student.student_id,
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
                        <p className="no-details">ไม่มีรายละเอียดการเรียนรู้</p>
                      )}

                      {/* Show count of filtered records */}
                      {allDetails.length > details.length && (
                        <p className="filtered-message">
                          *แสดงเฉพาะข้อมูลจนถึงวันนี้ (
                          {allDetails.length - details.length}{" "}
                          รายการในอนาคตถูกซ่อนไว้)
                        </p>
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
