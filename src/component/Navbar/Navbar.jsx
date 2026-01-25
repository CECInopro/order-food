import React from "react";
import { useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";


const Navbar = () => {

    const [menu, setMenu] = useState("home");

    return (
        <div className="navbar">
            <img src={assets.logo} alt="" className="logo" />
            <ul className="navbar-menu">
                <li onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>Home</li>
                <li onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>Menu</li>
                <li onClick={() => setMenu("mobile-app")} className={menu === "mobile-app" ? "active" : ""}>mobile-app</li>
                <li onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>contact-us</li>
            </ul>
            <div className="navbar-right">
                <img src={assets.search_icon} alt="" className="search" />
                <div className="navbar-search-icon">
                    <div className="">
                        <img src={assets.basket_icon} alt="" />
                        <div className="dot"></div>
                    </div>
                </div>
                <button className="login-btn">Login</button>
            </div>
        </div>
    );
}

export default Navbar;
