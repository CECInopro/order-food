import React from 'react'
import { useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import './Add.css'
import axios from 'axios'
import { toast } from 'react-toastify';

const Add = ({ url }) => {

    const [image, setImage] = useState(false);
    const [data, setData] = useState({
        name: '',
        description: '',
        category: 'Salad',
        price: ''
    });

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({
            ...data, [name]: value
        }))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('image', image);
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('category', data.category);
        formData.append('price', data.price);
        console.log(formData);
        const response = await axios.post(`${url}/api/food/add`, formData);
        if (response.data.success) {
            setData({
                name: '',
                description: '',
                category: 'Salad',
                price: ''
            })
            setImage(false);
            toast.success('Food added successfully');
        }
        else {
            console.log(response.data.message);
            toast.error(response.data.message);
        }
    }


    return (
        <div className='add'>
            <form className='flex_col' onSubmit={onSubmitHandler}>
                <div className="add_img_upload flex_col">
                    <p>Upload Image</p>
                    <label htmlFor="image">
                        <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="Upload Image" />
                    </label>
                    <input onChange={(e) => setImage(e.target.files[0])} type="file" id='image' required />
                </div>
                <div className="add_product_name flex_col">
                    <p>Product Name</p>
                    <input onChange={onChangeHandler} type="text" name='name' placeholder='Type here' required />
                </div>
                <div className="add_product_description flex_col">
                    <p>Product Description</p>
                    <textarea onChange={onChangeHandler} name='description' rows="6" placeholder='Type here' required />
                </div>
                <div className="add_category_price">
                    <div className="add_category">
                        <p>Product</p>
                        <select onChange={onChangeHandler} name="category">
                            <option value="Salad">Salad</option>
                            <option value="Rolls">Rolls</option>
                            <option value="Desserts">Desserts</option>
                            <option value="Sandwich">Sandwich</option>
                            <option value="Cake">Cake</option>
                            <option value="Pure Veg">Pure Veg</option>
                            <option value="Pasta">Pasta</option>
                            <option value="Noodles">Noodles</option>
                        </select>
                    </div>
                    <div className="add_price">
                        <p>Price</p>
                        <input onChange={onChangeHandler} type="number" name="price" placeholder='0' required />
                    </div>
                </div>
                <button type='submit' className='add_btn'>Add Product</button>
            </form>

        </div>
    )
}

export default Add
