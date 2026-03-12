import React, { useEffect } from 'react'
import "./LoginPopup.css"
import { assets } from '../../assets/assets'
import { useState } from 'react'
import { StoreContext } from '../../contexts/StoreContext'
import { useContext } from 'react'
import axios from 'axios'

const LoginPopup = ({ setShowLogin }) => {
  const [currState, setCurrState] = useState("Sign up");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  })

  const { url, setToken } = useContext(StoreContext);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({
      ...data, [name]: value
    }))
  }

  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url;
    if (currState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    const response = await axios.post(newUrl, data);
    if (response.data.success) {
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
      setShowLogin(false);
    }
    else {
      console.log(response.data.message);
      alert(response.data.message);
    }
  }


  useEffect(() => {
    console.log(data);
  }, [data])

  return (
    <div className='login-popup'>
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
        </div>
        <div className="login-popup-inputs">
          {currState === "Login" ? <></> : <input onChange={onChangeHandler} type="text" name='name' value={data.name} placeholder='Full Name' required />}
          {/* <input type="text" placeholder='Username' required /> */}
          <input onChange={onChangeHandler} type="email" name='email' value={data.email} placeholder='Email' required />
          <input onChange={onChangeHandler} type="password" name='password' value={data.password} placeholder='Password' required />
        </div>
        <button type="submit">{currState === "Sign up" ? "Create Account" : "Login"}</button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>I agree to the terms & conditions</p>
        </div>
        {currState === "Login"
          ? <p>Create a new account? <span onClick={() => setCurrState("Sign up")}>Click here</span></p>
          : <p>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>}
        {/* <p>Create a new account? <span>Click here</span></p> */}
        {/* <p>Already have an account? <span>Login here</span></p> */}

      </form>
    </div>
  )
}

export default LoginPopup
