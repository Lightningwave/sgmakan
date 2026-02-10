import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchNeighborhoods } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Sidebar({ isOpen, closeSidebar }) {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname + location.search;
    const [neighborhoods, setNeighborhoods] = useState([]);
    const { user, signOut, isAuthenticated, isAdmin } = useAuth();

    useEffect(() => {
        let isMounted = true;
        
        async function loadNeighborhoods() {
            try {
                const data = await fetchNeighborhoods();
                if (isMounted) {
                    setNeighborhoods(data);
                }
            } catch (error) {
                console.error('Error loading neighborhoods:', error);
            }
        }
        loadNeighborhoods();
        
        return () => { isMounted = false; };
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            closeSidebar();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const isActive = (path) => {
        return currentPath === path ? 'active' : '';
    };

    const isNavActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header-mobile">
                <Link to="/" className="sidebar-logo" onClick={closeSidebar}>
                    <img src="/logo-sgmakan.png" alt="SGMakan" className="sidebar-logo-img" />
                </Link>
                <button className="close-sidebar-btn" onClick={closeSidebar}>×</button>
            </div>

            {/* Mobile Navigation - Only visible on mobile */}
            <div className="sidebar-section mobile-nav-section">
                <h4 className="sidebar-title">NAVIGATE</h4>
                <ul className="sidebar-list">
                    <li>
                        <Link 
                            to="/" 
                            className={`sidebar-link ${isNavActive('/')}`}
                            onClick={closeSidebar}
                        >
                            <span className="icon icon-svg" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            </span> Home
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/explore" 
                            className={`sidebar-link ${isNavActive('/explore')}`}
                            onClick={closeSidebar}
                        >
                            <span className="icon icon-svg" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                            </span> All Cafes
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/about" 
                            className={`sidebar-link ${isNavActive('/about')}`}
                            onClick={closeSidebar}
                        >
                            <span className="icon icon-svg" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            </span> About
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="sidebar-section">
                <h4 className="sidebar-title">LIBRARY</h4>
                <ul className="sidebar-list">
                    <li>
                        <Link 
                            to="/explore?status=favorite" 
                            className={`sidebar-link ${isActive('/explore?status=favorite')}`}
                            onClick={closeSidebar}
                        >
                            <span className="icon icon-svg" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </span> Favorites
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/explore?status=want-to-go" 
                            className={`sidebar-link ${isActive('/explore?status=want-to-go')}`}
                            onClick={closeSidebar}
                        >
                            <span className="icon icon-svg" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            </span> To Visit
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="sidebar-section">
                <h4 className="sidebar-title">NEIGHBORHOODS</h4>
                <ul className="sidebar-list">
                    <li>
                        <Link 
                            to="/explore?area=all" 
                            className={`sidebar-link ${isActive('/explore?area=all')}`}
                            onClick={closeSidebar}
                        >
                            <span className="icon icon-svg" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            </span> All Cafes
                        </Link>
                    </li>
                    {neighborhoods.map((neighborhood) => (
                        <li key={neighborhood.id}>
                            <Link 
                                to={`/explore?area=${neighborhood.id}`} 
                                className={`sidebar-link ${isActive(`/explore?area=${neighborhood.id}`)}`}
                                onClick={closeSidebar}
                            >
                                <span className="icon">{neighborhood.icon}</span> {neighborhood.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Mobile Auth Buttons - Only visible on mobile */}
            <div className="sidebar-section mobile-auth-section">
                {isAuthenticated ? (
                    <div className="sidebar-user-section">
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-avatar">
                                {user?.email?.charAt(0).toUpperCase() || '?'}
                            </span>
                            <span className="sidebar-user-email">{user?.email}</span>
                            {isAdmin && <span className="admin-badge">Admin</span>}
                        </div>
                        {isAdmin && (
                            <Link 
                                to="/admin" 
                                className="sidebar-auth-btn sidebar-admin"
                                onClick={closeSidebar}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                        <button onClick={handleSignOut} className="sidebar-auth-btn sidebar-logout">
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="sidebar-auth-buttons">
                        <Link to="/login" className="sidebar-auth-btn sidebar-login" onClick={closeSidebar}>
                            Login
                        </Link>
                        <Link to="/signup" className="sidebar-auth-btn sidebar-signup" onClick={closeSidebar}>
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
