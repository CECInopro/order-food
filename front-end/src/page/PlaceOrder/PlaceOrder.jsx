import React, { useEffect, useState } from 'react'
import './PlaceOrder.css'
import { useContext } from 'react'
import { StoreContext } from '../../contexts/StoreContext'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PlaceOrder = () => {

    const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);
    const navigate = useNavigate();

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
            amount: getTotalCartAmount() + 2,
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
            alert("Error")
        }
    }


    useEffect(() => {
        if (!token) {
            navigate('/cart')
        }
        else if (getTotalCartAmount === 0) {
            navigate('/cart')
        }
    }, [token])




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
                        <div className='cart_total_details'>
                            <p>Subtotal</p>
                            <p>{getTotalCartAmount()}$</p>
                        </div>
                        <hr />
                        <div className='cart_total_details'>
                            <p>Delivery Fee</p>
                            <p>{getTotalCartAmount() === 0 ? 0 : 2}$</p>
                        </div>
                        <hr />
                        <div className='cart_total_details'>
                            <b>Total</b>
                            <b>{getTotalCartAmount() + (getTotalCartAmount() === 0 ? 0 : 2)}$</b>
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
