import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./TutorCourseDetail.css";

export function TutorCourseDetail() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    // State สำหรับ popup ลบ
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteCheck, setDeleteCheck] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const fetchCourseDetail = async () => {
            try {
                const res = await fetch(
                    `http://localhost:3000/api/course/${courseId}/detail`
                );

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                setCourse(data.course);
                setStudents(data.students || []);
                setFilteredStudents(data.students || []);
                setError(null);
            } catch (err) {
                console.error("Fetch error:", err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourseDetail();
        } else {
            setError("ไม่พบรหัสคอร์ส");
            setLoading(false);
        }
    }, [courseId]);

    // Filter students by search
    useEffect(() => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) {
            setFilteredStudents(students);
            return;
        }

        const filtered = students.filter(student =>
            student.student_nickname?.toLowerCase().includes(keyword) ||
            student.student_fname?.toLowerCase().includes(keyword) ||
            student.student_lname?.toLowerCase().includes(keyword)
        );

        setFilteredStudents(filtered);
    }, [search, students]);

    // Update status
    const handleStatusChange = async (enrollmentId, newStatus) => {
        try {
            setUpdatingId(enrollmentId);

            const res = await fetch(
                `http://localhost:3000/api/enrollment/${enrollmentId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "เกิดข้อผิดพลาด");
            }

            // อัปเดต state
            setStudents(prev =>
                prev.map(s =>
                    s.enrollment_id === enrollmentId
                        ? { ...s, enrollment_status: newStatus }
                        : s
                )
            );

            alert("อัปเดตสถานะสำเร็จ");
        } catch (err) {
            console.error("Update error:", err.message);
            alert("เกิดข้อผิดพลาด: " + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/tutorcourse');
        }
    };
    // ฟังก์ชันตรวจสอบก่อนลบ
    const handleDeleteClick = async () => {
        try {
            const res = await fetch(
                `http://localhost:3000/api/course/${courseId}/check-delete`
            );
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาด");
            }

            setDeleteCheck(data);

            if (data.can_delete) {
                setShowDeletePopup(true);
            } else {
                alert(data.message || "ไม่สามารถลบคอร์สได้เนื่องจากมีนักเรียนที่เคยลงทะเบียนแล้ว");
            }
        } catch (err) {
            console.error("Check delete error:", err.message);
            alert("เกิดข้อผิดพลาด: " + err.message);
        }
    };

    // ฟังก์ชันยืนยันการลบ
    const confirmDelete = async () => {
        try {
            setDeleting(true);

            const res = await fetch(
                `http://localhost:3000/api/course/${courseId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        account_id: localStorage.getItem("account_id")
                    })
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาด");
            }

            alert("ลบคอร์สสำเร็จ");
            navigate('/tutorcourse'); // กลับไปหน้ารายการคอร์ส

        } catch (err) {
            console.error("Delete error:", err.message);
            alert("เกิดข้อผิดพลาด: " + err.message);
            setShowDeletePopup(false);
        } finally {
            setDeleting(false);
        }
    };
    // Split students by status
    const completedStudents = filteredStudents.filter(
        s => s.enrollment_status === "จบแล้ว"
    );

    const studyingStudents = filteredStudents.filter(
        s => s.enrollment_status === "กำลังเรียน"
    );

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="course-detail-page">
                    <div className="loading-container">
                        <p>กำลังโหลด...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navigation />
                <div className="course-detail-page">
                    <div className="error-container">
                        <p>เกิดข้อผิดพลาด: {error}</p>
                        <button onClick={handleGoBack}>กลับไปหน้าก่อนหน้า</button>
                    </div>
                </div>
            </>
        );
    }

    if (!course) {
        return (
            <>
                <Navigation />
                <div className="course-detail-page">
                    <div className="error-container">
                        <p>ไม่พบข้อมูลคอร์ส</p>
                        <button onClick={handleGoBack}>กลับไปหน้าก่อนหน้า</button>
                    </div>
                </div>
            </>
        );
    }

    // เพิ่มฟังก์ชันนี้ก่อน return
    const renderStudentAvatar = (student) => {
        if (student.student_picture) {
            return (
                <img
                    src={student.student_picture}
                    alt={student.student_nickname}
                    className="student-avatar-img"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = student.student_nickname?.charAt(0) || '?';
                    }}
                />
            );
        }
        return student.student_nickname?.charAt(0) || '?';
    };

    return (
        <>
            <Navigation />
            <div className="course-detail-page">
                <div className="course-detail-container">
                    {/* Header with back button */}
                    <div className="header-section">
                        <button className="back-button" onClick={handleGoBack}>
                            ← กลับ
                        </button>
                    </div>

                    {/* หัวข้อหลัก และปุ่มแก้ไข/ลบ */}
                    <div className="course-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '30px'
                    }}>
                        <h1 className="course-title" style={{ marginBottom: 0 }}>{course.course_name_thai}</h1>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="edit-course-btn"
                                onClick={() => navigate(`/course/${courseId}/edit`)}
                            >
                                แก้ไขคอร์ส
                            </button>
                            <button
                                className="delete-course-btn"
                                onClick={handleDeleteClick}
                            >
                                ลบคอร์ส
                            </button>
                        </div>
                    </div>

                    {/* Popup ยืนยันการลบ */}
                    {showDeletePopup && (
                        <div className="delete-popup-overlay">
                            <div className="delete-popup">
                                <h3>ยืนยันการลบคอร์ส</h3>
                                <p>คุณแน่ใจหรือไม่ว่าต้องการลบคอร์ส "{course.course_name_thai}"?</p>

                                {/* แสดงข้อมูลเพิ่มเติมจาก deleteCheck */}
                                {deleteCheck && deleteCheck.student_count > 0 && (
                                    <p className="delete-info">
                                        มีนักเรียนที่เคยลงทะเบียนแล้ว {deleteCheck.student_count} คน
                                    </p>
                                )}

                                <p className="delete-warning">การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
                                <div className="delete-popup-buttons">
                                    <button
                                        className="cancel-delete-btn"
                                        onClick={() => setShowDeletePopup(false)}
                                        disabled={deleting}
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        className="confirm-delete-btn"
                                        onClick={confirmDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? "กำลังลบ..." : "ยืนยันการลบ"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* ข้อมูลคอร์ส */}
                    <div className="info-section">

                        <h2 className="section-title">ข้อมูลคอร์ส</h2>




                        <div className="info-grid">
                            <div className="info-row">
                                <span className="info-label">ชื่อคอร์สภาษาไทย:</span>
                                <span className="info-value">{course.course_name_thai}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">ชื่อคอร์สภาษาอังกฤษ:</span>
                                <span className="info-value">{course.course_name_eng || '-'}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">ระดับชั้น:</span>
                                <span className="info-value">{course.grade_level?.grade_level_name || '-'}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">รายวิชา:</span>
                                <span className="info-value">{course.course_subject}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">ราคาต่อชั่วโมง:</span>
                                <span className="info-value">{course.price?.toLocaleString()} บาท</span>
                            </div>
                        </div>
                    </div>

                    {/* คำอธิบายคอร์ส */}
                    <div className="info-section">
                        <h2 className="section-title">คำอธิบายคอร์ส</h2>
                        <div className="course-description">
                            <p>{course.course_description || 'ไม่มีคำอธิบาย'}</p>
                        </div>
                    </div>

                    {/* รายละเอียดคอร์ส */}
                    <div className="info-section">
                        <h2 className="section-title">รายละเอียดคอร์ส</h2>
                        <div className="course-details">
                            <p>{course.course_info || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                        </div>
                    </div>

                    {/* รูปภาพคอร์ส (ถ้ามี) */}
                    {course.course_image && (
                        <div className="info-section">
                            <h2 className="section-title">ภาพปกคอร์ส</h2>
                            <img
                                src={course.course_image}
                                alt={course.course_name_thai}
                                className="course-image-large"
                                onError={(e) => {
                                    e.target.src = "/default-course-image.png";
                                }}
                            />
                        </div>
                    )}

                    {/* ========== ส่วนแสดงรายชื่อนักเรียน ========== */}
                    <div className="students-section">
                        <h2 className="section-title">รายชื่อนักเรียนในคอร์ส</h2>

                        {/* ช่องค้นหา */}
                        <div className="search-section">
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อนักเรียน..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        {/* นักเรียนที่กำลังเรียน */}
                        {studyingStudents.length > 0 && (
                            <div className="student-status-section">
                                <h3 className="status-title">กำลังเรียน ({studyingStudents.length})</h3>
                                <div className="students-list">
                                    {studyingStudents.map((student) => (
                                        <div key={student.enrollment_id} className="student-card">
                                            <div className="student-header">
                                                <div className="student-avatar">
                                                    {renderStudentAvatar(student)}
                                                </div>
                                                <div className="student-info">
                                                    <h4>{student.student_nickname || '-'}</h4>
                                                    <p>{student.student_fname || ''} {student.student_lname || ''}</p>
                                                </div>
                                                <div className="student-status">
                                                    <select
                                                        value={student.enrollment_status}
                                                        onChange={(e) => handleStatusChange(student.enrollment_id, e.target.value)}
                                                        disabled={updatingId === student.enrollment_id}
                                                        className="status-select studying"
                                                    >
                                                        <option value="กำลังเรียน">กำลังเรียน</option>
                                                        <option value="จบแล้ว">จบแล้ว</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="parent-info">
                                                <div className="info-row">
                                                    <span className="info-label">ชื่อผู้ปกครอง:</span>
                                                    <span className="info-value">
                                                        {student.parent?.fname || ''} {student.parent?.lname || ''}
                                                    </span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">เบอร์โทร:</span>
                                                    <span className="info-value">{student.parent?.tel || '-'}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">ไอดีไลน์:</span>
                                                    <span className="info-value">{student.parent?.line_id || '-'}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">เฟสบุ๊ค:</span>
                                                    <span className="info-value">{student.parent?.fb_name || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* นักเรียนที่จบแล้ว */}
                        {completedStudents.length > 0 && (
                            <div className="student-status-section">
                                <h3 className="status-title">จบแล้ว ({completedStudents.length})</h3>
                                <div className="students-list">
                                    {completedStudents.map((student) => (
                                        <div key={student.enrollment_id} className="student-card">
                                            <div className="student-header">
                                                <div className="student-avatar">
                                                    {student.student_picture ? (
                                                        <img
                                                            src={student.student_picture}
                                                            alt={student.student_nickname}
                                                            className="student-avatar-img"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = student.student_nickname?.charAt(0) || '?';
                                                            }}
                                                        />
                                                    ) : (
                                                        student.student_nickname?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <div className="student-info">
                                                    <h4>{student.student_nickname || '-'}</h4>
                                                    <p>{student.student_fname || ''} {student.student_lname || ''}</p>
                                                </div>
                                                <div className="student-status">
                                                    <select
                                                        value={student.enrollment_status}
                                                        onChange={(e) => handleStatusChange(student.enrollment_id, e.target.value)}
                                                        disabled={updatingId === student.enrollment_id}
                                                        className="status-select completed"
                                                    >
                                                        <option value="กำลังเรียน">กำลังเรียน</option>
                                                        <option value="จบแล้ว">จบแล้ว</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="parent-info">
                                                <div className="info-row">
                                                    <span className="info-label">ชื่อผู้ปกครอง:</span>
                                                    <span className="info-value">
                                                        {student.parent?.fname || ''} {student.parent?.lname || ''}
                                                    </span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">เบอร์โทร:</span>
                                                    <span className="info-value">{student.parent?.tel || '-'}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">ไอดีไลน์:</span>
                                                    <span className="info-value">{student.parent?.line_id || '-'}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">เฟสบุ๊ค:</span>
                                                    <span className="info-value">{student.parent?.fb_name || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}



                        {/* ไม่มีนักเรียน */}
                        {filteredStudents.length === 0 && (
                            <div className="no-students">
                                <p>{search ? "ไม่พบนักเรียนที่ค้นหา" : "ยังไม่มีนักเรียนในคอร์สนี้"}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}