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
        </Routes>

      </div>
      <Footer />
    </>
  )
}

export default App
