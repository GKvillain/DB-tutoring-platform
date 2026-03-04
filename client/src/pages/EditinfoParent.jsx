import "./EditinfoParent.css";
import "../App.css";
import Navigation from "../components/ParentSidebar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function EditInfoParent() {
  const navigate = useNavigate();

  const accountId = localStorage.getItem("account_id");
  const role = localStorage.getItem("role");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    tel: "",
    lineId: "",
    fbName: ""
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) {
      navigate("/");
      return;
    }

    if (role !== "P") {
      alert("ไม่มีสิทธิ์เข้าหน้านี้");
      navigate("/");
      return;
    }
  }, [accountId, role, navigate]);

  useEffect(() => {
    if (!accountId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/EditInfoParent?account_id=${accountId}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error("Fetch failed");
        }

        setForm({
          firstName: data.account?.fname || "",
          lastName: data.account?.lname || "",
          email: data.account?.email || "",
          tel: data.account?.tel || "",
          lineId: data.account?.line_id || "",
          fbName: data.account?.fb_name || ""
        });

      } catch (err) {
        console.error(err);
        alert("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        "http://localhost:3000/api/EditInfoParent",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_id: accountId,
            fname: form.firstName,
            lname: form.lastName,
            tel: form.tel,
            line_id: form.lineId,
            fb_name: form.fbName
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Update failed");
      }

      alert("บันทึกสำเร็จ");

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <>
      <Navigation />
      <div className="page-with-sidebar">
        <article className="container">
          <form className="form-wrapper" onSubmit={handleSubmit}>
            <h1 className="topic">ข้อมูลผู้ปกครอง</h1>
            
            {/* แถวที่ 1: ชื่อ-นามสกุล */}
            <div className="form-row">
              <div className="form-group">
                <label>ชื่อ</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="ชื่อ"
                />
              </div>

              <div className="form-group">
                <label>นามสกุล</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="นามสกุล"
                />
              </div>
            </div>

            {/* แถวที่ 2: อีเมล (แก้ไขไม่ได้) */}
            <div className="form-group full-width">
              <label>อีเมล</label>
              <input
                name="email"
                value={form.email}
                disabled
              />
            </div>

            {/* แถวที่ 3: เบอร์โทรศัพท์ */}
            <div className="form-group full-width">
              <label>เบอร์โทรศัพท์</label>
              <input
                name="tel"
                value={form.tel}
                onChange={handleChange}
                placeholder="เบอร์โทรศัพท์"
              />
            </div>

            {/* แถวที่ 4: ไอดีไลน์ */}
            <div className="form-group full-width">
              <label>ไอดีไลน์</label>
              <input
                name="lineId"
                value={form.lineId}
                onChange={handleChange}
                placeholder="ไอดีไลน์"
              />
            </div>

            {/* แถวที่ 5: ชื่อเฟสบุ๊ก */}
            <div className="form-group full-width">
              <label>ชื่อเฟสบุ๊ก</label>
              <input
                name="fbName"
                value={form.fbName}
                onChange={handleChange}
                placeholder="ชื่อเฟสบุ๊ก"
              />
            </div>

            <button type="submit" className="btn-clear">
              บันทึกการเปลี่ยนแปลง
            </button>
          </form>
        </article>
      </div>
    </>
  );
}