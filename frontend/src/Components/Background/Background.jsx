import React from 'react';
import './Background.css';
import boat1 from '../../Components/Assets/boat1.jpg';
import boat2 from '../../Components/Assets/boat2.jpg';
import boat3 from '../../Components/Assets/boat3.jpg';
import boatp from '../../Components/Assets/boatp.jpg';
const Background = ({ heroCount }) => {
    if (heroCount === 0) {
        return <img src={boat1} className='background' alt='' />;
    } else if (heroCount === 1) {
        return <img src={boat2} className='background' alt='' />;
    } else if (heroCount === 2) {
        return <img src={boat3} className='background' alt='' />;
    } else if (heroCount === 4) {
        return <img src={boatp} className='background' alt='' />;
    } 
}

export default Background;