import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Users,
  DollarSign,
  PenSquare,
  BarChart3,
  CalendarDays,
  UserPlus,
  GraduationCap,
  CreditCard,
  LineChart,
  User,
  Search,
  Edit,
  House
} from "lucide-react"; // เพิ่ม Edit icon
import "./ParentSidebar.css";

export default function ParentSidebar() {
  const [expanded, setExpanded] = useState(false);
  const [parentName, setParentName] = useState("ผู้ปกครอง");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentProfile();
  }, []);

  const fetchParentProfile = async () => {
    try {
      const account_id = localStorage.getItem("account_id");
      
      if (!account_id) {
        console.error("No account_id found in localStorage");
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:3000/api/parent/profile?account_id=${account_id}`);
      const data = await res.json();

      if (!res.ok) {
        console.error("API Error:", data.error);
        setLoading(false);
        return;
      }

      if (data.fullname) {
        setParentName(data.fullname);
      } else if (data.fname && data.lname) {
        setParentName(`${data.fname} ${data.lname}`.trim());
      } else {
        setParentName("ผู้ปกครอง");
      }
      
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`sidebar ${expanded ? "sidebar-expanded" : "sidebar-collapsed"}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo-container">
          <BookOpen size={22} className="logo-icon" />
          {expanded && <span className="brand-text">TutorSSS</span>}
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <div className="nav-section">
          <NavLink to="/parent/home" className="nav-link">
            <House size={18} className="nav-icon" />
            {expanded && <span className="nav-text">หน้าหลัก</span>}
          </NavLink>
        </div>
        <div className="nav-section">
          <NavLink to="/parent/studentSchedule" className="nav-link">
            <CalendarDays size={18} className="nav-icon" />
            {expanded && <span className="nav-text">ตารางเรียน</span>}
          </NavLink>
        </div>
        
        {/* course section */}
        <div className="nav-section">
          <div className="section-title">
            <BookOpen size={18} className="section-icon" />
            {expanded && <span className="section-text">คอร์สเรียน</span>}
          </div>

          <NavLink to="/parent/allCourse" className="nav-link">
            <Search size={18} className="nav-icon" />
            {expanded && <span className="nav-text">คอร์สเรียนทั้งหมด</span>}
          </NavLink>

          <NavLink to="/parent/enrolledCourses" className="nav-link">
            <BarChart3 size={18} className="nav-icon" />
            {expanded && <span className="nav-text">คอร์สที่สมัครแล้ว</span>}
          </NavLink>
        </div>

        {/* Finance section */}
        <div className="nav-section">
          <div className="section-title">
            <DollarSign size={18} className="section-icon" />
            {expanded && <span className="section-text">การชำระเงิน</span>}
          </div>

          <NavLink to="/parent/pending-payments" className="nav-link">
            <CreditCard size={18} className="nav-icon" />
            {expanded && <span className="nav-text">ตรวจสอบชำระเงิน</span>}
          </NavLink>

          <NavLink to="/parent/paymentHistory" className="nav-link">
            <LineChart size={18} className="nav-icon" />
            {expanded && <span className="nav-text">ประวัติการชำระเงิน</span>}
          </NavLink>
        </div>

        {/* Feedback section */}
        <div className="nav-section">
          <div className="section-title">
            <GraduationCap size={18} className="section-icon" />
            {expanded && <span className="section-text">ผลการเรียน</span>}
          </div>

          <NavLink to="/parent/learning" className="nav-link">
            <BarChart3 size={18} className="nav-icon" />
            {expanded && <span className="nav-text">รายงานผลการเรียน</span>}
          </NavLink>
        </div>

        {/* Account section */}
        <div className="nav-section">
          <div className="section-title">
            <Users size={18} className="section-icon" />
            {expanded && <span className="section-text">บัญชีของฉัน</span>}
          </div>

          <NavLink to="/parent/EditInfoParent" className="nav-link">
            <Edit size={18} className="nav-icon" />
            {expanded && <span className="nav-text">แก้ไขข้อมูลส่วนตัว</span>}
          </NavLink>

          {/* เปลี่ยนจาก /parent/editStudent/:studentId เป็น /parent/editStudent */}
          <NavLink to="/parent/editStudent" className="nav-link">
            <UserPlus size={18} className="nav-icon" />
            {expanded && <span className="nav-text">แก้ไขข้อมูลนักเรียน</span>}
          </NavLink>
          <NavLink to="/logindummy" className="nav-link">
          
            {expanded && <span className="nav-text">ออกจากระบบ</span>}
        </NavLink>
        </div>
      </div>
        

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <User size={22} className="user-icon" />
          {expanded && (
            <div className="user-info">
              <span className="user-name">
                {loading ? "กำลังโหลด..." : parentName}
              </span>
              <span className="user-role">ผู้ใช้งานระบบ</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}