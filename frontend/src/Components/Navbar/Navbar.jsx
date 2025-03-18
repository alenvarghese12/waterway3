import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import boatlogo from '../../Components/Assets/boatlogo.png';

const Navbar = () => {
  return (
    <div className='nav'>
       <div className='nav-logo'>
        <img src={boatlogo} alt="WaterWay Logo" className='logo-image' /> {/* Logo Image */}
        <div className="water">WaterWay</div>
      </div>

        <ul className='nav-menu'>
            <li><Link to="/"><button className='button'>Home</button></Link></li>
            <li><Link to="/about"><button>About</button></Link></li>
            <li className='nav-login'>
                <Link to="/login">
                    <button className='login-button'>Login/Register</button>
                </Link>
            </li>
            <li className='nav-contact'><Link to="/contact"><button>Contact</button></Link></li>
        </ul>
    </div>
  );
};

export default Navbar;