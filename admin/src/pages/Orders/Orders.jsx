import React from 'react'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useEffect } from 'react'
import { assets } from '../../assets/assets'
import './Orders.css'

const Orders = ({ url }) => {
    const [orders, setOrders] = useState([]);

    const fetchAllOrders = async () => {
        const response = await axios.get(url + "/api/order/list");
        if (response.data.success) {
            setOrders(response.data.data);
            console.log(response.data.data);

        }
        else {
            toast.error("Error")
        }
    }
    const statusHandle = async (event, orderId) => {
        console.log(event, orderId);
        const response = await axios.post(url + "/api/order/status", {
            orderId,
            status: event.target.value
        })
        if (response.data.success) {
            await fetchAllOrders();

        }
    }

    useEffect(() => {
        fetchAllOrders();
    }, [])
    return (
        <div className='order add'>
            <h3>Order Page</h3>
            <div className="order_list">
                {orders.map((order, index) => (
                    <div key={index} className="order_item">
                        <img src={assets.parcel_icon}></img>
                        <div>
                            <p className='order_item_food'>
                                {order.items.map((item) => {
                                    if (index === order.items.length - 1) {
                                        return item.name + " x " + item.quantity;
                                    }
                                    else {
                                        return item.name + " x " + item.quantity + ", ";
                                    }
                                })}
                            </p>
                            <p className='order_item_name'>{order.address.firstName + " " + order.address.lastName}</p>
                            <div className="order_item_address">
                                <p>{order.address.street}</p>
                                <p>{order.address.city + ", " + order.address.state + ", " + order.address.country}</p>
                            </div>
                            <p className='order_item_phone'>{order.address.phone}</p>
                        </div>
                        <p>Items : {order.items.length}</p>
                        <p>${order.amount}</p>
                        <select onChange={(e) => statusHandle(event, order._id)} value={order.status}>
                            <option value="Food Processing">Food Processing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                    </div>

                ))}
            </div>
        </div>
    )
}

export default Orders
