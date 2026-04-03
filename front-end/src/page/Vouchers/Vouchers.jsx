import React, { useCallback, useContext, useEffect, useState } from "react";
import "./Vouchers.css";
import { StoreContext } from "../../contexts/StoreContext";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const formatPromo = (type, value) => (type === "percent" ? `Giảm ${value}%` : `Giảm $${value}`);

const Vouchers = () => {
    const { url, token } = useContext(StoreContext);
    const navigate = useNavigate();
    const [shop, setShop] = useState([]);
    const [wallet, setWallet] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(null);

    const fetchShop = useCallback(async () => {
        const res = await axios.get(`${url}/api/promotion/shop`, {
            headers: token ? { token } : {},
        });
        if (res.data.success) setShop(res.data.data || []);
    }, [url, token]);

    const fetchWallet = useCallback(async () => {
        if (!token) {
            setWallet([]);
            return;
        }
        const res = await axios.post(`${url}/api/promotion/mine`, {}, { headers: { token } });
        if (res.data.success) setWallet(res.data.data || []);
    }, [url, token]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([fetchShop(), fetchWallet()]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [fetchShop, fetchWallet]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const claim = async (promotionId) => {
        if (!token) {
            navigate("/");
            return;
        }
        setClaiming(promotionId);
        try {
            const res = await axios.post(`${url}/api/promotion/claim`, { promotionId }, { headers: { token } });
            if (res.data.success) {
                await Promise.all([fetchShop(), fetchWallet()]);
            } else {
                alert(res.data.message || "Không nhận được voucher");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi mạng hoặc chưa đăng nhập");
        } finally {
            setClaiming(null);
        }
    };

    return (
        <div className="vouchers-page">
            <div className="vouchers-header">
                <h1>Săn ưu đãi</h1>
                <p>Chọn voucher giống Shopee — nhận về ví rồi dùng khi đặt món.</p>
                {!token && (
                    <p className="vouchers-hint">
                        <button type="button" className="vouchers-link-btn" onClick={() => navigate("/")}>
                            Đăng nhập
                        </button>{" "}
                        để nhận voucher và xem ví của bạn.
                    </p>
                )}
            </div>

            {loading ? (
                <p className="vouchers-loading">Đang tải...</p>
            ) : (
                <>
                    <section className="vouchers-section">
                        <h2>Voucher đang mở</h2>
                        <div className="vouchers-grid">
                            {shop.length === 0 ? (
                                <p>Chưa có khuyến mãi nào. Quay lại sau nhé.</p>
                            ) : (
                                shop.map((p) => (
                                    <article key={p._id} className={`voucher-card ${!p.eligible ? "disabled" : ""}`}>
                                        <div className="voucher-card-main">
                                            <span className="voucher-badge">{formatPromo(p.type, p.value)}</span>
                                            <h3>{p.title}</h3>
                                            <p className="voucher-code">Mã: {p.code}</p>
                                            <p className="voucher-meta">
                                                Đơn từ ${p.minOrderAmount}
                                                {p.expiresAt
                                                    ? ` · HSD ${new Date(p.expiresAt).toLocaleString()}`
                                                    : ""}
                                            </p>
                                            {!p.eligible && (
                                                <p className="voucher-note">Đã hết hạn hoặc hết lượt toàn hệ thống</p>
                                            )}
                                            {token && p.hasInWallet && (
                                                <p className="voucher-note success">Đã có trong ví</p>
                                            )}
                                        </div>
                                        <div className="voucher-card-actions">
                                            {token ? (
                                                <button
                                                    type="button"
                                                    className="voucher-claim"
                                                    disabled={!p.canClaim || claiming === p._id}
                                                    onClick={() => claim(p._id)}
                                                >
                                                    {p.hasInWallet && !p.canClaim
                                                        ? "Đã nhận"
                                                        : claiming === p._id
                                                          ? "..."
                                                          : p.canClaim
                                                            ? "Nhận"
                                                            : p.hasInWallet
                                                              ? "Đã có"
                                                              : !p.eligible
                                                                ? "Hết"
                                                                : "Không nhận được"}
                                                </button>
                                            ) : (
                                                <span className="voucher-guest">Đăng nhập để nhận</span>
                                            )}
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="vouchers-section">
                        <h2>Ví voucher của tôi</h2>
                        {!token ? (
                            <p>Bạn chưa đăng nhập.</p>
                        ) : wallet.length === 0 ? (
                            <p>Ví đang trống — hãy “Nhận” ở phần trên.</p>
                        ) : (
                            <ul className="vouchers-wallet">
                                {wallet.map((v) => (
                                    <li key={v._id}>
                                        <div>
                                            <strong>{v.title}</strong>
                                            <span className="voucher-wallet-code">{v.code}</span>
                                            <span className="voucher-wallet-detail">
                                                {formatPromo(v.type, v.value)} · đơn từ ${v.minOrderAmount}
                                            </span>
                                        </div>
                                        <Link to="/cart" className="vouchers-use-link">
                                            Dùng khi đặt hàng →
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default Vouchers;
