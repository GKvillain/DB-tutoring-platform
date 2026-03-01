import { useState } from "react";
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
  Search
} from "lucide-react";
import "./ParentSidebar.css";

export default function ParentSidebar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`sidebar ${expanded ? "expanded" : "collapsed"}`}
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
        {/* course */}
        <div className="nav-section">
          <div className="section-title">
            <BookOpen size={18} />
            {expanded && <span>คอร์สเรียน</span>}
          </div>

          <NavLink to="" className="nav-link">
            <Search size={18} />
            {expanded && <span>คอร์สเรียนทั้งหมด</span>}
          </NavLink>

          <NavLink to="" className="nav-link">
            <BarChart3 size={18} />
            {expanded && <span>คอร์สที่สมัครแล้ว</span>}
          </NavLink>

        </div>

        {/* Students */}
        <div className="nav-section">
          <div className="section-title">
            <Users size={18} />
            {expanded && <span>บุตรของฉัน</span>}
          </div>

          <NavLink to="" className="nav-link">
            <UserPlus size={18} />
            {expanded && <span>รายชื่อบุตร</span>}
          </NavLink>

        </div>

        {/* Finance */}
        <div className="nav-section">
          <div className="section-title">
            <DollarSign size={18} />
            {expanded && <span>การชำระเงิน</span>}
          </div>

          <NavLink to="" className="nav-link">
            <CreditCard size={18} />
            {expanded && <span>ตรวจสอบชำระเงิน</span>}
          </NavLink>

          <NavLink to="" className="nav-link">
            <LineChart size={18} />
            {expanded && <span>ประวัติการชำระเงิน</span>}
          </NavLink>
        </div>

        {/* Feedback */}
        <div className="nav-section">
          <div className="section-title">
            <GraduationCap size={18} />
            {expanded && <span>ผลการเรียน</span>}
          </div>

          <NavLink to="" className="nav-link">
            <BarChart3 size={18} />
            {expanded && <span>รายงานผลการเรียน</span>}
          </NavLink>

        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <User size={22} />
          {expanded && (
            <div className="user-info">
              <span className="user-name">ผู้ปกครอง</span>
              <span className="user-role">ผู้ใช้งานระบบ</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
