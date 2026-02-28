import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./TutorHome.css";
import Navigation from "../components/Navigation";

function TutorHome() {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/TutorHome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // **ข้อควรระวัง**: tutor_id ต้องเป็น UUID จากตาราง classsession ในรูปของคุณ
          body: JSON.stringify({
            tutor_id: "0502cd36-f27d-4e16-8030-55234f7c4dd2", //ตารางเรียนของติวเตอร์คนไหน (ตอนนี้มีคนเดียว)
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Error ${res.status}`);
        }

        const data = await res.json();
        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err.message);
        setClasses([]); // เซตเป็นอาเรย์ว่างเพื่อไม่ให้ .filter() พัง
      }
    };

    fetchData();
  }, []);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0"); // เดือนเริ่มที่ 0 ต้อง +1
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // ฟังก์ชันแสดงวันที่ภาษาไทย (ใช้แบบเดิมได้เลยครับ ถูกต้องแล้ว)
  const formatThaiDate = (date) => {
    return date.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const today = new Date();
  const tomorrow = new Date();
  const next = new Date();
  tomorrow.setDate(today.getDate() + 1);
  next.setDate(today.getDate() + 2);

  const filterClasses = (dateObj) => {
    const dateStr = formatDate(dateObj);
    // ตรวจสอบว่า classes เป็น array หรือไม่ก่อน filter
    if (!Array.isArray(classes)) return [];

    return classes.filter(
      (cls) =>
        cls.date === dateStr &&
        cls.student_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const handleNoteBlur = async (sessionId, noteValue) => {
    try {
      await fetch("http://localhost:3000/api/updateNote", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, note: noteValue }),
      });
      console.log("บันทึกหมายเหตุสำเร็จ ✨");
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการบันทึก:", err);
    }
  };

  const renderList = (dateObj) => {
    const list = filterClasses(dateObj);

    if (list.length === 0) {
      return <p className="text-muted">ไม่มีคาบเรียน</p>;
    }

    return list.map((cls) => (
      <div className="class-row d-flex" key={cls.id}>
        <p>{cls.student_name}</p>
        <p>{cls.grade}</p>
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
          defaultValue={cls.note} // แสดงค่าเก่าจากฐานข้อมูล
          onBlur={(e) => handleNoteBlur(cls.id, e.target.value)} // บันทึกเมื่อพิมพ์เสร็จและกดออกจากช่อง
          placeholder="เพิ่มหมายเหตุ..."
        />
      </div>
    ));
  };

  return (
    <>
      <Navigation />
      <div className="search-bar">
        <input
          type="text"
          placeholder="ค้นหา"
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
              <p>ชั้น</p>
              <p>เวลา</p>
              <p>บทเรียนที่จะเรียน</p>
              <p>เขียนบันทึกการเรียน</p>
              <p>หมายเหตุ</p>
            </div>
            <div className="class-box">{renderList(today)}</div>
          </div>
        </div>

        {/* พรุ่งนี้ */}
        <div className="tomorrow">
          <h1>คาบเรียนพรุ่งนี้</h1>
          <h3 className="dateTomorrow">{formatThaiDate(tomorrow)}</h3>

          <div className="class-nav d-flex">
            <p>ชื่อนักเรียน</p>
            <p>ชั้น</p>
            <p>เวลา</p>
            <p>บทเรียนที่จะเรียน</p>
            <p>เขียนบันทึกการเรียน</p>
            <p>หมายเหตุ</p>
          </div>

          <div className="class-box">{renderList(tomorrow)}</div>
        </div>

        {/* มะรืน */}
        <div className="next">
          <h1>คาบเรียนมะรืน</h1>
          <h3 className="dateNext">{formatThaiDate(next)}</h3>

          <div className="class-nav d-flex">
            <p>ชื่อนักเรียน</p>
            <p>ชั้น</p>
            <p>เวลา</p>
            <p>บทเรียนที่จะเรียน</p>
            <p>เขียนบันทึกการเรียน</p>
            <p>หมายเหตุ</p>
          </div>
          <div className="class-box">{renderList(next)}</div>
        </div>
      </div>
    </>
  );
}

export default TutorHome;
