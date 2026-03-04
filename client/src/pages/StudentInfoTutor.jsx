import "./StudentInfoTutor.css";
import "../App.css";
import Navigation from "../components/ParentSidebar";
import { useState, useEffect } from "react";

export function StudentInfo() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/studentsInfo");
      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        return;
      }

      setStudents(data);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };


  const filteredStudents = students.filter((std) => {
    const keyword = search.toLowerCase();

    return (
      (std.student_fullname || "").toLowerCase().includes(keyword) ||
      (std.student_nickname || "").toLowerCase().includes(keyword) ||
      (std.school || "").toLowerCase().includes(keyword) ||
      (std.grade_level || "").toLowerCase().includes(keyword) ||
      (std.parent_fullname || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <>
      <Navigation />

      <div className="page-with-sidebar">
        <article className="student-container">
          <h1 className="student-title">ข้อมูลของนักเรียน</h1>

          {/* ===== Summary Section ===== */}
          <div className="summary-section">
          
            <div className="summary-card">
              <p>จำนวนนักเรียนทั้งหมด</p>
              <h2>{students.length}</h2>
            </div>

            <div className="summary-card">
              <p>จำนวนคอร์สทั้งหมด</p>
              <h2>30</h2>
            </div>
          </div>

          {/* ===== Search ===== */}
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="ค้นหา: ชื่อ / ชื่อเล่น / โรงเรียน / ชั้น / ผู้ปกครอง"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ===== Student List ===== */}
          {loading ? (
            <p className="loading-text">กำลังโหลดข้อมูล...</p>
          ) : (
            <div className="student-list">
              {filteredStudents.map((student) => (
                <div className="student-card" key={student.student_id}>

                  <div className="student-image">
                    {student.student_picture ? (
                      <img
                        src={student.student_picture}
                        alt={student.student_fullname || "student"}
                      />
                    ) : (
                      <div className="no-image">
                        {student.student_nickname?.charAt(0) || 
                         student.student_fullname?.charAt(0) || 
                         '👤'}
                      </div>
                    )}
                  </div>

                  <div className="student-details">
                    <p>
                      <strong>ชื่อ :</strong>{" "}
                      {student.student_fullname || "-"}
                    </p>

                    <p>
                      <strong>โรงเรียน :</strong>{" "}
                      {student.school || "-"}
                    </p>

                    <p>
                      <strong>ชั้น :</strong>{" "}
                      {student.grade_level || "-"}
                    </p>

                    <p>
                      <strong>ชื่อเล่น :</strong>{" "}
                      {student.student_nickname || "-"}
                    </p>
                    <br />
                    <p>
                      <strong>ชื่อผู้ปกครอง :</strong>{" "}
                      {student.parent_fullname || "ไม่มีข้อมูล"}
                    </p>

                    <p>
                      <strong>อีเมล :</strong>{" "}
                      {student.parent_email || "-"}
                    </p>
                    
                    <p className="parent-contact">
                      <span>
                        <strong>เบอร์โทรศัพท์ :</strong> {student.parent_phone || "-"}
                      </span>

                      <span>
                        <strong>ไอดีไลน์ :</strong> {student.parent_line_id || "-"}
                      </span>

                      <span>
                        <strong>ชื่อเฟสบุ๊ก :</strong> {student.parent_fb_name || "-"}
                      </span>
                    </p>

                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
}