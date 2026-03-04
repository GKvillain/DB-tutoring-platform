import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MessageCircle, Facebook, BookOpen, GraduationCap, DollarSign } from "lucide-react";
import Navigation from "../components/ParentSidebar";
import "./TutorProfileParent.css";

export function TutorProfileParent() {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutorProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:3000/api/tutor/${tutorId}/profile`
        );
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setTutor(data.tutor);
        setCourses(data.courses || []);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (tutorId) {
      fetchTutorProfile();
    }
  }, [tutorId]);

  // ฟังก์ชันสำหรับ render icon ตามประเภท
  const getContactIcon = (type) => {
    switch(type) {
      case 'email':
        return <Mail size={20} />;
      case 'tel':
        return <Phone size={20} />;
      case 'line':
        return <MessageCircle size={20} />;
      case 'facebook':
        return <Facebook size={20} />;
      default:
        return null;
    }
  };

  if (loading) return <p>กำลังโหลด...</p>;
  if (error) return <p>เกิดข้อผิดพลาด: {error}</p>;
  if (!tutor) return <p>ไม่พบข้อมูลติวเตอร์</p>;

  return (
    <>
      <Navigation />
      <div className="tutor-profile-page">
        <div className="tutor-profile-container">
          {/* Header พร้อมปุ่มกลับ */}
          <div className="profile-header">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
              <span>กลับ</span>
            </button>
          </div>

          {/* ข้อมูลติวเตอร์ */}
          <div className="tutor-header-section">
            <div className="tutor-avatar-large">
              {tutor.tutor_picture ? (
                <img 
                  src={tutor.tutor_picture} 
                  alt={tutor.fullname}
                  className="tutor-image"
                />
              ) : (
                tutor.fullname?.charAt(0) || 'T'
              )}
            </div>
            
            <div className="tutor-header-info">
              <h1 className="tutor-name-large">{tutor.fullname || 'ไม่ระบุ'}</h1>
              <div className="tutor-badges">
                <span className="tutor-badge">
                  {tutor.specialize?.join(', ') || 'ไม่ระบุความเชี่ยวชาญ'}
                </span>
              </div>
            </div>
          </div>

          {/* รายละเอียดติวเตอร์ */}
          <div className="info-section">
            <h2 className="section-title">เกี่ยวกับติวเตอร์</h2>
            <div className="info-card">
              <div className="info-row">
                <span className="info-label">ชื่อ-นามสกุล:</span>
                <span className="info-value">{tutor.fullname || 'ไม่ระบุ'}</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">ความเชี่ยวชาญ:</span>
                <span className="info-value">
                  {tutor.specialize?.map((spec, index) => (
                    <span key={index} className="specialize-tag">
                      {spec}
                    </span>
                  )) || 'ไม่ระบุ'}
                </span>
              </div>
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          {tutor.contacts && tutor.contacts.length > 0 && (
            <div className="info-section">
              <h2 className="section-title">ช่องทางการติดต่อ</h2>
              <div className="contacts-grid">
                {tutor.contacts.map((contact, index) => (
                  <div key={index} className="contact-card">
                    <div className="contact-icon">
                      {getContactIcon(contact.type)}
                    </div>
                    <div className="contact-info">
                      <span className="contact-label">
                        {contact.type === 'email' && 'อีเมล'}
                        {contact.type === 'tel' && 'เบอร์โทรศัพท์'}
                        {contact.type === 'line' && 'LINE ID'}
                        {contact.type === 'facebook' && 'Facebook'}
                      </span>
                      <span className="contact-value">{contact.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* คอร์สที่ติวเตอร์สอน */}
          <div className="info-section">
            <h2 className="section-title">คอร์สที่เปิดสอน</h2>
            
            {courses.length === 0 ? (
              <p className="empty-text">ยังไม่มีคอร์สที่เปิดสอน</p>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => (
                  <div
                    key={course.course_id}
                    className="course-card"
                    onClick={() => navigate(`/course/${course.course_id}`)}
                  >
                    <div className="course-image-container">
                      {course.course_image ? (
                        <img
                          src={course.course_image}
                          alt={course.course_name_thai}
                          className="course-image"
                        />
                      ) : (
                        <div className="course-image-placeholder">
                          <BookOpen size={32} />
                        </div>
                      )}
                    </div>
                    
                    <div className="course-info">
                      <h3 className="course-name">{course.course_name_thai}</h3>
                      <div className="course-detail">
                        <div className="course-detail-item">
                          <GraduationCap size={14} />
                          <span>{course.course_subject || 'ไม่ระบุวิชา'}</span>
                        </div>
                        <div className="course-detail-item">
                          <BookOpen size={14} />
                          <span>{course.grade_level?.grade_level_name || 'ไม่ระบุระดับ'}</span>
                        </div>
                        <div className="course-detail-item price">
                          <DollarSign size={14} />
                          <span>{course.price?.toLocaleString()} บาท</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}