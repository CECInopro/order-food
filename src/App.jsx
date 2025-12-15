import React from 'react'
import Navbar from './component/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './page/Home.jsx/Home.jsx'
import Cart from './page/Cart.jsx/Cart.jsx'
import PlaceOrder from './page/PlaceOrder/PlaceOrder.jsx'
import './index.css'

const App = () => {
  return (
    <div className='app'>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/place-order' element={<PlaceOrder />} />
      </Routes>

    </div>
  )
}

export default App
