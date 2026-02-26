import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginDummy.css"; // Create this CSS file

export function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

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
        setLoading(false);
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
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>ยินดีต้อนรับ</h2>
          <p>กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>อีเมล</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>รหัสผ่าน</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="··········"
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            ยังไม่มีบัญชีผู้ใช้? <a href="/register">สมัครสมาชิก</a>
          </p>
        </div>
      </div>
    </div>
  );
}
