import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ParentPaymentHistory.css";
import ParentSidebar from "../components/ParentSidebar";

export function ParentPaymentCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enrollmentId, course, tutor, month } = location.state || {};

  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // State สำหรับสลิป
  const [slipImage, setSlipImage] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  useEffect(() => {
    const fetchBankInfo = async () => {
      if (!tutor?.bank_id) return;

      try {
        const res = await fetch(`http://localhost:3000/api/parent/bank-info?bank_id=${tutor.bank_id}`);
        const data = await res.json();
        setBankInfo(data);
      } catch (err) {
        console.error("Error fetching bank info:", err);
      }
    };

    fetchBankInfo();
  }, [tutor]);

  // จัดการเลือกรูปสลิป
  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("รูปภาพต้องมีขนาดไม่เกิน 5MB");
      return;
    }

    setSlipImage(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  // ลบรูปสลิป
  const handleRemoveSlip = () => {
    setSlipImage(null);
    setSlipPreview(null);
  };

  // อัปโหลดสลิป
  const uploadSlip = async () => {
    if (!slipImage) return null;

    const formData = new FormData();
    formData.append('slip', slipImage);
    formData.append('enrollment_id', enrollmentId);
    formData.append('monthKey', month.monthKey);

    const res = await fetch("http://localhost:3000/api/parent/upload-slip", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "อัปโหลดสลิปไม่สำเร็จ");

    return data.slipUrl;
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setUploadingSlip(true);

    try {
      // อัปโหลดสลิปถ้ามี
      let slipUrl = null;
      if (slipImage) {
        slipUrl = await uploadSlip();
      }

      const res = await fetch("http://localhost:3000/api/parent/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          monthKey: month.monthKey,
          slip_url: slipUrl
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate('/parent/pending-payments');
        }, 2000);
      } else {
        alert("เกิดข้อผิดพลาด: " + data.error);
      }
    } catch (err) {
      console.error("Error creating payment:", err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
      setUploadingSlip(false);
    }
  };

  if (!location.state) {
    return (
      <>
        <ParentSidebar />
        <div className="payment-page">
          <div className="error-message">ไม่พบข้อมูลการชำระเงิน</div>
        </div>
      </>
    );
  }

  return (
    <>
      <ParentSidebar />
      <div className="payment-page">
        <div className="payment-container checkout-container">
          <h1 className="page-title">ชำระเงิน</h1>

          {paymentSuccess ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h2>ชำระเงินสำเร็จ</h2>
              <p>กำลังกลับไปหน้ารายการ...</p>
            </div>
          ) : (
            <div className="checkout-content">
              {/* ข้อมูลการชำระ */}
              <div className="payment-info-section">
                <h2 className="section-title">รายละเอียดการชำระ</h2>

                <div className="info-card">
                  <div className="info-row">
                    <span className="info-label">คอร์ส:</span>
                    <span className="info-value">{course?.name || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">เดือน:</span>
                    <span className="info-value">{month?.monthName || '-'}</span>
                  </div>
                  <div className="info-row total-row">
                    <span className="info-label">ยอดชำระรวม:</span>
                    <span className="total-value">
                      {month?.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'} บาท
                    </span>
                  </div>
                </div>
              </div>

              {/* ข้อมูลธนาคาร */}
              <div className="bank-info-section">
                <h2 className="section-title">ชำระผ่านธนาคาร</h2>

                {bankInfo ? (
                  <div className="bank-card">
                    <div className="bank-details">
                      <p><strong>ชื่อบัญชี:</strong> {bankInfo.bank_account_name}</p>
                    </div>

                    {bankInfo.qr_image && (
                      <div className="qr-code">
                        <img src={bankInfo.qr_image} alt="QR Code" />
                        <p className="qr-hint">สแกน QR Code เพื่อชำระเงิน</p>
                      </div>
                    )}

                    <div className="payment-note">
                      <p>หลังจากชำระเงินแล้ว กรุณาอัปโหลดสลิปด้านล่าง</p>
                    </div>

                    {/* ส่วนอัปโหลดสลิป */}
                    <div className="slip-upload-section">
                      <h3 className="slip-title">อัปโหลดสลิปการชำระเงิน</h3>

                      <div className="slip-preview-container">
                        {slipPreview ? (
                          <>
                            <img
                              src={slipPreview}
                              alt="Slip preview"
                              className="slip-preview"
                            />
                            <button
                              type="button"
                              className="remove-slip-btn"
                              onClick={handleRemoveSlip}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <div className="slip-placeholder">
                            <span>ยังไม่ได้อัปโหลดสลิป</span>
                          </div>
                        )}
                      </div>

                      <div className="slip-upload-controls">
                        <label htmlFor="slip-upload" className="slip-upload-btn">
                          <input
                            id="slip-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleSlipChange}
                            style={{ display: 'none' }}
                          />
                          📎 {slipPreview ? 'เปลี่ยนสลิป' : 'เลือกไฟล์สลิป'}
                        </label>
                        {slipImage && (
                          <span className="slip-filename">{slipImage.name}</span>
                        )}
                      </div>

                      <small className="slip-hint">
                        รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
                      </small>
                    </div>

                    <button
                      className="confirm-payment-btn"
                      onClick={handleConfirmPayment}
                      disabled={loading}
                    >
                      {loading ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
                    </button>
                  </div>
                ) : (
                  <div className="no-bank-info">
                    <p>ไม่พบข้อมูลธนาคารสำหรับการชำระเงิน</p>
                    <p>กรุณาติดต่อผู้สอนโดยตรง</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  className="back-btn"
                  onClick={() => navigate('/parent/pending-payments')}
                >
                  กลับ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}