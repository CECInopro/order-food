import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const QuickReplyModal = ({ url, quickReplies, onClose, onUpdate }) => {
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ text: "", isActive: true });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.text.trim()) return;
        setLoading(true);
        try {
            if (editing) {
                const res = await axios.put(`${url}/api/chat/admin/quick-replies/${editing}`, form);
                if (res.data.success) {
                    onUpdate((prev) => prev.map((r) => (r._id === editing ? res.data.data : r)));
                    toast.success("Đã cập nhật");
                }
            } else {
                const res = await axios.post(`${url}/api/chat/admin/quick-replies`, form);
                if (res.data.success) {
                    onUpdate((prev) => [...prev, res.data.data]);
                    toast.success("Đã thêm");
                }
            }
            setForm({ text: "", isActive: true });
            setEditing(null);
        } catch (e) {
            toast.error("Lỗi");
        }
        setLoading(false);
    };

    const handleEdit = (reply) => {
        setEditing(reply._id);
        setForm({ text: reply.text, isActive: reply.isActive });
    };

    const handleDelete = async (id) => {
        if (!confirm("Xóa quick reply này?")) return;
        try {
            await axios.delete(`${url}/api/chat/admin/quick-replies/${id}`);
            onUpdate((prev) => prev.filter((r) => r._id !== id));
            toast.success("Đã xóa");
        } catch (e) {
            toast.error("Lỗi");
        }
    };

    const toggleActive = async (reply) => {
        try {
            const res = await axios.put(`${url}/api/chat/admin/quick-replies/${reply._id}`, {
                isActive: !reply.isActive,
            });
            if (res.data.success) {
                onUpdate((prev) => prev.map((r) => (r._id === reply._id ? res.data.data : r)));
            }
        } catch (e) {
            toast.error("Lỗi");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content quick-reply-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Quản lý Quick Replies</h3>
                    <button type="button" className="modal-close" onClick={onClose}>×</button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={form.text}
                        onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                        placeholder="Nhập nội dung quick reply..."
                        maxLength={500}
                    />
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                        />
                        Đang hoạt động
                    </label>
                    <button type="submit" disabled={loading || !form.text.trim()}>
                        {editing ? "Cập nhật" : "Thêm mới"}
                    </button>
                    {editing && (
                        <button type="button" className="btn-cancel" onClick={() => { setEditing(null); setForm({ text: "", isActive: true }); }}>
                            Hủy
                        </button>
                    )}
                </form>
                <div className="quick-reply-list">
                    {quickReplies.map((qr) => (
                        <div key={qr._id} className={`quick-reply-item ${!qr.isActive ? "inactive" : ""}`}>
                            <span className="quick-reply-text">{qr.text}</span>
                            <div className="quick-reply-actions">
                                <button type="button" onClick={() => toggleActive(qr)}>
                                    {qr.isActive ? "Tắt" : "Bật"}
                                </button>
                                <button type="button" onClick={() => handleEdit(qr)}>Sửa</button>
                                <button type="button" className="btn-delete" onClick={() => handleDelete(qr._id)}>Xóa</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickReplyModal;
