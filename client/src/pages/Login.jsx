import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
// import logo from "../assets/logo.svg";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  ///////////////
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      // เก็บข้อมูลไว้ใช้
      localStorage.setItem("account_id", data.account_id);
      localStorage.setItem("role", data.role);

      // แยกหน้าไปตาม role
      if (data.role === "P") {
        navigate("/parent/EditInfoParent");
      } else if (data.role === "T") {
        navigate("/teaching/statistics");
      } else {
        alert("Role ไม่ถูกต้อง");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };
  /////////////////

  return (
    <main className="container-fluid">
      <div className="all">
        <div className="left"></div>

        <div className="right d-flex">
          <div className="form-section d-block">
            <img
              id="logo-login"
              src="https://daozsddneakegwxtwfhb.supabase.co/storage/v1/object/public/images/server_images/logo.svg"
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

            <div className="form">
              <label>อีเมล</label>
              <input
                type="text"
                name="email"
                placeholder="อีเมล"
                value={form.email}
                onChange={handleChange}
              />

              <div className="password-box">
                <label>รหัสผ่าน</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="รหัสผ่าน"
                  value={form.password}
                  onChange={handleChange}
                />
                <i
                  onClick={togglePassword}
                  className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}
                  style={{ cursor: "pointer" }}
                ></i>
              </div>

              <a href="#" className="forgot">
                ลืมรหัสผ่าน
              </a>
            </div>

            <form onSubmit={handleLogin}>
              <div className="lower">
                <button type="submit" className="login-btn">
                  <Link className="link-home" to="/TutorHome">
                    เข้าสู่ระบบ
                  </Link>
                </button>
                <p className="register-text">
                  ยังไม่มีบัญชีใช่ไหม?
                  <Link to="/Register">สร้างได้เลย</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
