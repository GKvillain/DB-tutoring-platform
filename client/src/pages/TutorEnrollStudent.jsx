import "./TutorEnrollStudent.css";
import "../App.css";
import Navigation from "../components/Navigation";
import CreatableSelect from "react-select/creatable";
import { useState, useEffect } from "react";

export function EnrollStudent() {
    // course
    const [course, setCourse] = useState([]);

    // student form
    const [studentImage, setStudentImage] = useState(null);
    const [studentImgPreview, setStudentImgPreview] = useState(null);
    const [studentForm, setStudentForm] = useState({
        fname: "",
        lname: "",
        nickname: "",
        birthdate: ""
    });

    // student form errors
    const [studentErrors, setStudentErrors] = useState({
        nickname: "",
        birthdate: ""
    });

    // parent form
    const [accountType, setAccountType] = useState("hasAccount");

    // has account
    const [hasAccountForm, setHasAccountForm] = useState({
        email: ""
    });
    const [hasAccountErrors, setHasAccountErrors] = useState({
        email: ""
    });

    // no account
    const defPass = "p123";
    const [noAccountForm, setNoAccountForm] = useState({
        fname: "",
        lname: "",
        password: defPass,
        email: "",
        tel: "",
        line_id: "",
        fb_name: ""
    });
    const [noAccountErrors, setNoAccountErrors] = useState({
        fname: "",
        email: "",
        contact: ""
    });

    const accountId = localStorage.getItem("account_id");

    const [bookImage, setBookImage] = useState(null);
    const [bookImgPreview, setbookImgPreview] = useState(null);

    // enroll detail
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

    const courseOptions = course;

    // schedule - ไม่บังคับ
    const [schedules, setSchedules] = useState([]);
    const [availabilityChecking, setAvailabilityChecking] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);

    const WEEKDAYS = [
        { key: "จันทร์", label: "จ", order: 1, dayofweek: "1" },
        { key: "อังคาร", label: "อ", order: 2, dayofweek: "2" },
        { key: "พุธ", label: "พ", order: 3, dayofweek: "3" },
        { key: "พฤหัส", label: "พฤ", order: 4, dayofweek: "4" },
        { key: "ศุกร์", label: "ศ", order: 5, dayofweek: "5" },
        { key: "เสาร์", label: "ส", order: 6, dayofweek: "6" },
        { key: "อาทิตย์", label: "อา", order: 7, dayofweek: "0" }
    ];

    function toggleWeekday(day) {
        setSchedules(prev => {
            const exists = prev.find(s => s.weekday === day);
            if (exists) {
                return prev.filter(s => s.weekday !== day);
            }
            return [...prev, { weekday: day, start_time: "", end_time: "" }];
        });
        // ล้าง error เมื่อมีการเปลี่ยนแปลง
        setAvailabilityError(null);
    }

    function setTime(day, field, value) {
        setSchedules(prev =>
            prev.map(s =>
                s.weekday === day ? { ...s, [field]: value } : s
            )
        );
        // ล้าง error เมื่อมีการเปลี่ยนแปลง
        setAvailabilityError(null);
    }

    // sort day of week ui
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

    //fetch courses
    useEffect(() => {
        const fetchData = async () => {
            try {
                const courseRes = await fetch("http://localhost:3000/api/courses");
                const courseData = await courseRes.json();
                if (courseRes.ok) {
                    setCourse(courseData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    // ฟังก์ชันตรวจสอบความว่างของติวเตอร์
    const checkAvailability = async () => {
        const validSchedules = schedulesForApi;
        if (validSchedules.length === 0) {
            return true; // ไม่มี schedule ให้ข้ามการตรวจสอบ
        }

        setAvailabilityChecking(true);
        setAvailabilityError(null);

        try {
            const res = await fetch("http://localhost:3000/api/check-availability", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tutor_id: accountId, // หรือต้องหา tutor_id จริงๆ
                    schedules: validSchedules
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาดในการตรวจสอบ");
            }

            if (data.has_conflict) {
                // สร้างข้อความแจ้งเตือน
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

    const [loading, setLoading] = useState(false);

    // ฟังก์ชันตรวจสอบความถูกต้องของข้อมูล
    const validateForm = () => {
        let isValid = true;
        const newStudentErrors = { nickname: "", birthdate: "" };
        const newHasAccountErrors = { email: "" };
        const newNoAccountErrors = { fname: "", email: "", contact: "" };
        const newEnrollmentErrors = { course_id: "", start_date: "" };

        // ตรวจสอบข้อมูลนักเรียน
        if (!studentForm.nickname || studentForm.nickname.trim() === "") {
            newStudentErrors.nickname = "กรุณากรอกชื่อเล่น";
            isValid = false;
        }

        if (!studentForm.birthdate) {
            newStudentErrors.birthdate = "กรุณากรอกวันเกิด";
            isValid = false;
        }

        // ตรวจสอบข้อมูลคอร์ส
        if (!enrollment.course_id) {
            newEnrollmentErrors.course_id = "กรุณาเลือกคอร์ส";
            isValid = false;
        }

        if (!enrollment.start_date) {
            newEnrollmentErrors.start_date = "กรุณาเลือกวันที่เริ่มเรียน";
            isValid = false;
        }

        // ตรวจสอบตามประเภทบัญชีผู้ปกครอง
        if (accountType === "hasAccount") {
            if (!hasAccountForm.email || hasAccountForm.email.trim() === "") {
                newHasAccountErrors.email = "กรุณากรอกอีเมล";
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(hasAccountForm.email)) {
                newHasAccountErrors.email = "กรุณากรอกอีเมลให้ถูกต้อง";
                isValid = false;
            }
            setHasAccountErrors(newHasAccountErrors);
        } else {
            if (!noAccountForm.fname || noAccountForm.fname.trim() === "") {
                newNoAccountErrors.fname = "กรุณากรอกชื่อ";
                isValid = false;
            }

            if (!noAccountForm.email || noAccountForm.email.trim() === "") {
                newNoAccountErrors.email = "กรุณากรอกอีเมล";
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(noAccountForm.email)) {
                newNoAccountErrors.email = "กรุณากรอกอีเมลให้ถูกต้อง";
                isValid = false;
            }

            const hasContact =
                (noAccountForm.tel && noAccountForm.tel.trim() !== "") ||
                (noAccountForm.line_id && noAccountForm.line_id.trim() !== "") ||
                (noAccountForm.fb_name && noAccountForm.fb_name.trim() !== "");

            if (!hasContact) {
                newNoAccountErrors.contact = "กรุณากรอกช่องทางติดต่ออย่างน้อย 1 ช่องทาง";
                isValid = false;
            }

            setNoAccountErrors(newNoAccountErrors);
        }

        setStudentErrors(newStudentErrors);
        setEnrollmentErrors(newEnrollmentErrors);
        return isValid;
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // ตรวจสอบความว่างของติวเตอร์ก่อน submit
        const isAvailable = await checkAvailability();
        if (!isAvailable) {
            return; // หยุดการ submit ถ้าไม่ว่าง
        }

        if (loading) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("accountType", accountType);
            formData.append("account_id", accountId);

            formData.append("parent", JSON.stringify(
                accountType === "hasAccount"
                    ? hasAccountForm
                    : noAccountForm
            ));

            formData.append("student", JSON.stringify(studentForm));

            formData.append("enrollment", JSON.stringify({
                course_id: enrollment.course_id,
                start_date: enrollment.start_date,
                parent_need: enrollment.parent_need || "",
                book_name: enrollment.book_name || "",
                schedules: schedulesForApi
            }));

            if (studentImage) formData.append("studentImage", studentImage);
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
            console.log(data);

            // รีเซ็ตฟอร์ม
            setStudentForm({
                fname: "",
                lname: "",
                nickname: "",
                birthdate: ""
            });
            setEnrollment({
                course_id: "",
                start_date: "",
                parent_need: "",
                book_name: ""
            });
            setSchedules([]);
            setStudentImage(null);
            setStudentImgPreview(null);
            setBookImage(null);
            setbookImgPreview(null);
            setNoAccountForm({
                fname: "",
                lname: "",
                password: defPass,
                email: "",
                tel: "",
                line_id: "",
                fb_name: ""
            });
            setHasAccountForm({ email: "" });
            setAvailabilityError(null);

        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    const onChangeStudent = (field) => (e) => {
        setStudentForm(prev => ({ ...prev, [field]: e.target.value }));
        if (field === "nickname") {
            setStudentErrors(prev => ({ ...prev, nickname: "" }));
        } else if (field === "birthdate") {
            setStudentErrors(prev => ({ ...prev, birthdate: "" }));
        }
    };

    const onChangeParent = (field) => (e) => {
        setNoAccountForm(prev => ({ ...prev, [field]: e.target.value }));
        if (field === "fname") {
            setNoAccountErrors(prev => ({ ...prev, fname: "" }));
        } else if (field === "email") {
            setNoAccountErrors(prev => ({ ...prev, email: "" }));
        } else if (["tel", "line_id", "fb_name"].includes(field)) {
            setNoAccountErrors(prev => ({ ...prev, contact: "" }));
        }
    };

    const onChangeHasAccountEmail = (e) => {
        setHasAccountForm({ ...hasAccountForm, email: e.target.value });
        setHasAccountErrors(prev => ({ ...prev, email: "" }));
    };

    const onChangeEnroll = (field) => (e) => {
        setEnrollment(prev => ({ ...prev, [field]: e.target.value }));
        if (field === "course_id") {
            setEnrollmentErrors(prev => ({ ...prev, course_id: "" }));
        } else if (field === "start_date") {
            setEnrollmentErrors(prev => ({ ...prev, start_date: "" }));
        }
    };

    const onChangeImage = (setFile, setPreview) => (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFile(file);
        if (setPreview) setPreview(URL.createObjectURL(file));
    };

    return (
        <>
            <Navigation />

            <div className="page-center">
                <div className="form-container">
                    <h1 className="topic center">ลงทะเบียนนักเรียนใหม่</h1>

                    <form className="studentForm" onSubmit={handleSubmit}>
                        {/* IMAGE UPLOAD */}
                        <div className="imgUploadWrapper">
                            <label className={`imgUpload person ${studentImgPreview ? "has-image" : ""}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={onChangeImage(setStudentImage, setStudentImgPreview)}
                                />
                                {studentImgPreview ? (
                                    <img src={studentImgPreview} alt="student preview" />
                                ) : (
                                    <span>+</span>
                                )}
                            </label>
                            <p className="imgCaption">ภาพนักเรียน (ไม่บังคับ)</p>
                        </div>

                        {/* ================= STUDENT INFO ================= */}
                        <h5 className="sectionTopic">ข้อมูลนักเรียน</h5>
                        <div className="form-section">
                            <div className="row">
                                <div className="field md">
                                    <label>ชื่อ <span className="optional">(ไม่บังคับ)</span></label>
                                    <input
                                        type="text"
                                        value={studentForm.fname}
                                        onChange={onChangeStudent("fname")}
                                    />
                                </div>
                                <div className="field md">
                                    <label>นามสกุล <span className="optional">(ไม่บังคับ)</span></label>
                                    <input
                                        type="text"
                                        value={studentForm.lname}
                                        onChange={onChangeStudent("lname")}
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="field md">
                                    <label>ชื่อเล่น <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={studentForm.nickname}
                                        onChange={onChangeStudent("nickname")}
                                        className={studentErrors.nickname ? "error" : ""}
                                    />
                                    {studentErrors.nickname && (
                                        <span className="error-message">{studentErrors.nickname}</span>
                                    )}
                                </div>
                                <div className="field md">
                                    <label>วันเกิด <span className="required">*</span></label>
                                    <input
                                        type="date"
                                        value={studentForm.birthdate}
                                        onChange={onChangeStudent("birthdate")}
                                        className={studentErrors.birthdate ? "error" : ""}
                                    />
                                    {studentErrors.birthdate && (
                                        <span className="error-message">{studentErrors.birthdate}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ================= PARENT INFO ================= */}
                        <h5 className="sectionTopic">ข้อมูลผู้ปกครอง</h5>
                        <div className="form-section">
                            <div className="account-type-row">
                                <label className={`account-type-label ${accountType === "hasAccount" ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="accountType"
                                        value="hasAccount"
                                        checked={accountType === "hasAccount"}
                                        onChange={(e) => setAccountType(e.target.value)}
                                    />
                                    มีบัญชีผู้ใช้
                                </label>

                                <label className={`account-type-label ${accountType === "noAccount" ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="accountType"
                                        value="noAccount"
                                        checked={accountType === "noAccount"}
                                        onChange={(e) => setAccountType(e.target.value)}
                                    />
                                    ไม่มีบัญชีผู้ใช้ (สมัครสมาชิกใหม่)
                                </label>
                            </div>

                            {accountType === "hasAccount" && (
                                <div className="row">
                                    <div className="field md">
                                        <label>อีเมลของบัญชี <span className="required">*</span></label>
                                        <input
                                            type="email"
                                            value={hasAccountForm.email}
                                            placeholder="อีเมลผู้ปกครอง"
                                            onChange={onChangeHasAccountEmail}
                                            className={hasAccountErrors.email ? "error" : ""}
                                        />
                                        {hasAccountErrors.email && (
                                            <span className="error-message">{hasAccountErrors.email}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {accountType === "noAccount" && (
                                <>
                                    <h5 className="sectionTopic">สมัครสมาชิก</h5>
                                    <div className="row">
                                        <div className="field md">
                                            <label>ชื่อ <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                value={noAccountForm.fname}
                                                onChange={onChangeParent("fname")}
                                                className={noAccountErrors.fname ? "error" : ""}
                                            />
                                            {noAccountErrors.fname && (
                                                <span className="error-message">{noAccountErrors.fname}</span>
                                            )}
                                        </div>
                                        <div className="field md">
                                            <label>นามสกุล <span className="optional">(ไม่บังคับ)</span></label>
                                            <input
                                                type="text"
                                                value={noAccountForm.lname}
                                                onChange={onChangeParent("lname")}

                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="field md">
                                            <label>อีเมล <span className="required">*</span></label>
                                            <input
                                                type="email"
                                                value={noAccountForm.email}
                                                onChange={onChangeParent("email")}
                                                className={noAccountErrors.email ? "error" : ""}
                                            />
                                            {noAccountErrors.email && (
                                                <span className="error-message">{noAccountErrors.email}</span>
                                            )}
                                        </div>
                                        <div className="field md">
                                            <label>รหัสผ่าน <span className="required">*</span></label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    value={noAccountForm.password}
                                                    onChange={onChangeParent("password")}
                                                />
                                                {noAccountForm.password && noAccountForm.password !== defPass && (
                                                    <button
                                                        type="button"
                                                        className="clear-btn"
                                                        onClick={() =>
                                                            setNoAccountForm({
                                                                ...noAccountForm,
                                                                password: defPass,
                                                            })
                                                        }
                                                        title="ตั้งกลับเป็นค่าเริ่มต้น"
                                                    >
                                                        ↩
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <label>ช่องทางติดต่อ <span className="required">*</span> (อย่างน้อย 1 ช่องทาง)</label>
                                    </div>

                                    {noAccountErrors.contact && (
                                        <div className="row">
                                            <span className="error-message">{noAccountErrors.contact}</span>
                                        </div>
                                    )}

                                    <div className="row contact">
                                        <div className="field md">
                                            <label>เบอร์โทรศัพท์</label>
                                            <input
                                                type="text"
                                                value={noAccountForm.tel}
                                                onChange={onChangeParent("tel")}
                                                placeholder="เช่น 0812345678"
                                            />
                                        </div>
                                    </div>

                                    <div className="row contact">
                                        <div className="field md">
                                            <label>ไอดีไลน์</label>
                                            <input
                                                type="text"
                                                value={noAccountForm.line_id}
                                                onChange={onChangeParent("line_id")}
                                                placeholder="เช่น line_id123"
                                            />
                                        </div>
                                    </div>

                                    <div className="row contact">
                                        <div className="field md">
                                            <label>เฟซบุ๊ค</label>
                                            <input
                                                type="text"
                                                value={noAccountForm.fb_name}
                                                onChange={onChangeParent("fb_name")}
                                                placeholder="ชื่อเฟซบุ๊ค"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ================= COURSE INFO ================= */}
                        <h5 className="sectionTopic">ข้อมูลคอร์สที่ลงทะเบียน</h5>
                        <div className="form-section">
                            <div className="row">
                                <div className="field md">
                                    <label>ชื่อคอร์ส <span className="required">*</span></label>
                                    <CreatableSelect
                                        className="creatable-select-container"
                                        classNamePrefix="creatable-select"
                                        placeholder="เลือกคอร์ส"
                                        options={courseOptions}
                                        isClearable
                                        isSearchable
                                        value={
                                            courseOptions.find(o => o.value === enrollment.course_id) || null
                                        }
                                        onChange={(opt) => {
                                            setEnrollment(prev => ({
                                                ...prev,
                                                course_id: opt?.value || ""
                                            }));
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
                                                    onChange={e =>
                                                        setTime(s.weekday, "start_time", e.target.value)
                                                    }
                                                />
                                                <span>–</span>
                                                <input
                                                    type="time"
                                                    value={s.end_time}
                                                    onChange={e =>
                                                        setTime(s.weekday, "end_time", e.target.value)
                                                    }
                                                />
                                            </div>
                                        );
                                    })}

                                    {/* แสดง error การตรวจสอบความว่าง */}
                                    {availabilityError && (
                                        <div className="availability-error" style={{ color: 'red', marginTop: '10px', whiteSpace: 'pre-line' }}>
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

                        <button
                            className="submit-btn"
                            type="submit"
                            disabled={loading || availabilityChecking}
                        >
                            {loading ? "กำลังบันทึก..." : availabilityChecking ? "กำลังตรวจสอบ..." : "ลงทะเบียน"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}