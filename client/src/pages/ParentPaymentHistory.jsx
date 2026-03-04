import { useEffect, useState } from "react";
import "./ParentPaymentHistory.css";
import ParentSidebar from "../components/ParentSidebar";

export function ParentPaymentHistory() {
  const parentId = localStorage.getItem("parent_id");
  
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [fetchError, setFetchError] = useState(null);

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

  // เมื่อเลือกนักเรียน ดึงคอร์สของนักเรียน
  useEffect(() => {
    const fetchStudentCourses = async () => {
      if (!selectedStudentId) return;
      
      try {
        const res = await fetch(`http://localhost:3000/api/parent/student-courses?student_id=${selectedStudentId}`);
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
        setSelectedCourseId("all");
      } catch (err) {
        console.error("Error fetching courses:", err);
        setCourses([]);
      }
    };

    if (selectedStudentId) {
      fetchStudentCourses();
      const student = students.find(s => s.student_id === selectedStudentId);
      setSelectedStudent(student);
    }
  }, [selectedStudentId, students]);

  // เมื่อเลือกนักเรียนและคอร์ส ดึงประวัติการชำระเงิน
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!selectedStudentId) return;
      
      setLoading(true);
      setFetchError(null);
      try {
        let url = `http://localhost:3000/api/parent/payment-history?student_id=${selectedStudentId}`;
        if (selectedCourseId && selectedCourseId !== "all") {
          url += `&course_id=${selectedCourseId}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (!res.ok) {
          setFetchError(data.error || "เกิดข้อผิดพลาด");
          setPaymentHistory([]);
        } else {
          setPaymentHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching payment history:", err);
        setFetchError("ไม่สามารถโหลดข้อมูลได้");
        setPaymentHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [selectedStudentId, selectedCourseId]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    let badgeClass = 'status-badge';
    let statusText = status || 'รอชำระ';
    
    switch(status?.toLowerCase()) {
      case 'paid':
      case 'ชำระแล้ว':
        badgeClass += ' status-paid';
        statusText = 'ชำระแล้ว';
        break;
      case 'pending':
      case 'รอชำระ':
        badgeClass += ' status-pending';
        statusText = 'รอชำระ';
        break;
      case 'overdue':
      case 'ค้างชำระ':
        badgeClass += ' status-overdue';
        statusText = 'ค้างชำระ';
        break;
      default:
        badgeClass += ' status-pending';
        statusText = 'รอชำระ';
    }
    
    return <span className={badgeClass}>{statusText}</span>;
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
            <h1 className="page-title">ประวัติการชำระเงิน</h1>
            
            <div className="filter-section">
              {/* เลือกนักเรียน */}
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

              {/* เลือกคอร์ส */}
              {selectedStudent && courses.length > 0 && (
                <div className="filter-group">
                  <label>เลือกคอร์ส</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">ทั้งหมด</option>
                    {courses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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

              {/* Error Message */}
              {fetchError && (
                <div className="error-message">
                  เกิดข้อผิดพลาด: {fetchError}
                </div>
              )}

              {/* Payment History */}
              {loading ? (
                <div className="loading-state">กำลังโหลดประวัติการชำระเงิน...</div>
              ) : !paymentHistory || paymentHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💰</div>
                  <p>ไม่มีประวัติการชำระเงิน</p>
                </div>
              ) : (
                <div className="payment-history">
                  {paymentHistory.map((enrollment, idx) => (
                    <div key={idx} className="course-payment-section">
                      <h3 className="course-title">
                        {enrollment.course_name} 
                        {enrollment.course_name_eng && (
                          <span className="course-title-eng"> | {enrollment.course_name_eng}</span>
                        )}
                      </h3>
                      
                      <div className="table-responsive">
                        <table className="payment-table">
                          <thead>
                            <tr>
                              <th>ลำดับ</th>
                              <th>เดือน/ปี</th>
                              <th>จำนวนชั่วโมงที่เรียน</th>
                              <th>ราคาต่อชั่วโมง (บาท)</th>
                              <th>ยอดชำระ (บาท)</th>
                              <th>วันที่ออกใบแจ้ง</th>
                              <th>วันที่ชำระ</th>
                              <th>สถานะ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enrollment.payments && enrollment.payments.length > 0 ? (
                              enrollment.payments.map((payment, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td className="month-cell">{payment.month}</td>
                                  <td className="number-cell">{payment.hours?.toFixed(1)}</td>
                                  <td className="number-cell">{payment.pricePerHour?.toLocaleString()}</td>
                                  <td className="number-cell highlight">
                                    {payment.totalAmount?.toLocaleString(undefined, { 
                                      minimumFractionDigits: 2, 
                                      maximumFractionDigits: 2 
                                    })}
                                  </td>
                                  <td className="date-cell">{formatDate(payment.billDate)}</td>
                                  <td className="date-cell">{formatDate(payment.paidDate)}</td>
                                  <td>{getStatusBadge(payment.status)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="8" className="text-center">ไม่มีข้อมูลการชำระเงินสำหรับคอร์สนี้</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="select-student-prompt">
              <div className="prompt-icon">👤</div>
              <h3>กรุณาเลือกนักเรียน</h3>
              <p>เลือกนักเรียนเพื่อดูประวัติการชำระเงิน</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}