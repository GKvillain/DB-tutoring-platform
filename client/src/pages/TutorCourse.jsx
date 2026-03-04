import { useState, useEffect } from "react";
import "./TutorCourse.css";
import Navigation from "../components/Navigation";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function TutorCourse() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const accountId = localStorage.getItem("account_id");
  const navigate = useNavigate();

  // fetch courses using RPC
  useEffect(() => {
    if (!accountId) {
      setError("กรุณาเข้าสู่ระบบก่อน");
      setLoading(false);
      return;
    }

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:3000/api/tutor/courses?account_id=${accountId}`
        );
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "เกิดข้อผิดพลาด");
        }
        
        const data = await res.json();
        setCourses(data);
        setError(null);
      } catch (err) {
        console.error("Fetch courses error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [accountId]);

  const filteredCourses = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    
    if (!keyword) return courses;

    return courses.filter((course) =>
      [
        course.course_name_thai,
        course.course_name_eng,
        course.course_subject,
        course.grade_level?.grade_level_name
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [search, courses]);

  // ฟังก์ชันสำหรับไปหน้ารายละเอียด พร้อมตรวจสอบ courseId
  const handleCourseClick = (courseId) => {
    if (courseId) {
      navigate(`/course/${courseId}`);
    } else {
      console.error("Course ID is undefined");
      alert("ไม่พบข้อมูลคอร์ส");
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="courses-page">
          <div className="loading-container">
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="courses-page">
          <div className="error-container">
            <p>เกิดข้อผิดพลาด: {error}</p>
            <button onClick={() => window.location.reload()}>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="courses-page">
        <div className="header">
          <h5 className="topic">รายการคอร์สทั้งหมด</h5>

          <div className="search-box">
            <input
              type="text"
              placeholder="ค้นหาคอร์ส..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="course-grid">
          {filteredCourses.length === 0 ? (
            <p className="no-courses">
              {search ? "ไม่พบคอร์สที่ค้นหา" : "ยังไม่มีคอร์ส"}
            </p>
          ) : (
            filteredCourses.map((course) => (
              <div
                className="course-card clickable"
                key={course.course_id || `course-${Math.random()}`} // เพิ่ม fallback key
                onClick={() => handleCourseClick(course.course_id)}
              >
                <img
                  src={course.course_image || "/default-course-image.png"}
                  alt={course.course_name_thai}
                  onError={(e) => {
                    e.target.src = "/default-course-image.png";
                  }}
                />
                <div className="course-info">
                  <h4>{course.course_name_thai}</h4>
                  <p>
                    วิชา: {course.course_subject} <br />
                    ระดับชั้น: {course.grade_level?.grade_level_name || "-"}
                  </p>
                  <p className="course-price">
                    ราคา: {course.price?.toLocaleString()} บาท/ชั่วโมง
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}