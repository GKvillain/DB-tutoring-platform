import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import "./TutorEnrollStudent.css";
import "../App.css";

export function EnrollStudentByParent() {
    const navigate = useNavigate();
    const accountId = localStorage.getItem("account_id");

    // ========== State ==========
    const [step, setStep] = useState(1); // 1: กรอกอีเมล, 2: เลือกนักเรียน, 3: กรอกข้อมูลคอร์ส

    // Parent
    const [parentEmail, setParentEmail] = useState("");
    const [parentData, setParentData] = useState(null);
    const [parentLoading, setParentLoading] = useState(false);
    const [parentError, setParentError] = useState("");

    // Students
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentsLoading, setStudentsLoading] = useState(false);

    // คอร์ส
    //const [courses, setCourses] = useState([]);
    const [courseOptions, setCourseOptions] = useState([]);

    // รูปภาพ
    //const [studentImage, setStudentImage] = useState(null);
    //const [studentImgPreview, setStudentImgPreview] = useState(null);
    const [bookImage, setBookImage] = useState(null);
    const [bookImgPreview, setbookImgPreview] = useState(null);

    // ฟอร์มลงทะเบียน
    const [enrollment, setEnrollment] = useState({
        course_id: "",
        start_date: "",
        parent_need: "",
        book_name: ""
    });

    const [enrollmentErrors, setEnrollmentErrors] = useState({
        course_id: "",
        start_date: ""
    });

    // ตารางเวลา
    const [schedules, setSchedules] = useState([]);
    const [availabilityChecking, setAvailabilityChecking] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);

    const [loading, setLoading] = useState(false);

    const WEEKDAYS = [
        { key: "จันทร์", label: "จ", order: 1, dayofweek: "1" },
        { key: "อังคาร", label: "อ", order: 2, dayofweek: "2" },
        { key: "พุธ", label: "พ", order: 3, dayofweek: "3" },
        { key: "พฤหัส", label: "พฤ", order: 4, dayofweek: "4" },
        { key: "ศุกร์", label: "ศ", order: 5, dayofweek: "5" },
        { key: "เสาร์", label: "ส", order: 6, dayofweek: "6" },
        { key: "อาทิตย์", label: "อา", order: 7, dayofweek: "0" }
    ];

    // ========== Fetch คอร์ส ==========
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/courses");
                const data = await res.json();
                if (res.ok) {
                    //setCourses(data);
                    setCourseOptions(data);
                }
            } catch (err) {
                console.error("Error fetching courses:", err);
            }
        };
        fetchCourses();
    }, []);

    // ========== ค้นหาผู้ปกครองจากอีเมล ==========
    const handleSearchParent = async () => {
        if (!parentEmail || !parentEmail.includes('@')) {
            setParentError("กรุณากรอกอีเมลให้ถูกต้อง");
            return;
        }

        setParentLoading(true);
        setParentError("");

        try {
            const res = await fetch(
                `http://localhost:3000/api/parent/by-email/${encodeURIComponent(parentEmail)}`
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "ไม่พบข้อมูลผู้ปกครอง");
            }

            const data = await res.json();
            setParentData(data);

            // ดึงรายชื่อนักเรียน
            await fetchStudents(data.parent_id);

        } catch (err) {
            console.error("Parent search error:", err);
            setParentError(err.message);
            setParentData(null);
            setStudents([]);
        } finally {
            setParentLoading(false);
        }
    };

    // ========== ดึงรายชื่อนักเรียน ==========
    const fetchStudents = async (parentId) => {
        setStudentsLoading(true);
        try {
            const res = await fetch(
                `http://localhost:3000/api/parent/${parentId}/students`
            );
            const data = await res.json();
            setStudents(data);
            if (data.length > 0) {
                setStep(2); // ไปขั้นตอนเลือกนักเรียน
            } else {
                setParentError("ไม่พบข้อมูลนักเรียนของผู้ปกครองนี้");
            }
        } catch (err) {
            console.error("Fetch students error:", err);
        } finally {
            setStudentsLoading(false);
        }
    };

    // ========== เลือกนักเรียน ==========
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setStep(3); // ไปขั้นตอนกรอกข้อมูลคอร์ส
    };

    // ========== ฟังก์ชันจัดการตารางเวลา ==========
    function toggleWeekday(day) {
        setSchedules(prev => {
            const exists = prev.find(s => s.weekday === day);
            if (exists) {
                return prev.filter(s => s.weekday !== day);
            }
            return [...prev, { weekday: day, start_time: "", end_time: "" }];
        });
        setAvailabilityError(null);
    }

    function setTime(day, field, value) {
        setSchedules(prev =>
            prev.map(s =>
                s.weekday === day ? { ...s, [field]: value } : s
            )
        );
        setAvailabilityError(null);
    }

    const sortedSchedules = [...schedules].sort((a, b) => {
        const orderA = WEEKDAYS.find(d => d.key === a.weekday)?.order ?? 99;
        const orderB = WEEKDAYS.find(d => d.key === b.weekday)?.order ?? 99;
        return orderA - orderB;
    });

    const schedulesForApi = schedules
        .filter(s => s.start_time && s.end_time)
        .map(s => {
            const d = WEEKDAYS.find(w => w.key === s.weekday);
            return {
                dayofweek: d.dayofweek,
                start_time: s.start_time,
                end_time: s.end_time
            };
        });

    // ========== ตรวจสอบความว่าง ==========
    const checkAvailability = async () => {
        const validSchedules = schedulesForApi;
        if (validSchedules.length === 0) return true;

        setAvailabilityChecking(true);
        setAvailabilityError(null);

        try {
            const res = await fetch("http://localhost:3000/api/check-availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tutor_id: accountId,
                    schedules: validSchedules
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

            if (data.has_conflict) {
                const conflictMessages = data.conflicts.map(c =>
                    `วัน${c.day_thai} เวลา ${c.start_time} - ${c.end_time} (มีคาบกับ ${c.student_name})`
                );
                setAvailabilityError(
                    "ไม่สามารถลงทะเบียนได้เนื่องจากช่วงเวลาต่อไปนี้ไม่ว่าง:\n" +
                    conflictMessages.join("\n")
                );
                return false;
            }
            return true;
        } catch (err) {
            console.error("Availability check error:", err);
            setAvailabilityError("เกิดข้อผิดพลาดในการตรวจสอบช่วงเวลา");
            return false;
        } finally {
            setAvailabilityChecking(false);
        }
    };

    // ========== Validation ==========
    const validateForm = () => {
        let isValid = true;
        const newErrors = { course_id: "", start_date: "" };

        if (!enrollment.course_id) {
            newErrors.course_id = "กรุณาเลือกคอร์ส";
            isValid = false;
        }

        if (!enrollment.start_date) {
            newErrors.start_date = "กรุณาเลือกวันที่เริ่มเรียน";
            isValid = false;
        }

        setEnrollmentErrors(newErrors);
        return isValid;
    };

    // ========== Submit ==========
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const isAvailable = await checkAvailability();
        if (!isAvailable) return;

        if (loading) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("accountType", "hasAccount");
            formData.append("account_id", accountId);

            // ส่ง parent data
            formData.append("parent", JSON.stringify({
                email: parentData.email
            }));

            // ส่ง student data (ใช้ข้อมูลจาก selectedStudent)
            formData.append("student", JSON.stringify({
                student_id: selectedStudent.student_id,
                fname: selectedStudent.student_fname || "",
                lname: selectedStudent.student_lname || "",
                nickname: selectedStudent.student_nickname,
                birthdate: selectedStudent.birthdate
            }));

            formData.append("enrollment", JSON.stringify({
                course_id: enrollment.course_id,
                start_date: enrollment.start_date,
                parent_need: enrollment.parent_need || "",
                book_name: enrollment.book_name || "",
                schedules: schedulesForApi
            }));


            if (bookImage) formData.append("bookImage", bookImage);

            const res = await fetch("http://localhost:3000/api/newenroll", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.message);
                return;
            }

            alert("ลงทะเบียนสำเร็จ");
            navigate(-1);

        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ========== Handlers ==========
    const onChangeEnroll = (field) => (e) => {
        setEnrollment(prev => ({ ...prev, [field]: e.target.value }));
        setEnrollmentErrors(prev => ({ ...prev, [field]: "" }));
    };

    const onChangeImage = (setFile, setPreview) => (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFile(file);
        if (setPreview) setPreview(URL.createObjectURL(file));
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setSelectedStudent(null);
        } else if (step === 2) {
            setStep(1);
            setParentData(null);
            setStudents([]);
        } else {
            navigate(-1);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchParent();
        }
    };

    // ========== Render ==========
    return (
        <>
            <Navigation />
            <div className="page-center">
                <div className="form-container">
                    <div className="header-section">
                        <button className="back-button" onClick={handleBack}>
                            ← กลับ
                        </button>
                    </div>

                    <h1 className="topic center">ลงทะเบียนเรียน</h1>

                    {/* ขั้นตอนที่ 1: กรอกอีเมลผู้ปกครอง */}
                    {step === 1 && (
                        <>
                            <h5 className="sectionTopic">ค้นหาผู้ปกครอง</h5>
                            <div className="form-section">

                                <div className="row">
                                    <div className="field md" style={{ maxWidth: '400px', margin: '0 auto' }}>
                                        <label>
                                            อีเมลผู้ปกครอง <span className="required">*</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="email"
                                                value={parentEmail}
                                                onChange={(e) => setParentEmail(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="กรอกอีเมลผู้ปกครอง"
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSearchParent}
                                                disabled={parentLoading}
                                                style={{
                                                    padding: '0.5rem 1.5rem',
                                                    borderRadius: '2rem',
                                                    border: 'none',
                                                    background: '#b388ff',
                                                    color: 'white',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {parentLoading ? "กำลังค้นหา..." : "ค้นหา"}
                                            </button>
                                        </div>
                                        {parentError && (
                                            <span className="error-message">{parentError}</span>
                                        )}
                                    </div>
                                </div>

                                {parentData && (
                                    <div className="selected-student-info" style={{ marginTop: '20px' }}>
                                        <div className="student-details">
                                            <h3>{parentData.fname} {parentData.lname}</h3>
                                            <p>อีเมล: {parentData.email}</p>
                                            <p>เบอร์โทร: {parentData.tel || '-'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ขั้นตอนที่ 2: เลือกนักเรียน */}
                    {step === 2 && (
                        <>
                            <h5 className="sectionTopic">เลือกนักเรียน</h5>
                            <div className="form-section">

                                {studentsLoading ? (
                                    <p>กำลังโหลด...</p>
                                ) : (
                                    <div className="students-list">
                                        {students.map((student) => (
                                            <div
                                                key={student.student_id}
                                                className="student-card"
                                                onClick={() => handleSelectStudent(student)}
                                            >
                                                {/*
                                                <div className="student-avatar">
                                                    {student.student_picture ? (
                                                        <img src={student.student_picture} alt={student.student_nickname} />
                                                    ) : (
                                                        student.student_nickname?.charAt(0) || '?'
                                                    )}
                                                </div>*/}
                                                <div className="student-info">
                                                    <h4>{student.student_nickname}</h4>
                                                    <p>{student.student_fname || ''} {student.student_lname || ''}</p>
                                                    <span className="student-birthdate">เกิด: {student.birthdate}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}


                            </div>
                        </>
                    )}

                    {/* ขั้นตอนที่ 3: กรอกข้อมูลคอร์ส */}
                    {step === 3 && selectedStudent && (
                        <form onSubmit={handleSubmit}>
                            {/* แสดงข้อมูลนักเรียนที่เลือก - อยู่ตรงกลาง */}
                            <div className="selected-student-section">
                                <div className="imgUpload person has-image">


                                    {selectedStudent.student_picture ? (
                                        <img src={selectedStudent.student_picture} alt={selectedStudent.student_nickname} />
                                    ) : (
                                        selectedStudent.student_nickname?.charAt(0) || '?'
                                    )}
                                </div>
                                <h2 className="selected-student-name">{selectedStudent.student_nickname}</h2>
                                <p className="selected-student-fullname">
                                    {selectedStudent.student_fname || ''} {selectedStudent.student_lname || ''}
                                </p>
                                <p className="selected-student-birthdate">เกิด: {selectedStudent.birthdate}</p>
                            </div>
                            {/* ข้อมูลคอร์ส */}
                            <h5 className="sectionTopic">ข้อมูลคอร์สที่ลงทะเบียน</h5>
                            <div className="form-section">
                                <div className="row">
                                    <div className="field md">
                                        <label>ชื่อคอร์ส <span className="required">*</span></label>
                                        <Select
                                            className="creatable-select-container"
                                            classNamePrefix="creatable-select"
                                            placeholder="เลือกคอร์ส"
                                            options={courseOptions}
                                            isClearable
                                            isSearchable
                                            value={courseOptions.find(o => o.value === enrollment.course_id) || null}
                                            onChange={(opt) => {
                                                setEnrollment(prev => ({ ...prev, course_id: opt?.value || "" }));
                                                setEnrollmentErrors(prev => ({ ...prev, course_id: "" }));
                                            }}
                                        />
                                        {enrollmentErrors.course_id && (
                                            <span className="error-message">{enrollmentErrors.course_id}</span>
                                        )}
                                    </div>
                                    <div className="field md">
                                        <label>วันที่เริ่มเรียน <span className="required">*</span></label>
                                        <input
                                            type="date"
                                            value={enrollment.start_date}
                                            onChange={onChangeEnroll("start_date")}
                                            className={enrollmentErrors.start_date ? "error" : ""}
                                        />
                                        {enrollmentErrors.start_date && (
                                            <span className="error-message">{enrollmentErrors.start_date}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="field">
                                        <label>วันเรียน<span className="optional">(ไม่บังคับ)</span></label>
                                        <div className="weekday-buttons">
                                            {WEEKDAYS.map(d => (
                                                <button
                                                    key={d.key}
                                                    type="button"
                                                    className={schedules.some(s => s.weekday === d.key) ? "active" : ""}
                                                    onClick={() => toggleWeekday(d.key)}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>

                                        {sortedSchedules.map(s => {
                                            const day = WEEKDAYS.find(d => d.key === s.weekday);
                                            return (
                                                <div key={s.weekday} className="time-picker">
                                                    <span>{day?.key}</span>
                                                    <input
                                                        type="time"
                                                        value={s.start_time}
                                                        onChange={e => setTime(s.weekday, "start_time", e.target.value)}
                                                    />
                                                    <span>–</span>
                                                    <input
                                                        type="time"
                                                        value={s.end_time}
                                                        onChange={e => setTime(s.weekday, "end_time", e.target.value)}
                                                    />
                                                </div>
                                            );
                                        })}

                                        {availabilityError && (
                                            <div className="availability-error">
                                                {availabilityError}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="field full">
                                        <label>ความต้องการของผู้ปกครอง <span className="optional">(ไม่บังคับ)</span></label>
                                        <textarea
                                            value={enrollment.parent_need}
                                            onChange={onChangeEnroll("parent_need")}
                                            placeholder="ระบุความต้องการเพิ่มเติม"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ข้อมูลอื่นๆ */}
                            <h5 className="sectionTopic">ข้อมูลอื่นๆ <span className="optional">(ไม่บังคับ)</span></h5>
                            <div className="form-section">

                                <div className="row">
                                    <div className="field md">
                                        <label>ชื่อหนังสือ</label>
                                        <input
                                            type="text"
                                            value={enrollment.book_name}
                                            onChange={onChangeEnroll("book_name")}
                                        />
                                    </div>
                                </div>

                                <div className="field">
                                    <label>ภาพหนังสือ</label>
                                    <section>
                                        <label className={`imgUpload ${bookImgPreview ? "has-image" : ""}`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                hidden
                                                onChange={onChangeImage(setBookImage, setbookImgPreview)}
                                            />
                                            {bookImgPreview ? (
                                                <img src={bookImgPreview} alt="book preview" />
                                            ) : (
                                                <span>+</span>
                                            )}
                                        </label>
                                    </section>
                                </div>
                            </div>

                            {/* ปุ่มบันทึก */}
                            <button
                                className="submit-btn"
                                type="submit"
                                disabled={loading || availabilityChecking}
                            >
                                {loading ? "กำลังบันทึก..." : availabilityChecking ? "กำลังตรวจสอบ..." : "ลงทะเบียน"}
                            </button>
                        </form>
                    )}
                </div>
            </div >
        </>
    );
}