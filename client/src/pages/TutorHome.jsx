// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "./TutorHome.css";
import Navigation from "../components/Navigation";
import { useNavigate } from "react-router-dom";

function TutorHome() {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ดึง account_id ที่เก็บไว้ตอน Login
  const currentAccountId = localStorage.getItem("account_id");
  const tutor_id = localStorage.getItem("tutor_id");

  useEffect(() => {
    // ตรวจสอบความปลอดภัย: ถ้าไม่มี id ใน storage ให้ส่งกลับไปหน้า login
    if (!currentAccountId || !tutor_id) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching data for account_id:", currentAccountId);
        
        const res = await fetch("http://localhost:3000/api/begin/TutorHome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_id: currentAccountId,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Error ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Fetched data:", data);
        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentAccountId, tutor_id, navigate]);

  const goToCalendar = () => {
    navigate("/TutorWeekCalen", {
      state: { tutor_id: tutor_id },
    });
  };

  // ฟังก์ชันแปลงวันที่ให้เป็น YYYY-MM-DD
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // ฟังก์ชันแสดงวันที่ภาษาไทย
  const formatThaiDate = (date) => {
    return date.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // สร้างวันที่
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const next = new Date(today);
  next.setDate(today.getDate() + 2);

  // แปลงวันที่เป็น string
  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(tomorrow);
  const nextStr = formatDate(next);

  console.log("Today:", todayStr);
  console.log("Tomorrow:", tomorrowStr);
  console.log("Next:", nextStr);

  const filterClassesByDate = (dateStr) => {
    if (!Array.isArray(classes)) return [];

    return classes.filter((cls) => {
      // ตัดเวลาออกจาก session_date ถ้ามี
      const clsDate = cls.date ? cls.date.split('T')[0] : '';
      const dateMatch = clsDate === dateStr;
      const searchMatch = cls.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return dateMatch && searchMatch;
    });
  };

  //UpdateNote
  const handleNoteBlur = async (sessionId, noteValue) => {
    try {
      const res = await fetch("http://localhost:3000/api/begin/TutorHome", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, note: noteValue }),
      });
      
      if (res.ok) {
        console.log("บันทึกหมายเหตุสำเร็จ ✨");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการบันทึก:", err);
    }
  }; 

  const renderList = (dateStr) => {
    const list = filterClassesByDate(dateStr);

    if (list.length === 0) {
      return <p className="text-muted">ไม่มีคาบเรียน</p>;
    }

    return list.map((cls) => (
      <div className="class-row d-flex" key={cls.id}>
        <p>{cls.student_name}</p>
        <p>
          {cls.start_time} - {cls.end_time}
        </p>
        <p>{cls.lesson}</p>
        <Link
          to={`/LearningRec?session_id=${cls.id}&enrollment_id=${cls.enrollment_id}`}
          className="learn-btn"
        >
          <p>คลิก</p>
        </Link>
        <input
          type="text"
          defaultValue={cls.note}
          onBlur={(e) => handleNoteBlur(cls.id, e.target.value)}
          placeholder="เพิ่มหมายเหตุ..."
        />
      </div>
    ));
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="loading-container">
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="error-container">
          <p>เกิดข้อผิดพลาด: {error}</p>
          <button onClick={() => window.location.reload()}>ลองอีกครั้ง</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />

      <div className="search-bar">
        <input
          type="text"
          placeholder="ค้นหาชื่อนักเรียน"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <i className="bi bi-search"></i>
      </div>


      <div className="date">
        {/* วันนี้ */}
        <div className="today">
          <h1>คาบเรียนวันนี้</h1>
          <h3 className="todaydate">{formatThaiDate(today)}</h3>

          <div className="class">
            <div className="class-nav d-flex">
              <p>ชื่อนักเรียน</p>
              <p>เวลา</p>
              <p>บทเรียนที่จะเรียน</p>
              <p>เขียนบันทึกการเรียน</p>
              <p>หมายเหตุ</p>
            </div>
            <div className="class-box">{renderList(todayStr)}</div>
          </div>
        </div>

        {/* พรุ่งนี้ */}
        <div className="tomorrow">
          <h1>คาบเรียนพรุ่งนี้</h1>
          <h3 className="dateTomorrow">{formatThaiDate(tomorrow)}</h3>

          <div className="class-nav d-flex">
            <p>ชื่อนักเรียน</p>
            <p>เวลา</p>
            <p>บทเรียนที่จะเรียน</p>
            <p>เขียนบันทึกการเรียน</p>
            <p>หมายเหตุ</p>
          </div>

          <div className="class-box">{renderList(tomorrowStr)}</div>
        </div>

        {/* มะรืน */}
        <div className="next">
          <h1>คาบเรียนมะรืน</h1>
          <h3 className="dateNext">{formatThaiDate(next)}</h3>

          <div className="class-nav d-flex">
            <p>ชื่อนักเรียน</p>
            <p>เวลา</p>
            <p>บทเรียนที่จะเรียน</p>
            <p>เขียนบันทึกการเรียน</p>
            <p>หมายเหตุ</p>
          </div>
          <div className="class-box">{renderList(nextStr)}</div>
        </div>
      </div>

      {/* แสดงจำนวนข้อมูลทั้งหมด */}
    </>
  );
}

export default TutorHome;
