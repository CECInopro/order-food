import React from "react";
import { useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { StoreContext } from "../../contexts/StoreContext";


const Navbar = ({ setShowLogin }) => {

    const [menu, setMenu] = useState("home");
    const { getTotalCartAmount, token, setToken } = useContext(StoreContext);

    const navigate = useNavigate();
    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        navigate("/");
    }

    return (
        <div className="navbar">
            <Link to="/"><img src={assets.logo} alt="" className="logo" /></Link>
            <ul className="navbar-menu">
                <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>Home</Link>
                <Link to='/vouchers' onClick={() => setMenu("vouchers")} className={menu === "vouchers" ? "active" : ""}>Ưu đãi</Link>
                <a href="#explore-menu" onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>Menu</a>
                <a href="#footer" onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>Contact-us</a>
            </ul>
            <div className="navbar-right">
                <img src={assets.search_icon} alt="" className="search" />
                <div className="navbar-search-icon">
                    <div className="">
                        <Link to="/cart"><img src={assets.basket_icon} alt="" /></Link>
                        <div className={getTotalCartAmount() > 0 ? "dot" : ""}></div>
                    </div>
                </div>
                {!token ? <button onClick={() => setShowLogin(true)} className="login-btn">sign in</button>
                    : <div className="navbar_profile">
                        <img src={assets.profile_icon}></img>
                        <ul className="navbar_profile_dropdown">
                            <li onClick={() => navigate('/myorders')}><img src={assets.bag_icon} /><p>Orders</p></li>
                            <li onClick={() => navigate('/vouchers')}><img src={assets.bag_icon} /><p>Voucher</p></li>
                            <hr />
                            <li><img src={assets.logout_icon} /><p onClick={logout}>Logout</p></li>
                        </ul>
                    </div>
                }
            </div>
        </div>
    );
}

export default Navbar;
