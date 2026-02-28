import React from "react";
import { useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { StoreContext } from "../../contexts/StoreContext";


const Navbar = ({ setShowLogin }) => {

    const [menu, setMenu] = useState("home");
    const { getTotalCartAmount } = useContext(StoreContext);

    return (
        <div className="navbar">
            <Link to="/"><img src={assets.logo} alt="" className="logo" /></Link>
            <ul className="navbar-menu">
                <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>Home</Link>
                <a href="#explore-menu" onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>Menu</a>
                <a href="#footer " onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>Contact-us</a>
            </ul>
            <div className="navbar-right">
                <img src={assets.search_icon} alt="" className="search" />
                <div className="navbar-search-icon">
                    <div className="">
                        <Link to="/cart"><img src={assets.basket_icon} alt="" /></Link>
                        <div className={getTotalCartAmount() > 0 ? "dot" : ""}></div>
                    </div>
                </div>
                <button onClick={() => setShowLogin(true)} className="login-btn">Login</button>
            </div>
        </div>
    );
}

export default Navbar;
