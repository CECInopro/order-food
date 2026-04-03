import React, { useCallback, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { useContext } from 'react'
import { StoreContext } from '../../contexts/StoreContext'
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PlaceOrder = () => {

    const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);
    const navigate = useNavigate();

    const subtotal = getTotalCartAmount();
    const deliveryFee = subtotal === 0 ? 0 : 2;

    const [walletVouchers, setWalletVouchers] = useState([]);
    const [walletSelect, setWalletSelect] = useState("");

    const [promoInput, setPromoInput] = useState("");
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoLoading, setPromoLoading] = useState(false);

    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
        phone: "",
    })

    const onChangeHandle = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({
            ...data, [name]: value
        }))
    }

    const loadWallet = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.post(`${url}/api/promotion/mine`, {}, { headers: { token } });
            if (res.data.success) setWalletVouchers(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    }, [url, token]);

    useEffect(() => {
        loadWallet();
    }, [loadWallet]);

    const applyPromo = async () => {
        if (!promoInput.trim()) {
            alert("Nhập mã khuyến mãi");
            return;
        }
        setPromoLoading(true);
        try {
            const res = await axios.post(`${url}/api/promotion/validate`, {
                code: promoInput.trim(),
                subtotal,
            });
            if (res.data.success) {
                setWalletSelect("");
                setAppliedPromo({ code: res.data.code, discount: res.data.discount, userVoucherId: null });
            } else {
                alert(res.data.message || "Mã không hợp lệ");
                setAppliedPromo(null);
            }
        } catch (e) {
            console.error(e);
            alert("Không kiểm tra được mã, thử lại sau");
            setAppliedPromo(null);
        } finally {
            setPromoLoading(false);
        }
    };

    const onSelectWalletVoucher = async (voucherId) => {
        setWalletSelect(voucherId);
        if (!voucherId) {
            setAppliedPromo(null);
            return;
        }
        setPromoInput("");
        setPromoLoading(true);
        try {
            const res = await axios.post(
                `${url}/api/promotion/validate-wallet`,
                { userVoucherId: voucherId, subtotal },
                { headers: { token } }
            );
            if (res.data.success) {
                setAppliedPromo({
                    code: res.data.code,
                    discount: res.data.discount,
                    userVoucherId: res.data.userVoucherId || voucherId,
                });
            } else {
                alert(res.data.message || "Voucher không áp dụng được cho giỏ hiện tại");
                setAppliedPromo(null);
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kiểm tra voucher");
            setAppliedPromo(null);
        } finally {
            setPromoLoading(false);
        }
    };

    const clearPromo = () => {
        setAppliedPromo(null);
        setPromoInput("");
        setWalletSelect("");
    };

    const discount = appliedPromo ? appliedPromo.discount : 0;
    const total = Math.max(0, subtotal - discount) + deliveryFee;

    const placeOrder = async (event) => {
        event.preventDefault();
        let orderItems = [];
        food_list.map((item) => {
            if (cartItems[item._id] > 0) {
                let itemInfo = { ...item };
                itemInfo.quantity = cartItems[item._id];
                orderItems.push(itemInfo);
            }
        })
        console.log(orderItems);
        let orderData = {
            address: data,
            items: orderItems,
            promoCode: appliedPromo && !appliedPromo.userVoucherId ? appliedPromo.code : "",
            userVoucherId: appliedPromo && appliedPromo.userVoucherId ? appliedPromo.userVoucherId : "",
        }
        let response = await axios.post(
            url + "/api/order/place",
            orderData,
            { headers: { token } }
        );
        if (response.data.success) {
            const { session_url } = response.data
            window.location.replace(session_url);
        }
        else {
            alert(response.data.message || "Error")
        }
    }


    useEffect(() => {
        if (!token) {
            navigate('/cart')
        }
        else if (getTotalCartAmount() === 0) {
            navigate('/cart')
        }
    }, [token, navigate])




    return (
        <form onSubmit={placeOrder} className="place-order">
            <div className="place-order-left">
                <p className="title">Delivery Information</p>
                <div className='multi-fields'>
                    <input name='firstName' onChange={onChangeHandle} value={data.firstName} type="text" placeholder='First Name' required />
                    <input name='lastName' onChange={onChangeHandle} value={data.lastName} type="text" placeholder='Last Name' required />
                </div>
                <input name='email' onChange={onChangeHandle} value={data.email} type="email" placeholder='Email Address' required />
                <input onChange={onChangeHandle} name='street' value={data.street} type="text" placeholder='Street' required />
                <div className='multi-fields'>
                    <input onChange={onChangeHandle} name='city' value={data.city} type="text" placeholder='City' required />
                    <input onChange={onChangeHandle} name='state' value={data.state} type="text" placeholder='State' required />
                </div>
                <div className='multi-fields'>
                    <input onChange={onChangeHandle} name='zipcode' value={data.zipcode} type="text" placeholder='Zip Code' required />
                    <input onChange={onChangeHandle} name='country' value={data.country} type="text" placeholder='Country' required />
                </div>
                <input onChange={onChangeHandle} name='phone' value={data.phone} type="text" placeholder='Phone Number' required />
            </div>
            <div className="place-order-right">
                <div className='cart_total'>
                    <h2>Cart Totals</h2>
                    <div>
                        <div className="place-order-promo">
                            <p className="place-order-promo-label">Voucher trong ví</p>
                            <select
                                className="place-order-wallet-select"
                                value={walletSelect}
                                onChange={(e) => onSelectWalletVoucher(e.target.value)}
                                disabled={!!(appliedPromo && !appliedPromo.userVoucherId) || promoLoading}
                            >
                                <option value="">-- Chọn voucher đã nhận --</option>
                                {walletVouchers.map((v) => (
                                    <option key={v._id} value={v._id}>
                                        {v.title} ({v.code})
                                    </option>
                                ))}
                            </select>
                            <p className="place-order-promo-shop">
                                <Link to="/vouchers">Săn thêm ưu đãi →</Link>
                            </p>

                            <p className="place-order-promo-label place-order-promo-label-second">Hoặc nhập mã</p>
                            <div className="place-order-promo-row">
                                <input
                                    type="text"
                                    value={promoInput}
                                    onChange={(e) => {
                                        setPromoInput(e.target.value);
                                        setWalletSelect("");
                                        if (appliedPromo?.userVoucherId) setAppliedPromo(null);
                                    }}
                                    placeholder="Nhập mã"
                                    disabled={!!appliedPromo}
                                />
                                {appliedPromo ? (
                                    <button type="button" className="place-order-promo-btn secondary" onClick={clearPromo}>
                                        Xóa
                                    </button>
                                ) : (
                                    <button type="button" className="place-order-promo-btn" onClick={applyPromo} disabled={promoLoading}>
                                        {promoLoading ? "..." : "Áp dụng"}
                                    </button>
                                )}
                            </div>
                            {appliedPromo && (
                                <p className="place-order-promo-applied">
                                    Đã áp dụng: <strong>{appliedPromo.code}</strong>
                                    {appliedPromo.userVoucherId ? " (từ ví)" : ""}
                                </p>
                            )}
                        </div>
                        <div className='cart_total_details'>
                            <p>Subtotal</p>
                            <p>{subtotal.toFixed(2)}$</p>
                        </div>
                        <hr />
                        {appliedPromo && (
                            <>
                                <div className='cart_total_details place-order-discount'>
                                    <p>Giảm giá</p>
                                    <p>-{discount.toFixed(2)}$</p>
                                </div>
                                <hr />
                            </>
                        )}
                        <div className='cart_total_details'>
                            <p>Delivery Fee</p>
                            <p>{deliveryFee}$</p>
                        </div>
                        <hr />
                        <div className='cart_total_details'>
                            <b>Total</b>
                            <b>{total.toFixed(2)}$</b>
                        </div>
                        <hr />
                        <button type='submit' >Proceed to payment</button>
                    </div>

                </div>
            </div>
        </form>
    )
}

export default PlaceOrder
