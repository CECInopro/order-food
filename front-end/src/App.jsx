import React from 'react'
import Navbar from './component/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './page/Home.jsx/Home.jsx'
import Cart from './page/Cart.jsx/Cart.jsx'
import PlaceOrder from './page/PlaceOrder/PlaceOrder.jsx'
import './index.css'
import Footer from './component/Footer/Footer.jsx'
import LoginPopup from './component/LoginPopup/LoginPopup.jsx'
import { useState } from 'react'
import Verify from './page/Verify/Verify.jsx'
import MyOrders from './page/MyOrders/MyOrders.jsx'
import ForgotPassword from './page/ForgotPassword/ForgotPassword.jsx'
import ResetPassword from './page/ResetPassword/ResetPassword.jsx'
import Vouchers from './page/Vouchers/Vouchers.jsx'
import ChatBubble from './component/ChatBubble/ChatBubble.jsx'


const App = () => {

  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div className='app'>
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder />} />
          <Route path='/verify' element={<Verify />} />
          <Route path='/myorders' element={<MyOrders />} />
          <Route path='/vouchers' element={<Vouchers />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password' element={<ResetPassword />} />
        </Routes>

      </div>
      <Footer />
      <ChatBubble setShowLogin={setShowLogin} />
    </>
  )
}

export default App
