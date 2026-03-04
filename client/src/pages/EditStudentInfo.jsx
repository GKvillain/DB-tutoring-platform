import "./EditStudentInfo.css";
import "../App.css";
import "./GeneralImage.css";
import Navigation from "../components/ParentSidebar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function EditStudentInfo() {
  const navigate = useNavigate();

  const accountId = localStorage.getItem("account_id");
  const parentId = localStorage.getItem("parent_id");
  const role = localStorage.getItem("role");

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  
  // State สำหรับรูปภาพ
  const [studentImage, setStudentImage] = useState(null);
  const [studentImagePreview, setStudentImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    school: "",
    birthdate: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // ตรวจสอบสิทธิ์
  useEffect(() => {
    if (!accountId || !parentId) {
      navigate("/");
      return;
    }

    if (role !== "P") {
      alert("ไม่มีสิทธิ์เข้าหน้านี้");
      navigate("/");
      return;
    }
  }, [accountId, parentId, role, navigate]);

  // ดึงรายชื่อนักเรียนทั้งหมด
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/parent/students?parent_id=${parentId}`
        );

        if (!res.ok) {
          throw new Error("Fetch students failed");
        }

        const data = await res.json();
        setStudents(data);

        if (data.length > 0) {
          setSelectedStudentId(data[0].student_id);
        }
      } catch (err) {
        console.error(err);
        alert("โหลดรายชื่อนักเรียนไม่สำเร็จ");
      }
    };

    if (parentId) {
      fetchStudents();
    }
  }, [parentId]);

  // ดึงข้อมูลนักเรียนเมื่อเลือก student
  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setFetchError("");
        setStudentImage(null);
        setStudentImagePreview(null);
        
        // แก้ไขตรงนี้: เพิ่ม URL
        const res = await fetch(
          `http://localhost:3000/api/student/${selectedStudentId}/info`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Fetch failed");
        }

        setForm({
          firstName: data.student_fname || "",
          lastName: data.student_lname || "",
          nickname: data.student_nickname || "",
          school: data.school || "",
          birthdate: data.birthdate || ""
        });

        // ตั้งค่ารูปภาพเดิม
        if (data.student_picture) {
          setCurrentImageUrl(data.student_picture);
          setStudentImagePreview(data.student_picture);
        }

      } catch (err) {
        console.error(err);
        setFetchError(err.message);
        alert("โหลดข้อมูลนักเรียนไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [selectedStudentId]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // จัดการเลือกรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("รูปภาพต้องมีขนาดไม่เกิน 5MB");
      return;
    }

    setStudentImage(file);
    setStudentImagePreview(URL.createObjectURL(file));
    setCurrentImageUrl(null);
  };

  // อัปโหลดรูปภาพ
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('student_id', selectedStudentId);

    const res = await fetch("http://localhost:3000/api/student/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "อัปโหลดรูปภาพไม่สำเร็จ");
    
    return data.imageUrl;
  };

  // ลบรูปที่เลือก
  const handleRemoveImage = () => {
    setStudentImage(null);
    setStudentImagePreview(currentImageUrl);
    if (studentImagePreview && !currentImageUrl) {
      URL.revokeObjectURL(studentImagePreview);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName) {
      alert("กรุณากรอกชื่อและนามสกุล");
      return;
    }

    try {
      setSaving(true);
      
      let imageUrl = currentImageUrl;

      // อัปโหลดรูปภาพถ้ามีการเลือกรูปใหม่
      if (studentImage) {
        try {
          setUploading(true);
          imageUrl = await uploadImage(studentImage);
          setUploading(false);
        } catch (error) {
          setUploading(false);
          throw new Error("อัปโหลดรูปภาพไม่สำเร็จ: " + error.message);
        }
      }

      // ส่งข้อมูลนักเรียนพร้อมรูปภาพ
      const requestData = {
        student_id: selectedStudentId,
        student_fname: form.firstName,
        student_lname: form.lastName,
        student_nickname: form.nickname || null,
        school: form.school || null,
        birthdate: form.birthdate || null,
        student_picture: imageUrl || null
      };

      const res = await fetch(
        "http://localhost:3000/api/student/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }

      alert("บันทึกข้อมูลนักเรียนสำเร็จ");
      
      // รีเฟรชข้อมูล
      if (selectedStudentId) {
        const refreshRes = await fetch(
          `http://localhost:3000/api/student/${selectedStudentId}/info`
        );
        const refreshData = await refreshRes.json();
        setForm({
          firstName: refreshData.student_fname || "",
          lastName: refreshData.student_lname || "",
          nickname: refreshData.student_nickname || "",
          school: refreshData.school || "",
          birthdate: refreshData.birthdate || ""
        });
        
        // อัปเดตรูปภาพ
        if (refreshData.student_picture) {
          setCurrentImageUrl(refreshData.student_picture);
          setStudentImagePreview(refreshData.student_picture);
        }
        setStudentImage(null);
      }

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "ไม่ระบุ";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const selectedStudent = students.find(s => s.student_id === selectedStudentId);

  if (loading && selectedStudentId) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="page-with-sidebar">
        <article className="container">
          <form className="form-wrapper" onSubmit={handleSubmit}>
            <h1 className="topic">แก้ไขข้อมูลนักเรียน</h1>

            <div className="form-group full-width">
              <label>เลือกนักเรียน</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="student-select"
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
            </div>

            {fetchError && (
              <div className="error-message">
                เกิดข้อผิดพลาด: {fetchError}
              </div>
            )}

            {selectedStudent && (
              <>
                {/* ส่วนรูปภาพ */}
                <div className="image-section">
                  <div className="image-preview-container">
                    {studentImagePreview ? (
                      <>
                        <img 
                          src={studentImagePreview} 
                          alt="Student preview" 
                          className="student-image-preview"
                        />
                        {studentImage && (
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={handleRemoveImage}
                          >
                            ✕
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="no-image-placeholder">
                        <span>ไม่มีรูปภาพ</span>
                      </div>
                    )}
                  </div>

                  <div className="image-upload-section">
                    <label htmlFor="student-image" className="image-upload-btn">
                      <input
                        id="student-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      📷 {studentImagePreview ? 'เปลี่ยนรูปภาพ' : 'เพิ่มรูปภาพ'}
                    </label>
                    {studentImage && (
                      <span className="file-name">
                        {studentImage.name}
                      </span>
                    )}
                    <small className="image-hint">
                      รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>ชื่อ <span className="required">*</span></label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="ชื่อ"
                      required
                    />
                    {!form.firstName && <small className="no-data">กรุณากรอกชื่อ</small>}
                  </div>

                  <div className="form-group">
                    <label>นามสกุล <span className="required">*</span></label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="นามสกุล"
                      required
                    />
                    {!form.lastName && <small className="no-data">กรุณากรอกนามสกุล</small>}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>ชื่อเล่น</label>
                  <input
                    name="nickname"
                    value={form.nickname}
                    onChange={handleChange}
                    placeholder="ชื่อเล่น"
                  />
                  {!form.nickname && <small className="no-data">ไม่มีข้อมูลชื่อเล่น</small>}
                </div>

                <div className="form-group full-width">
                  <label>วันเกิด</label>
                  <input
                    type="date"
                    name="birthdate"
                    value={form.birthdate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {form.birthdate ? (
                    <small className="date-display">
                      วันที่เลือก: {formatDateForDisplay(form.birthdate)}
                    </small>
                  ) : (
                    <small className="no-data">ไม่มีข้อมูลวันเกิด</small>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>โรงเรียน</label>
                  <input
                    name="school"
                    value={form.school}
                    onChange={handleChange}
                    placeholder="โรงเรียน"
                  />
                  {!form.school && <small className="no-data">ไม่มีข้อมูลโรงเรียน</small>}
                </div>

                <div className="button-group">
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={saving || uploading}
                  >
                    {uploading ? "กำลังอัปโหลดรูป..." : saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => navigate("/parent/home")}
                    disabled={saving || uploading}
                  >
                    ยกเลิก
                  </button>
                </div>
              </>
            )}
          </form>
        </article>
      </div>
    </>
  );
}