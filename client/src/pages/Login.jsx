import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    // ล้าง error เมื่อผู้ใช้พิมพ์
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    if (!form.email || !form.password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/begin/Login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }

      // ✅ เก็บข้อมูลทั้งหมดที่ได้จาก backend
      console.log("Login response:", data); // สำหรับ debug

      // ข้อมูลพื้นฐาน
      localStorage.setItem("account_id", data.account_id);
      localStorage.setItem("role", data.role);

      // ข้อมูลผู้ปกครอง/ครู/นักเรียน (ถ้ามี)
      if (data.parent_id) {
        localStorage.setItem("parent_id", data.parent_id);
      }
      if (data.tutor_id) {
        localStorage.setItem("tutor_id", data.tutor_id);
      }
      if (data.student_id) {
        localStorage.setItem("student_id", data.student_id);
      }

      // ข้อมูลชื่อ-นามสกุล
      if (data.fname) {
        localStorage.setItem("user_fname", data.fname);
      }
      if (data.lname) {
        localStorage.setItem("user_lname", data.lname);
      }
      if (data.fullname) {
        localStorage.setItem("user_fullname", data.fullname);
      } else {
        // ถ้าไม่มี fullname ให้สร้างจาก fname + lname
        const fullname = `${data.fname || ""} ${data.lname || ""}`.trim();
        if (fullname) {
          localStorage.setItem("user_fullname", fullname);
        }
      }

      // ข้อมูลติดต่อ
      if (data.email) {
        localStorage.setItem("user_email", data.email);
      }
      if (data.tel) {
        localStorage.setItem("user_tel", data.tel);
      }
      if (data.line_id) {
        localStorage.setItem("user_line_id", data.line_id);
      }
      if (data.fb_name) {
        localStorage.setItem("user_fb_name", data.fb_name);
      }

      // ✅ แสดงข้อความต้อนรับ
      alert(`ยินดีต้อนรับ คุณ ${data.fname || "ผู้ใช้"}`);

      // ✅ นำทางตาม role
      if (data.role === "P") {
        navigate("/parent/EditInfoParent");
      } else if (data.role === "T") {
        navigate("/TutorHome");
      } else if (data.role === "S") {
        navigate("/StudentHome");
      } else {
        setError("บทบาทผู้ใช้ไม่ถูกต้อง");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
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
              <div className="choose-left">
                <h3>
                  <Link id="active" to="/Login">
                    เข้าสู่ระบบ
                  </Link>
                </h3>
              </div>

              <div className="choose-right">
                <h3>
                  <Link id="unactive" to="/Register">
                    สมัครสมาชิก
                  </Link>
                </h3>
              </div>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <div className="form">
              <label>อีเมล</label>
              <input
                type="email"
                name="email"
                placeholder="อีเมล"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
              />

              <div className="password-box">
                <label>รหัสผ่าน</label>
                <input
                  type="password"
                  name="password"
                  placeholder="รหัสผ่าน"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <a
                href="#"
                className="forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("กรุณาติดต่อผู้ดูแลระบบ");
                }}
              >
                ลืมรหัสผ่าน
              </a>
            </div>

            <form onSubmit={handleLogin}>
              <div className="lower">
                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner"
                        style={{
                          display: "inline-block",
                          width: "16px",
                          height: "16px",
                          border: "2px solid #fff",
                          borderTopColor: "transparent",
                          borderRadius: "100%",
                          animation: "spin 1s linear infinite",
                          marginRight: "8px",
                        }}
                      ></span>
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </button>
                <p className="register-text">
                  ยังไม่มีบัญชีใช่ไหม? <Link to="/Register">สร้างได้เลย</Link>
                </p>
              </div>
            </form>

           
          </div>
        </div>
      </div>

      {/* เพิ่ม animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

export default Login;
