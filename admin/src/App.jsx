import React from 'react'
import './index.css'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Route, Routes } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Promotions from './pages/Promotions/Promotions'
import Chat from './pages/Chat/Chat'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  const url = "http://localhost:4000";
  return (
    <div>
      <ToastContainer></ToastContainer>
      <Navbar />
      <hr />
      <div className="app_content">
        <Sidebar />
        <Routes>
          <Route path='/add' element={<Add url={url} />} />
          <Route path='/list' element={<List url={url} />} />
          <Route path='/orders' element={<Orders url={url} />} />
          <Route path='/promotions' element={<Promotions url={url} />} />
          <Route path='/chat' element={<Chat url={url} />} />
        </Routes>
      </div>

    </div>
  )
}

export default App
