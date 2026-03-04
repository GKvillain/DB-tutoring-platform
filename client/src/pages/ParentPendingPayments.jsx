import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ParentPendingPayments.css";
import ParentSidebar from "../components/ParentSidebar";

export function ParentPendingPayments() {
  const navigate = useNavigate();
  const parentId = localStorage.getItem("parent_id");
  
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState({});

  // ดึงรายชื่อนักเรียน
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const res = await fetch(`http://localhost:3000/api/parent/students?parent_id=${parentId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0) {
            setSelectedStudentId(data[0].student_id);
          }
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoadingStudents(false);
      }
    };

    if (parentId) {
      fetchStudents();
    }
  }, [parentId]);

  // เมื่อเลือกนักเรียน ดึงรายการค้างชำระ
  useEffect(() => {
    const fetchPendingPayments = async () => {
      if (!selectedStudentId) return;
      
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/parent/pending-payments?student_id=${selectedStudentId}`);
        const data = await res.json();
        setPendingPayments(Array.isArray(data) ? data : []);
        
        const student = students.find(s => s.student_id === selectedStudentId);
        setSelectedStudent(student);

        // ขยายรายการแรกโดยอัตโนมัติ
        const initialExpanded = {};
        if (Array.isArray(data) && data.length > 0) {
          data.forEach((item, index) => {
            initialExpanded[item.enrollment_id] = index === 0;
          });
        }
        setExpandedCourses(initialExpanded);
      } catch (err) {
        console.error("Error fetching pending payments:", err);
        setPendingPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, [selectedStudentId, students]);

  const toggleCourse = (enrollmentId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [enrollmentId]: !prev[enrollmentId]
    }));
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) || '0.00';
  };

  const calculateTotal = (pendingMonths) => {
    return pendingMonths.reduce((sum, month) => sum + month.amount, 0);
  };

  if (loadingStudents) {
    return (
      <>
        <ParentSidebar />
        <div className="payment-page">
          <div className="loading-state">กำลังโหลดข้อมูล...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <ParentSidebar />
      <div className="payment-page">
        <div className="payment-container">
          {/* Header */}
          <div className="payment-header">
            <h1 className="page-title">รายการค้างชำระ</h1>
            
            <div className="filter-section">
              <div className="filter-group">
                <label>เลือกนักเรียน</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="filter-select"
                >
                  <option value="">เลือกนักเรียน</option>
                  {students.map((std) => (
                    <option key={std.student_id} value={std.student_id}>
                      {std.student_fullname} ({std.student_nickname})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedStudent ? (
            <div className="payment-content">
              {/* Student Info */}
              <div className="student-info-card">
                <div className="student-avatar">
                  {selectedStudent?.student_nickname?.charAt(0) || 'น'}
                </div>
                <div className="student-details">
                  <h2>{selectedStudent?.student_fullname}</h2>
                  <p className="student-nick">({selectedStudent?.student_nickname})</p>
                </div>
              </div>

              {/* Pending Payments List */}
              {loading ? (
                <div className="loading-state">กำลังโหลดรายการ...</div>
              ) : pendingPayments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <h3>ไม่มีรายการค้างชำระ</h3>
                  <p>คุณไม่มีรายการค้างชำระสำหรับนักเรียนคนนี้</p>
                </div>
              ) : (
                <div className="pending-payments-list">
                  {pendingPayments.map((item, idx) => {
                    const totalAmount = calculateTotal(item.pendingMonths);
                    const isExpanded = expandedCourses[item.enrollment_id];

                    return (
                      <div key={idx} className="pending-course-card">
                        <div 
                          className="course-header clickable"
                          onClick={() => toggleCourse(item.enrollment_id)}
                        >
                          <div className="course-title-section">
                            <h3 className="course-title">
                              {item.course.name}
                              {item.course.nameEng && (
                                <span className="course-title-eng"> | {item.course.nameEng}</span>
                              )}
                            </h3>
                            <p className="tutor-name">ผู้สอน: {item.tutor.name}</p>
                          </div>
                          <div className="course-summary">
                            <span className="pending-count">{item.pendingMonths.length} เดือน</span>
                            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pending-months">
                            <table className="pending-table">
                              <thead>
                                <tr>
                                  <th>เดือน/ปี</th>
                                  <th>ยอดชำระ</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.pendingMonths.map((month, monthIdx) => (
                                  <tr key={monthIdx}>
                                    <td className="month-cell">{month.monthName}</td>
                                    <td className="number-cell highlight">{formatCurrency(month.amount)}</td>
                                    <td>
                                      <button 
                                        className="pay-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate('/parent/payment-checkout', { 
                                            state: { 
                                              enrollmentId: item.enrollment_id,
                                              course: item.course,
                                              tutor: item.tutor,
                                              month: month
                                            } 
                                          });
                                        }}
                                      >
                                        ชำระ
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="course-total">
                              <span className="total-label">รวมทั้งสิ้น</span>
                              <span className="total-amount">
                                {formatCurrency(totalAmount)} บาท
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="select-student-prompt">
              <div className="prompt-icon">👤</div>
              <h3>กรุณาเลือกนักเรียน</h3>
              <p>เลือกนักเรียนเพื่อดูรายการค้างชำระ</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}