import React, { useContext, useState } from "react";
import "./ResetPassword.css";
import axios from "axios";
import { StoreContext } from "../../contexts/StoreContext";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const { url } = useContext(StoreContext);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!token || !email) {
      setMessage("Link không hợp lệ.");
      return;
    }

    if (newPassword !== confirm) {
      setMessage("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${url}/api/user/reset-password`, {
        email,
        token,
        newPassword,
      });
      setMessage(res.data.message || "Đổi mật khẩu thành công.");
      if (res.data.success) {
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setMessage("Token không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-wrapper">
      <div className="reset-card">
        <h2>Đặt lại mật khẩu</h2>
        <p>
          Nhập mật khẩu mới cho tài khoản: <strong>{email || ""}</strong>
        </p>

        <form onSubmit={handleSubmit} className="reset-form">
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button type="submit" disabled={loading || !token || !email}>
            {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
          </button>
        </form>

        {message && <p className="reset-message">{message}</p>}

        <p className="reset-back" onClick={() => navigate("/")}>
          ← Quay lại trang chủ
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
