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
} from "lucide-react";
import "./Navigation.css";

export default function Navigation() {
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
        {/* Teaching */}
        <div className="nav-section">
          <div className="section-title">
            <BookOpen size={18} />
            {expanded && <span>การสอน</span>}
          </div>

          <NavLink to="/teaching/record" className="nav-link">
            <PenSquare size={18} />
            {expanded && <span>บันทึกการสอน</span>}
          </NavLink>

          <NavLink to="/teaching/statistic" className="nav-link">
            <BarChart3 size={18} />
            {expanded && <span>สถิติการสอน</span>}
          </NavLink>

          <NavLink to="/teaching/sessions" className="nav-link">
            <CalendarDays size={18} />
            {expanded && <span>จัดการคาบเรียน</span>}
          </NavLink>
        </div>

        {/* Students */}
        <div className="nav-section">
          <div className="section-title">
            <Users size={18} />
            {expanded && <span>นักเรียน</span>}
          </div>

          <NavLink to="/students/register" className="nav-link">
            <UserPlus size={18} />
            {expanded && <span>ลงทะเบียนนักเรียนใหม่</span>}
          </NavLink>

          <NavLink to="/students/enroll" className="nav-link">
            <GraduationCap size={18} />
            {expanded && <span>ลงทะเบียนเรียนคอร์ส</span>}
          </NavLink>
        </div>

        {/* Finance */}
        <div className="nav-section">
          <div className="section-title">
            <DollarSign size={18} />
            {expanded && <span>การเงิน</span>}
          </div>

          <NavLink to="/finance/payment-status" className="nav-link">
            <CreditCard size={18} />
            {expanded && <span>อัปเดตสถานะชำระเงิน</span>}
          </NavLink>

          <NavLink to="/finance/reports" className="nav-link">
            <LineChart size={18} />
            {expanded && <span>รายงานการเงิน</span>}
          </NavLink>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <User size={22} />
          {expanded && (
            <div className="user-info">
              <span className="user-name">คุณครู</span>
              <span className="user-role">ผู้ดูแลระบบ</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
