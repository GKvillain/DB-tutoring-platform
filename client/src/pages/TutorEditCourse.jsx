import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Select from "react-select";
import "./TutorAddCourse.css";
import "./TutorEditCourse.css";
import "../App.css";

export function TutorEditCourse() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const accountId = localStorage.getItem("account_id");

    // ========== State ==========
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    const [courseImage, setCourseImage] = useState(null);
    const [courseImgPreview, setCourseImgPreview] = useState(null);
    const [existingImage, setExistingImage] = useState("");

    // Dropdown options
    const [gradeLevels, setGradeLevels] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Form data
    const [form, setForm] = useState({
        course_name_thai: "",
        course_name_eng: "",
        grade_level: null,
        course_subject: null,
        price: "",
        course_description: "",
        course_info: "",
    });

    // Errors
    const [errors, setErrors] = useState({
        course_name_thai: "",
        grade_level: "",
        course_subject: "",
        price: "",
    });

    // ========== Fetch dropdowns and course data ==========
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch dropdowns และ course data พร้อมกัน
                const [gradeRes, subjectRes, courseRes] = await Promise.all([
                    fetch("http://localhost:3000/api/grade-levels"),
                    fetch("http://localhost:3000/api/subjects"),
                    fetch(`http://localhost:3000/api/course/${courseId}/edit`)
                ]);

                if (gradeRes.ok) setGradeLevels(await gradeRes.json());
                if (subjectRes.ok) setSubjects(await subjectRes.json());

                if (!courseRes.ok) {
                    const errorData = await courseRes.json();
                    throw new Error(errorData.error || "ไม่พบข้อมูลคอร์ส");
                }

                const courseData = await courseRes.json();

                // เซ็ตฟอร์มด้วยข้อมูลเดิม
                setForm({
                    course_name_thai: courseData.course_name_thai || "",
                    course_name_eng: courseData.course_name_eng || "",
                    grade_level: courseData.grade_level,
                    course_subject: courseData.course_subject,
                    price: courseData.price?.toString() || "",
                    course_description: courseData.course_description || "",
                    course_info: courseData.course_info || "",
                });

                // เซ็ตรูปภาพเดิม
                if (courseData.course_image) {
                    setExistingImage(courseData.course_image);
                    setCourseImgPreview(courseData.course_image);
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                setFetchError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    // ========== Handlers ==========
    const onChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const onSelectChange = (field) => (opt) => {
        setForm((prev) => ({ ...prev, [field]: opt?.value || null }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const onImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCourseImage(file);
        setCourseImgPreview(URL.createObjectURL(file));
    };

    // ========== Validation ==========
    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            course_name_thai: "",
            grade_level: "",
            course_subject: "",
            price: "",
        };

        if (!form.course_name_thai?.trim()) {
            newErrors.course_name_thai = "กรุณากรอกชื่อคอร์สภาษาไทย";
            isValid = false;
        }

        if (!form.grade_level) {
            newErrors.grade_level = "กรุณาเลือกระดับชั้น";
            isValid = false;
        }

        if (!form.course_subject) {
            newErrors.course_subject = "กรุณาเลือกรายวิชา";
            isValid = false;
        }

        if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
            newErrors.price = "กรุณากรอกราคาที่ถูกต้อง";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // ========== Submit ==========
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (saving) return;
        setSaving(true);

        try {
            const formData = new FormData();
            formData.append("account_id", accountId);
            formData.append("course_name_thai", form.course_name_thai);
            formData.append("course_name_eng", form.course_name_eng);
            formData.append("grade_level", form.grade_level);
            formData.append("course_subject", form.course_subject);
            formData.append("price", form.price);
            formData.append("course_description", form.course_description);
            formData.append("course_info", form.course_info);
            formData.append("existing_image", existingImage);

            if (courseImage) {
                formData.append("courseImg", courseImage);
            }

            const res = await fetch(`http://localhost:3000/api/course/${courseId}`, {
                method: "PUT",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาด");
            }

            alert("แก้ไขคอร์สสำเร็จ");
            navigate(`/course/${courseId}`); // กลับไปหน้ารายละเอียดคอร์ส

        } catch (err) {
            alert("เกิดข้อผิดพลาด: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(-1); // กลับไปหน้าก่อนหน้า
    };

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="page-center">
                    <div className="form-container">
                        <div className="loading-container">
                            <p>กำลังโหลดข้อมูล...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (fetchError) {
        return (
            <>
                <Navigation />
                <div className="page-center">
                    <div className="form-container">
                        <div className="error-container">
                            <p>เกิดข้อผิดพลาด: {fetchError}</p>
                            <button onClick={() => navigate(-1)}>กลับ</button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navigation />
            <div className="page-center">
                <div className="form-container">
                    <h1 className="topic center">แก้ไขคอร์สเรียน</h1>

                    <form onSubmit={handleSubmit}>
                        {/* ===== รูปภาพคอร์ส ===== */}
                        <div className="imgUploadWrapper">
                            <label className={`imgUpload ${courseImgPreview ? "has-image" : ""}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={onImageChange}
                                />
                                {courseImgPreview ? (
                                    <img src={courseImgPreview} alt="preview" />
                                ) : (
                                    <span>+</span>
                                )}
                            </label>
                            <p className="imgCaption">
                                {courseImage ? "เปลี่ยนรูปใหม่" : "ภาพปกคอร์ส (คลิกเพื่อเปลี่ยน)"}
                            </p>
                        </div>

                        {/* ===== ข้อมูลพื้นฐาน ===== */}
                        <h5 className="sectionTopic">ข้อมูลคอร์ส</h5>
                        <div className="form-section">
                            {/* ชื่อไทย/อังกฤษ */}
                            <div className="row">
                                <div className="field md">
                                    <label>
                                        ชื่อคอร์ส (ภาษาไทย) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.course_name_thai}
                                        onChange={onChange("course_name_thai")}
                                        className={errors.course_name_thai ? "error" : ""}
                                    />
                                    {errors.course_name_thai && (
                                        <span className="error-message">{errors.course_name_thai}</span>
                                    )}
                                </div>
                                <div className="field md">
                                    <label>
                                        ชื่อคอร์ส (ภาษาอังกฤษ) 
                                    </label>
                                    <input
                                        type="text"
                                        value={form.course_name_eng}
                                        onChange={onChange("course_name_eng")}
                                    />
                                </div>
                            </div>

                            {/* ระดับชั้น */}
                            <div className="row">
                                <div className="field md">
                                    <label>
                                        ระดับชั้น <span className="required">*</span>
                                    </label>
                                    <Select
                                        className="creatable-select-container"
                                        classNamePrefix="creatable-select"
                                        placeholder="เลือกระดับชั้น"
                                        options={gradeLevels}
                                        isClearable
                                        isSearchable
                                        value={
                                            gradeLevels.find((o) => o.value === form.grade_level) || null
                                        }
                                        onChange={onSelectChange("grade_level")}
                                    />
                                    {errors.grade_level && (
                                        <span className="error-message">{errors.grade_level}</span>
                                    )}
                                </div>

                                {/* รายวิชา */}
                                <div className="field md">
                                    <label>
                                        รายวิชา <span className="required">*</span>
                                    </label>
                                    <Select
                                        className="creatable-select-container"
                                        classNamePrefix="creatable-select"
                                        placeholder="เลือกรายวิชา"
                                        options={subjects}
                                        isClearable
                                        isSearchable
                                        value={
                                            subjects.find((o) => o.value === form.course_subject) || null
                                        }
                                        onChange={onSelectChange("course_subject")}
                                    />
                                    {errors.course_subject && (
                                        <span className="error-message">{errors.course_subject}</span>
                                    )}
                                </div>
                            </div>

                            {/* ราคา */}
                            <div className="row">
                                <div className="field md">
                                    <label>
                                        ราคา (บาท) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.price}
                                        onChange={onChange("price")}
                                        className={errors.price ? "error" : ""}
                                    />
                                    {errors.price && (
                                        <span className="error-message">{errors.price}</span>
                                    )}
                                </div>
                                <div className="field md">{/* empty for spacing */}</div>
                            </div>
                        </div>

                        {/* ===== รายละเอียดเพิ่มเติม ===== */}
                        <h5 className="sectionTopic">
                            รายละเอียดเพิ่มเติม 
                        </h5>
                        <div className="form-section">
                            <div className="row">
                                <div className="field full">
                                    <label>คำอธิบายคอร์ส</label>
                                    <textarea
                                        rows="4"
                                        value={form.course_description}
                                        onChange={onChange("course_description")}
                                        placeholder="อธิบายเกี่ยวกับคอร์สนี้"
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="field full">
                                    <label>ข้อมูลเพิ่มเติม</label>
                                    <textarea
                                        rows="4"
                                        value={form.course_info}
                                        onChange={onChange("course_info")}
                                        placeholder="เช่น หัวข้อที่เรียน จำนวนชั่วโมงที่เรียน"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* ปุ่มควบคุม */}
                        <div className="button-group">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={handleCancel}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="submit-btn"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                            </button>

                            
                        </div>




                    </form>
                </div>
            </div>
        </>
    );
}