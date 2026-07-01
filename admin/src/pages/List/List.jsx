import React, { useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import './List.css'
import axios from 'axios'
import { toast } from 'react-toastify';

const List = ({ url }) => {

  const [list, setList] = useState([]);

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    console.log(response.data);

    if (response.data.success) {
      setList(response.data.data);
    } else {
      console.log(response.data.message);
      toast.error(response.data.message);
    }
  }

  useEffect(() => {
    fetchList();
  }, [])

  const removeFood = async (foodId) => {
    const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message);
    }
    else {
      toast.error(response.data.message);
    }
  }

  return (
    <div className='list add flex_col'>
      <p>All Foods List</p>

      <div className="list_table">

        <div className='list_table_format title'>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>

        {list.map((item, index) => {
          return (
            <div key={index} className='list_table_format'>
              <img src={item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>${item.price}</p>
              <p className='cursor' onClick={() => removeFood(item._id)}>X</p>
            </div>
          )
        })}

      </div>
    </div>
  )
}

export default List