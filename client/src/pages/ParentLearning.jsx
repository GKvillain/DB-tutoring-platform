import { useEffect, useState } from "react";
import "./Parentlearning.css";
import ParentSidebar from "../components/ParentSidebar";

export function ParentLearning() {
  const accountId = localStorage.getItem("account_id");
  const parentId = localStorage.getItem("parent_id");

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewType, setViewType] = useState("learning");
  const [records, setRecords] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalHours: 0,
    totalTopics: 0,
    totalHomework: 0,
    lastUpdate: ""
  });

  

  // ดึงรายชื่อนักเรียน
  useEffect(() => {
    const fetchStudents = async () => {
      if (!parentId) return;
      try {
        const res = await fetch(`http://localhost:3000/api/parent/students?parent_id=${parentId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0 && !selectedStudentId) {
            setSelectedStudentId(data[0].student_id);
          }
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();
  }, [parentId]);

  // เมื่อเลือกนักเรียน
  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => s.student_id === selectedStudentId);
      setSelectedStudent(student);
      if (viewType === "learning") {
        fetchLearningRecords();
      } else {
        fetchExamResults();
      }
    }
  }, [selectedStudentId, viewType]);

  // ดึงข้อมูลผลการเรียน
  const fetchLearningRecords = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/parent/classsessions?parent_id=${parentId}&student_id=${selectedStudentId}`);
      const data = await res.json();
      
      const formattedRecords = [];
      let totalHours = 0;
      let totalTopics = 0;
      let totalHomework = 0;

      if (Array.isArray(data)) {
        data.forEach(session => {
          if (session.records && session.records.length > 0) {
            session.records.forEach(record => {
              formattedRecords.push({
                session_id: session.session_id,
                session_date: session.session_date,
                attendance_status: session.attendance_status,
                lesson_topic: record.lesson_topic || "-",
                homework_detail: record.homework_detail || "-",
                homework_status: record.homework_status || "-",
                tutor_comment: record.tutor_comment || "-"
              });
              
              if (record.lesson_topic) totalTopics++;
              if (record.homework_detail) totalHomework++;
            });
          }
          totalHours += 1.5;
        });
      }

      // เรียงตามวันที่ล่าสุด
      formattedRecords.sort((a, b) => 
        new Date(b.session_date) - new Date(a.session_date)
      );

      setRecords(formattedRecords);
      setSummary({
        totalHours,
        totalTopics,
        totalHomework,
        lastUpdate: new Date().toLocaleDateString('th-TH')
      });
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลผลการสอบ
  const fetchExamResults = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setExamResults([]);
    
    try {
      console.log("Fetching exams for student:", selectedStudentId);
      
      // 1. ดึง enrollments ของนักเรียน
      const enrollRes = await fetch(`http://localhost:3000/api/student/enrollments?student_id=${selectedStudentId}`);
      const enrollments = await enrollRes.json();
      
      console.log("Enrollments found:", enrollments);
      
      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const enrollmentIds = enrollments.map(e => e.enrollment_id);
      const allExams = [];
      
      // 2. ดึงข้อมูลการสอบจากแต่ละ enrollment
      for (const enrollmentId of enrollmentIds) {
        console.log("Fetching exams for enrollment:", enrollmentId);
        
        const examRes = await fetch(`http://localhost:3000/api/examination?enrollment_id=${enrollmentId}`);
        const exams = await examRes.json();
        
        console.log("Exams found:", exams);
        
        if (exams && exams.length > 0) {
          // 3. ดึงรายละเอียดการสอบแต่ละครั้ง
          for (const exam of exams) {
            const detailRes = await fetch(`http://localhost:3000/api/examinationdetail?exam_id=${exam.exam_id}`);
            const details = await detailRes.json();
            
            console.log("Exam details:", details);
            
            if (details && details.length > 0) {
              details.forEach(detail => {
                allExams.push({
                  exam_id: exam.exam_id,
                  enrollment_id: enrollmentId,
                  exam_topic: detail.exam_topic || "-",
                  exam_date: detail.exam_date,
                  score: detail.score || 0,
                  course_name: enrollments.find(e => e.enrollment_id === enrollmentId)?.course_name_thai || "ไม่ระบุคอร์ส"
                });
              });
            }
          }
        }
      }
      
      console.log("All exams:", allExams);
      
      // เรียงตามวันที่ล่าสุด
      allExams.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
      
      setExamResults(allExams);
    } catch (err) {
      console.error("Error fetching exam results:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH');
    } catch {
      return dateString;
    }
  };

  const renderAttendanceBadge = (status) => {
    if (!status || status === '-') return '-';
    
    let badgeClass = 'attendance-badge unknown';
    let statusText = status;
    
    switch(status?.toLowerCase()) {
      case 'present':
        badgeClass = 'attendance-badge present';
        statusText = 'มาเรียน';
        break;
      case 'absent':
        badgeClass = 'attendance-badge absent';
        statusText = 'ขาดเรียน';
        break;
      case 'late':
        badgeClass = 'attendance-badge late';
        statusText = 'มาสาย';
        break;
      default:
        badgeClass = 'attendance-badge unknown';
        statusText = 'ไม่มีข้อมูล';
    }
    
    return <span className={badgeClass}>{statusText}</span>;
  };

  const calculateGrade = (score) => {
    if (score >= 80) return { grade: 'A', class: 'grade-a' };
    if (score >= 70) return { grade: 'B', class: 'grade-b' };
    if (score >= 60) return { grade: 'C', class: 'grade-c' };
    if (score >= 50) return { grade: 'D', class: 'grade-d' };
    return { grade: 'F', class: 'grade-f' };
  };

  return (
    <>
      <ParentSidebar />
      <div className="learnrecord-page">
        <div className="learnrecord-container">
          {/* Header */}
          <div className="learnrecord-header">
            <h1 className="page-title">บันทึกพัฒนาการการเรียนรู้</h1>
            
            <div className="header-controls">
              <div className="student-selector">
                <label>เลือกนักเรียน</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="student-select"
                >
                  <option value="">เลือกนักเรียน</option>
                  {students.map((std) => (
                    <option key={std.student_id} value={std.student_id}>
                      {std.student_fullname} ({std.student_nickname})
                    </option>
                  ))}
                </select>
              </div>

              <div className="view-selector">
                <button 
                  className={`view-btn ${viewType === 'learning' ? 'active' : ''}`}
                  onClick={() => setViewType('learning')}
                >
                  ผลการเรียน
                </button>
                <button 
                  className={`view-btn ${viewType === 'exam' ? 'active' : ''}`}
                  onClick={() => setViewType('exam')}
                >
                  ผลการสอบ
                </button>
              </div>
            </div>
          </div>

          {selectedStudent ? (
            <>
              {/* Student Info */}
              <div className="student-profile">
                <div className="student-avatar">
                  {selectedStudent?.student_nickname?.charAt(0) || 'น'}
                </div>
                <div className="student-info">
                  <h2>{selectedStudent?.student_fullname}</h2>
                  {viewType === 'learning' && (
                    <p className="text-muted">
                      สรุปพัฒนาการ ณ วันที่ {summary.lastUpdate}
                    </p>
                  )}
                </div>
              </div>

              {/* Summary Cards - เฉพาะผลการเรียน */}
              {viewType === 'learning' && (
                <div className="summary-cards">
                  <div className="summary-card">
                    <div className="summary-icon">⏰</div>
                    <div className="summary-content">
                      <span className="summary-label">การเข้าเรียน</span>
                      <span className="summary-value">{summary.totalHours} ชม.</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">📚</div>
                    <div className="summary-content">
                      <span className="summary-label">หัวข้อที่เรียน</span>
                      <span className="summary-value">{summary.totalTopics} ครั้ง</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">📝</div>
                    <div className="summary-content">
                      <span className="summary-label">การบ้าน</span>
                      <span className="summary-value">{summary.totalHomework} ครั้ง</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Table Section */}
              <div className="table-section">
                <h3 className="table-title">
                  {viewType === 'learning' ? 'ประวัติการเรียน' : 'ประวัติการสอบ'}
                </h3>

                {loading ? (
                  <div className="loading-state">กำลังโหลดข้อมูล...</div>
                ) : viewType === 'learning' ? (
                  <div className="table-responsive">
                    {records.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <p>ไม่มีประวัติการเรียน</p>
                      </div>
                    ) : (
                      <table className="learnrecord-table">
                        <thead>
                          <tr>
                            <th>วันที่</th>
                            <th>การเข้าเรียน</th>
                            <th>หัวข้อที่เรียน</th>
                            <th>การบ้าน</th>
                            <th>สรุปพัฒนาการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((record, index) => (
                            <tr key={index}>
                              <td className="date-cell">{formatDate(record.session_date)}</td>
                              <td>{renderAttendanceBadge(record.attendance_status)}</td>
                              <td>{record.lesson_topic}</td>
                              <td>
                                <div className="homework-cell">
                                  <span className={`homework-status ${record.homework_status?.toLowerCase()}`}>
                                    {record.homework_status === 'Done' ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}
                                  </span>
                                  {record.homework_detail && (
                                    <span className="homework-detail">{record.homework_detail}</span>
                                  )}
                                </div>
                              </td>
                              <td className="comment-cell">{record.tutor_comment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div className="table-responsive">
                    {examResults.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <p>ไม่มีประวัติการสอบ</p>
                      </div>
                    ) : (
                      <table className="learnrecord-table">
                        <thead>
                          <tr>
                            <th>วันที่สอบ</th>
                            <th>วิชา</th>
                            <th>หัวข้อที่สอบ</th>
                            <th>คะแนน</th>
                            <th>เกรด</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examResults.map((exam, index) => {
                            const { grade, class: gradeClass } = calculateGrade(exam.score);
                            return (
                              <tr key={index}>
                                <td className="date-cell">{formatDate(exam.exam_date)}</td>
                                <td>{exam.course_name}</td>
                                <td>{exam.exam_topic}</td>
                                <td>{exam.score} คะแนน</td>
                                <td>
                                  <span className={`grade-badge ${gradeClass}`}>
                                    {grade}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="select-student-prompt">
              <div className="prompt-icon">👤</div>
              <h3>กรุณาเลือกนักเรียน</h3>
              <p>เลือกนักเรียนเพื่อดูบันทึกพัฒนาการ</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}