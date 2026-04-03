import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import { StoreContext } from '../../contexts/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';

const MyOrders = () => {

    const { url, token } = useContext(StoreContext);
    const [data, setData] = useState([]);

    const fetchOrders = async () => {
        const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
        setData(response.data.data);
        console.log(response.data)
        console.log(response.data.data);

    }

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token])

    return (
        <div className='my_orders'>
            <h2>My Orders</h2>
            <div className="container">
                {data.map((order, index) => {
                    return (
                        <div key={index} className="my_orders_order">
                            <img src={assets.parcel_icon} alt=''></img>
                            <p>{order.items.map((item, index) => {
                                if (index === order.items.length - 1) {
                                    return item.name + " x " + item.quantity;
                                }
                                else {
                                    return item.name + " x " + item.quantity + ",";
                                }
                            })}</p>
                            <p>
                                ${typeof order.amount === "number" ? order.amount.toFixed(2) : order.amount}
                                {order.promoCode ? (
                                    <span className="my_orders_promo"> · KM: {order.promoCode}</span>
                                ) : null}
                            </p>
                            <p>Items: {order.items.length}</p>
                            <p><span>&#x25cf;</span><b>{order.status}</b></p>
                            <button onClick={(e) => fetchOrders()}>Track Order</button>

                        </div>
                    )
                })}
            </div>

        </div>
    )
}

export default MyOrders
