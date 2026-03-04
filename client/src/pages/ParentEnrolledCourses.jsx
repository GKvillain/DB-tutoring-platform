import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/ParentSidebar";
import "./ParentEnrolledCourses.css";


export function ParentEnrolledCourses() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // ดึงข้อมูลนักเรียนทั้งหมดของผู้ปกครอง
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setError(null);
        const parent_id = localStorage.getItem("parent_id");
        
        if (!parent_id) {
          setError("ไม่พบข้อมูลผู้ปกครอง กรุณาเข้าสู่ระบบอีกครั้ง");
          return;
        }

        const res = await fetch(`http://localhost:3000/api/parent/students?parent_id=${parent_id}`);
        
        if (!res.ok) {
          const text = await res.text();
          console.error("API Response:", text.substring(0, 200));
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudentId(data[0].student_id);
        }
      } catch (err) {
        console.error("Fetch students error:", err);
        setError("ไม่สามารถโหลดรายชื่อนักเรียนได้");
      }
    };

    fetchStudents();
  }, []);

  // ดึงข้อมูลการลงทะเบียนทั้งหมดเมื่อเลือกนักเรียน
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!selectedStudentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`http://localhost:3000/api/parent/enrollments?student_id=${selectedStudentId}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        setEnrolledCourses(data);
        setAllEnrollments(data);
      } catch (err) {
        console.error("Fetch enrollments error:", err);
        setError("ไม่สามารถโหลดข้อมูลคอร์สที่ลงทะเบียนได้");
      } finally {
        setLoading(false);
      }
    };

    if (selectedStudentId) {
      fetchEnrollments();
    }
  }, [selectedStudentId]);

  // กรองคอร์สตามคำค้นหา
  const filteredCourses = useMemo(() => {
    const keyword = search.toLowerCase();

    return enrolledCourses.filter((course) =>
      [
        course.course_name_thai,
        course.course_name_eng,
        course.course_subject,
        course.grade_level?.grade_level_name,
        course.tutor_name
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [search, enrolledCourses]);

  // หาชื่อนักเรียนที่เลือก
  const selectedStudent = students.find(s => s.student_id === selectedStudentId);

  if (error) {
    return (
      <>
        <Navigation />
        <div className="courses-page">
          <div className="error-message" style={{ padding: '20px', color: 'red' }}>
            เกิดข้อผิดพลาด: {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="courses-page">
        {/* หัวข้อหลักอยู่ด้านบนสุด */}
        <h1 className="page-title" style={{ fontSize: '24px', marginBottom: '20px' }}>
          คอร์สที่ลงทะเบียนแล้ว
        </h1>

        <div className="header" style={{ marginBottom: '20px' }}>
          <div className="filter-section" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Dropdown เลือกนักเรียน */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="student-select"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
              disabled={students.length === 0}
            >
              {students.length === 0 ? (
                <option value="">ไม่มีข้อมูลนักเรียน</option>
              ) : (
                students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.student_fullname} ({student.student_nickname || '-'})
                  </option>
                ))
              )}
            </select>

            {/* ช่องค้นหา */}
            <div className="search-box">
              <input
                type="text"
                placeholder="ค้นหาคอร์สที่ลงทะเบียน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!selectedStudentId}
              />
            </div>
          </div>
        </div>

        {/* แสดงจำนวนคอร์ส */}
        {selectedStudent && (
          <div className="enrollment-summary" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ margin: 0 }}>
              นักเรียน: <strong>{selectedStudent.student_fullname}</strong> 
              {selectedStudent.student_nickname && ` (${selectedStudent.student_nickname})`}
              {' '} | ลงทะเบียนแล้ว: <strong>{allEnrollments.length}</strong> คอร์ส
              {search && filteredCourses.length !== allEnrollments.length && (
                <span> | แสดง {filteredCourses.length} คอร์ส</span>
              )}
            </p>
          </div>
        )}

        {/* แสดงรายการคอร์ส */}
        {loading ? (
          <p>กำลังโหลดข้อมูล...</p>
        ) : (
          <div className="course-grid">
            {filteredCourses.length === 0 ? (
              <p>
                {search 
                  ? "ไม่พบคอร์สที่ค้นหา" 
                  : selectedStudent 
                    ? "ยังไม่มีคอร์สที่ลงทะเบียน" 
                    : "กรุณาเลือกนักเรียน"}
              </p>
            ) : (
              filteredCourses.map((course) => (
                <div
                  className="course-card clickable"
                  key={course.enrollment_id || course.course_id}
                  onClick={() => navigate(`/course/${course.course_id}`)}
                >
                  <img
                    src={course.course_image || "/default-course.jpg"}
                    alt={course.course_name_thai}
                  />
                  <div className="course-info">
                    <h4>{course.course_name_thai}</h4>
                    <p>
                      วิชา: {course.course_subject} <br />
                      ระดับชั้น: {course.grade_level?.grade_level_name} <br />
                      ครูผู้สอน: {course.tutor_name || "ไม่ระบุ"} <br />
                      ราคา: {course.price?.toLocaleString()} บาท
                    </p>
                    {course.enrollment_date && (
                      <small className="enrollment-date">
                        ลงทะเบียนเมื่อ: {new Date(course.enrollment_date).toLocaleDateString('th-TH')}
                      </small>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}