import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
    return (
        <div className='footer' id='footer'>
            <div className="footer-content">
                <div className='footer-content-left'>
                    <img src={assets.logo} alt="" />
                    <p>© 2024 Foodie. All rights reserved.</p>
                    <div className='footer-social-icons'>
                        <img src={assets.facebook_icon} alt="facebook icon" />
                        <img src={assets.twitter_icon} alt="twitter icon" />
                        <img src={assets.linkedin_icon} alt="linkedin icon" />
                    </div>
                </div>
                <div className='footer-content-center'>
                    <h2>COMPANY</h2>
                    <ul>
                        <li>Home</li>
                        <li>About Us</li>
                        <li>Delivery</li>
                        <li>Privacy policy</li>
                    </ul>
                </div>
                <div className="footer-content-right">
                    <h2>CONTACT</h2>
                    <ul>
                        <li>0399882816</li>
                        <li>dtc@gmail.com</li>
                    </ul>
                </div>

            </div>
            <hr></hr>
            <p className="footer-copyright">© 2024 Foodie. All rights reserved.</p>
        </div>
    )
}

export default Footer
