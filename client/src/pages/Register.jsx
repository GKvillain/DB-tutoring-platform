import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

export function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
    line: "",
    facebook: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    if (!formData.role) {
      alert("กรุณาเลือกประเภทผู้ใช้งาน");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/begin/Register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fname: formData.fname,
          lname: formData.lname,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          line: formData.line,
          facebook: formData.facebook,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("สมัครสมาชิกสำเร็จ 🎉");
      navigate("/Login");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <main className="container-fluid">
      <div className="all">
        <div className="left"></div>

        <div className="right d-flex">
          <div className="form-section d-block">
            <img
              id="logo-login"
              src="https://daozsddneakegwxtwfhb.supabase.co/storage/v1/object/public/images/server_images/login_image.png"
              alt="Logo"
            />

            <div className="choose">
              <h3>
                <Link id="unactive" to="/Login">
                  เข้าสู่ระบบ
                </Link>
              </h3>
              <h3>
                <Link id="active" to="/Register">
                  สมัครสมาชิก
                </Link>
              </h3>
            </div>

            <div className="form">
              {/* Role */}
              <div className="choice-pic">
                <img
                  className={`choose-role ${
                    formData.role === "P" ? "active-role" : ""
                  }`}
                  src="https://daozsddneakegwxtwfhb.supabase.co/storage/v1/object/public/images/server_images/choose-parents.svg"
                  alt="parent"
                  onClick={() => setFormData({ ...formData, role: "P" })}
                />
                <img
                  className={`choose-role ${
                    formData.role === "T" ? "active-role" : ""
                  }`}
                  src="https://daozsddneakegwxtwfhb.supabase.co/storage/v1/object/public/images/server_images/choose-tutor.svg"
                  alt="tutor"
                  onClick={() => setFormData({ ...formData, role: "T" })}
                />
              </div>

              {/* Name */}
              <div className="form-name">
                <div>
                  <label>ชื่อ *</label>
                  <input
                    type="text"
                    name="fname"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label>นามสกุล *</label>
                  <input
                    type="text"
                    name="lname"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="password-box">
                <label>รหัสผ่าน *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  onChange={handleChange}
                  required
                />
                <i
                  className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                ></i>
              </div>

              {/* Confirm */}
              <div className="password-box">
                <label>ยืนยันรหัสผ่าน *</label>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  onChange={handleChange}
                  required
                />
                <i
                  className={`bi ${showConfirm ? "bi-eye" : "bi-eye-slash"}`}
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ cursor: "pointer" }}
                ></i>
              </div>

              {/* Email */}
              <div className="email-box">
                <label>อีเมล *</label>
                <input
                  type="email"
                  name="email"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Contact */}
              <p className="contact-text">ช่องทางติดต่อ</p>

              <div className="contact-box">
                <div className="contact-left">
                  <label>เบอร์โทร</label>
                  <label>Line ID</label>
                  <label>Facebook</label>
                </div>
                <div className="contact-right">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="กรอกเบอร์โทร"
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="line"
                    placeholder="กรอก Line ID"
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="facebook"
                    placeholder="กรอก Facebook"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="lower">
              <button className="regist-btn" onClick={handleRegister}>
                สมัครสมาชิก
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Register;
