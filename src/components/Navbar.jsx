import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ toggleSidebar }) {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
                    <span className="hamburger"></span>
                </button>
                <div className="navbar-logo">
                    <Link to="/" className="navbar-brand">
                        <img src={`${process.env.PUBLIC_URL}/logo-sgmakan.png`} alt="SGMakan" className="navbar-logo-img" />
                    </Link>
                </div>
            </div>
            <div className="navbar-nav">
                <ul className="navbar-links">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/explore">All Cafes</Link></li>
                    <li><Link to="/about">About</Link></li>
                </ul>
                <div className="navbar-auth">
                    <Link to="/login" className="btn-login-secondary">Login</Link>
                    <Link to="/signup" className="btn-signup">Sign Up</Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
