import React, { useState } from 'react'
import './Home.css'
import Headers from '../../component/Header/Header.jsx'
import ExploreMenu from '../../component/ExploreMenu/ExploreMenu.jsx'
import FoodDisplay from '../../component/FoodDisplay/FoodDisplay.jsx'
const Home = () => {

    const [category, setCategory] = useState('All')
    return (
        <div>
            <Headers />
            <ExploreMenu category={category} setCategory={setCategory} />
            <FoodDisplay category={category} />

        </div>
    )
}

export default Home
