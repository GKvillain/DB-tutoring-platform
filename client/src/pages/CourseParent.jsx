import { useState, useEffect } from "react";
import "./CourseParent.css";
import "./GeneralImage.css";
import Navigation from "../components/ParentSidebar";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
export function ParentCourses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  
  const navigate = useNavigate();
  // fetch Course from supabase
  useEffect(() => {

    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/allCourses?role=P");
        const data = await res.json();

        setCourses(data);
      } catch (err) {
        console.error("Fetch courses error:", err);
      }
    };

    fetchCourses();
  }, []);


  const filteredCourses = useMemo(() => {
    const keyword = search.toLowerCase();

    return courses.filter((course) =>
      [
        course.course_name_thai,
        course.course_name_eng,
        course.course_subject,
        course.grade_level?.grade_level_name
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [search, courses]);


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
            <p>ไม่พบคอร์ส</p>
          ) : (
            filteredCourses.map((course) => (
              <div
                className="course-card clickable"
                key={course.course_id}
                onClick={() => navigate(`/course/${course.course_id}`)}>
                <img
                  src={
                    course.course_image 
                  }
                  alt={course.course_name_thai}
                />
                <div className="course-info">
                  <h4>{course.course_name_thai}</h4>
                  <p>
                    วิชา : {course.course_subject} <br></br>
                    ระดับชั้น : {course.grade_level?.grade_level_name}
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