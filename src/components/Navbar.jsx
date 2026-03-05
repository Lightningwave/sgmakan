import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar({ toggleSidebar }) {
    const { user, profile, signOut, isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!showDropdown) return;
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    const handleSignOut = async () => {
        setShowDropdown(false);
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Menu">
                    <span className="hamburger"></span>
                </button>
                <div className="navbar-logo">
                    <Link to="/" className="navbar-brand">
                        <img src="/logo-sgmakan.png" alt="SGMakan" className="navbar-logo-img" />
                    </Link>
                </div>
            </div>
            <div className="navbar-nav desktop-only">
                <ul className="navbar-links">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/explore">All Cafes</Link></li>
                    <li><Link to="/about">About</Link></li>
                </ul>
                <div className="navbar-auth">
                    {isAuthenticated ? (
                        <div className="user-menu" ref={dropdownRef}>
                            <button 
                                className="user-menu-button"
                                onClick={() => setShowDropdown(prev => !prev)}
                            >
                                <span className="user-avatar">
                                    {(profile?.username || user?.email)?.charAt(0).toUpperCase() || '?'}
                                </span>
                                <span className="user-email">{profile?.username || user?.email}</span>
                            </button>
                            {showDropdown && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <span className="dropdown-username">
                                            {profile?.username || 'User'}
                                            {isAdmin && <span className="admin-badge">Admin</span>}
                                        </span>
                                        <span className="dropdown-email">{user?.email}</span>
                                    </div>
                                    <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                        Edit Profile
                                    </Link>
                                    {isAdmin && (
                                        <Link to="/admin" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button onClick={handleSignOut} className="dropdown-item">
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="btn-login-secondary">Login</Link>
                            <Link to="/signup" className="btn-signup">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
