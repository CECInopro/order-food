import React, { useContext, useState } from "react";
import "./ForgotPassword.css";
import axios from "axios";
import { StoreContext } from "../../contexts/StoreContext";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const { url } = useContext(StoreContext);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${url}/api/user/forgot-password`, { email });
      setMessage(res.data.message || "Nếu email tồn tại, link reset đã được gửi.");
    } catch (err) {
      console.error(err);
      setMessage("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        <h2>Quên mật khẩu</h2>
        <p>Nhập email đã đăng ký để nhận link đặt lại mật khẩu.</p>
        <form onSubmit={handleSubmit} className="forgot-form">
          <input
            type="email"
            placeholder="Email đăng ký"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </button>
        </form>
        {message && <p className="forgot-message">{message}</p>}
        <p className="forgot-back" onClick={() => navigate("/")}>
          ← Quay lại trang chủ
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
