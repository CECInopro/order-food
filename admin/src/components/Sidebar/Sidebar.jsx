import React from 'react'
import "./Sidebar.css"
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="sidebar_options">
                <NavLink to='/add' className="sidebar_option">
                    <img src={assets.add_icon} alt="Add Item" />
                    <p>Add Items</p>
                </NavLink>
                <NavLink to='/list' className="sidebar_option">
                    <img src={assets.order_icon} alt="List Item" />
                    <p>List Items</p>
                </NavLink>
                <NavLink to='/orders' className="sidebar_option">
                    <img src={assets.order_icon} alt="Order Item" />
                    <p>Order Items</p>
                </NavLink>
                <NavLink to='/promotions' className="sidebar_option">
                    <img src={assets.order_icon} alt="Promotions" />
                    <p>Promotions</p>
                </NavLink>
                <NavLink to='/chat' className="sidebar_option">
                    <img src={assets.add_icon} alt="Chat" />
                    <p>Chat khách</p>
                </NavLink>
            </div>

        </div>
    )
}

export default Sidebar
