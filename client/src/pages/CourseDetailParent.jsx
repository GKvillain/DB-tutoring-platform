import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MessageCircle, Facebook, BookOpen, GraduationCap, DollarSign } from "lucide-react";
import Navigation from "../components/ParentSidebar";
import "./CourseDetailParent.css";

export function CourseDetailParent() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:3000/api/course/${courseId}/detail`
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setCourse(data.course);
        setTutor(data.tutor);
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
    }
  }, [courseId]);

  // ฟังก์ชันสำหรับ render icon ตามประเภท
  const getContactIcon = (type) => {
    switch(type) {
      case 'email':
        return <Mail size={16} />;
      case 'tel':
        return <Phone size={16} />;
      case 'line':
        return <MessageCircle size={16} />;
      case 'facebook':
        return <Facebook size={16} />;
      default:
        return null;
    }
  };

  if (loading) return <p>กำลังโหลด...</p>;
  if (error) return <p>เกิดข้อผิดพลาด: {error}</p>;
  if (!course) return <p>ไม่พบข้อมูลคอร์ส</p>;

  return (
    <>
      <Navigation />
      <div className="course-detail-page">
        <div className="course-detail-container">
          {/* ปุ่มกลับ */}
          <div className="back-button-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
              <span>กลับ</span>
            </button>
          </div>

          {/* หัวข้อหลัก */}
          <h1 className="course-title">{course.course_name_thai}</h1>

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
              <h2 className="section-title">รูปภาพตัวอย่าง</h2>
              <img
                src={course.course_image}
                alt={course.course_name_thai}
                className="course-image-large"
              />
            </div>
          )}

          {/* ข้อมูลติวเตอร์ */}
          {tutor && (
            <div className="info-section">
              <h2 className="section-title">ข้อมูลติวเตอร์</h2>

              <div className="tutor-info-card">
                <div className="tutor-header">
                  <div className="tutor-avatar">
                    {tutor.tutor_picture ? (
                      <img 
                        src={tutor.tutor_picture} 
                        alt={tutor.fullname}
                        className="tutor-avatar-image"
                      />
                    ) : (
                      <div className="tutor-avatar-placeholder">
                        {tutor.fullname?.charAt(0) || 'T'}
                      </div>
                    )}
                  </div>

                  <div className="tutor-basic-info">
                    <h3 className="tutor-name">{tutor.fullname || 'ไม่ระบุ'}</h3>
                    <p className="tutor-specialize">
                      ความเชี่ยวชาญ: {tutor.specialize?.join(', ') || 'ไม่ระบุ'}
                    </p>
                  </div>
                </div>

                {/* ข้อมูลติดต่อติวเตอร์ */}
                {tutor.contacts && tutor.contacts.length > 0 && (
                  <div className="tutor-contacts">
                    <h4 className="contacts-title">ช่องทางการติดต่อ</h4>
                    <div className="contacts-list">
                      {tutor.contacts.map((contact, index) => (
                        <div key={index} className="contact-item">
                          <span className="contact-icon">
                            {getContactIcon(contact.type)}
                          </span>
                          <span className="contact-value">{contact.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="view-tutor-profile-btn"
                  onClick={() => navigate(`/tutor/${tutor.tutor_id}`)}
                >
                  ดูโปรไฟล์ติวเตอร์
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}