import React, { useState, useEffect } from "react";
import "./Promotions.css";
import "../List/List.css";
import axios from "axios";
import { toast } from "react-toastify";

const Promotions = ({ url }) => {
    const [list, setList] = useState([]);
    const [data, setData] = useState({
        code: "",
        title: "",
        type: "percent",
        value: "",
        minOrderAmount: "0",
        expiresAt: "",
        maxUses: "",
        maxClaimsPerUser: "1",
        showInShop: true,
        active: true,
    });

    const fetchList = async () => {
        const response = await axios.get(`${url}/api/promotion/list`);
        if (response.data.success) {
            setList(response.data.data);
        } else {
            toast.error(response.data.message || "Không tải được danh sách");
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData((d) => ({
            ...d,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            code: data.code,
            title: data.title,
            type: data.type,
            value: Number(data.value),
            minOrderAmount: Number(data.minOrderAmount || 0),
            expiresAt: data.expiresAt || null,
            maxUses: data.maxUses === "" ? null : Number(data.maxUses),
            maxClaimsPerUser: data.maxClaimsPerUser === "" ? 1 : Number(data.maxClaimsPerUser),
            showInShop: data.showInShop,
            active: data.active,
        };

        const response = await axios.post(`${url}/api/promotion/add`, payload);
        if (response.data.success) {
            toast.success("Tạo khuyến mãi thành công");
            setData({
                code: "",
                title: "",
                type: "percent",
                value: "",
                minOrderAmount: "0",
                expiresAt: "",
                maxUses: "",
                maxClaimsPerUser: "1",
                showInShop: true,
                active: true,
            });
            await fetchList();
        } else {
            toast.error(response.data.message || "Lỗi");
        }
    };

    const remove = async (id) => {
        const response = await axios.post(`${url}/api/promotion/remove`, { id });
        if (response.data.success) {
            toast.success("Đã xóa");
            await fetchList();
        } else {
            toast.error(response.data.message || "Lỗi");
        }
    };

    const formatPromo = (p) => {
        if (p.type === "percent") return `${p.value}%`;
        return `$${p.value}`;
    };

    return (
        <div className="promotions-page add flex_col">
            <p className="promotions-title">Khuyến mãi (mã giảm giá)</p>

            <form className="promotions-form flex_col" onSubmit={onSubmit}>
                <div className="promo-row">
                    <label>
                        Mã (ví dụ: SALE10)
                        <input
                            name="code"
                            value={data.code}
                            onChange={onChange}
                            placeholder="SALE10"
                            required
                        />
                    </label>
                    <label>
                        Tiêu đề hiển thị (Săn voucher)
                        <input
                            name="title"
                            value={data.title}
                            onChange={onChange}
                            placeholder="Giảm 10% đơn đầu"
                        />
                    </label>
                </div>
                <div className="promo-row">
                    <label>
                        Loại
                        <select name="type" value={data.type} onChange={onChange}>
                            <option value="percent">Giảm theo %</option>
                            <option value="fixed">Giảm số tiền ($)</option>
                        </select>
                    </label>
                    <label>
                        Số voucher tối đa trong ví / user
                        <input
                            name="maxClaimsPerUser"
                            type="number"
                            min="1"
                            value={data.maxClaimsPerUser}
                            onChange={onChange}
                        />
                    </label>
                </div>
                <div className="promo-row">
                    <label>
                        Giá trị {data.type === "percent" ? "(%)" : "($)"}
                        <input
                            name="value"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.value}
                            onChange={onChange}
                            required
                        />
                    </label>
                    <label>
                        Đơn tối thiểu ($)
                        <input
                            name="minOrderAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.minOrderAmount}
                            onChange={onChange}
                        />
                    </label>
                </div>
                <div className="promo-row">
                    <label>
                        Hết hạn (để trống = không hết hạn)
                        <input name="expiresAt" type="datetime-local" value={data.expiresAt} onChange={onChange} />
                    </label>
                    <label>
                        Giới hạn lượt dùng (để trống = không giới hạn)
                        <input
                            name="maxUses"
                            type="number"
                            min="1"
                            value={data.maxUses}
                            onChange={onChange}
                        />
                    </label>
                </div>
                <label className="promo-active">
                    <input name="showInShop" type="checkbox" checked={data.showInShop} onChange={onChange} />
                    Hiện trang “Săn voucher” (customer)
                </label>
                <label className="promo-active">
                    <input name="active" type="checkbox" checked={data.active} onChange={onChange} />
                    Đang bật
                </label>
                <button type="submit" className="add_btn">
                    Tạo mã
                </button>
            </form>

            <p className="promotions-subtitle">Danh sách mã</p>
            <div className="list_table">
                <div className="list_table_format title promo-grid-wide">
                    <b>Mã</b>
                    <b>Shop</b>
                    <b>Loại / Giá trị</b>
                    <b>Đơn tối thiểu</b>
                    <b>Lượt dùng</b>
                    <b>Trạng thái</b>
                    <b>Xóa</b>
                </div>
                {list.map((p) => (
                    <div key={p._id} className="list_table_format promo-grid-wide">
                        <p>{p.code}</p>
                        <p>{p.showInShop === false ? "Ẩn" : "Hiện"}</p>
                        <p>
                            {p.type === "percent" ? "%" : "$"} · {formatPromo(p)}
                        </p>
                        <p>${p.minOrderAmount}</p>
                        <p>
                            {p.usedCount}
                            {p.maxUses != null ? ` / ${p.maxUses}` : ""}
                        </p>
                        <p>{p.active ? "Bật" : "Tắt"}</p>
                        <p className="cursor" onClick={() => remove(p._id)}>
                            X
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Promotions;
