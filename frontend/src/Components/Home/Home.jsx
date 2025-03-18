// import React from 'react';
import Background from '../Background/Background';
import Navbar from '../Navbar/Navbar';
import React, { useState, useEffect } from 'react';

const Home = () => {
    const heroData = [
        { text1: "dive into", text2: "what you love" },
        { text1: "Indulge", text2: "your passions" },
        { text1: "give into", text2: "your passions" },
    ];

    const [heroCount, setHero] = useState(0);

    // Uncomment this useEffect if you want to cycle through heroData
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setHero((count) => (count === heroData.length - 1 ? 0 : count + 1));
    //     }, 3000);

    //     return () => clearInterval(interval);
    // }, []);

    return (
        <div>
            {/* Home page content */}
            <Background heroCount={heroCount} />
            {/* <Navbar /> */}
            {/* <h1>{heroData[heroCount].text1}</h1> */}
            {/* <h2>{heroData[heroCount].text2}</h2> */}
        </div>
    );
};

export default Home;



