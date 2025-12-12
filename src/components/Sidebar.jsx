import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBackendData } from '../hooks/useBackendData';
import { useAuth } from '../hooks/useAuth';

function Sidebar({ isOpen, closeSidebar }) {
    const location = useLocation();
    const currentPath = location.pathname + location.search;
    const { neighborhoods, isLoading } = useBackendData();
    const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();

    const isActive = (path) => {
        return currentPath === path ? 'active' : '';
    };

    const isNavActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const handleLogout = async () => {
        await logout();
        closeSidebar();
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header-mobile">
                <span className="sidebar-logo">SGMakan</span>
                <button className="close-sidebar-btn" onClick={closeSidebar}>×</button>
            </div>

            {/* Mobile Navigation */}
            <nav className="sidebar-nav-section">
                <Link to="/" className={`sidebar-nav-link ${isNavActive('/')}`} onClick={closeSidebar}>
                    🏠 Home
                </Link>
                <Link to="/explore" className={`sidebar-nav-link ${isNavActive('/explore')}`} onClick={closeSidebar}>
                    ☕ All Cafes
                </Link>
                <Link to="/about" className={`sidebar-nav-link ${isNavActive('/about')}`} onClick={closeSidebar}>
                    ℹ️ About
                </Link>
            </nav>

            <div className="sidebar-section">
                <h4 className="sidebar-title">LIBRARY</h4>
                <ul className="sidebar-list">
                    <li>
                        <Link 
                            to="/explore?status=favorite" 
                            className={`sidebar-link ${isActive('/explore?status=favorite')}`}
                            onClick={closeSidebar}
                        >
                            <span className="icon">★</span> Favorites
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/explore?status=want-to-go" 
                            className={`sidebar-link ${isActive('/explore?status=want-to-go')}`}
                            onClick={closeSidebar}
                        >
                            <span className="icon">☐</span> To Visit
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
                            <span className="icon">📂</span> All Cafes
                        </Link>
                    </li>
                    {isLoading ? (
                        <li className="sidebar-link">Loading areas...</li>
                    ) : (
                        neighborhoods.map((neighborhood) => (
                            <li key={neighborhood.id}>
                                <Link 
                                    to={`/explore?area=${neighborhood.id}`} 
                                    className={`sidebar-link ${isActive(`/explore?area=${neighborhood.id}`)}`}
                                    onClick={closeSidebar}
                                >
                                    <span className="icon">{neighborhood.icon}</span> {neighborhood.name}
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Mobile Auth Section */}
            <div className="sidebar-auth-section">
                {authLoading ? (
                    <span className="sidebar-user-info">Loading...</span>
                ) : isAuthenticated ? (
                    <>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-email">{user?.email}</span>
                            <button onClick={handleLogout} className="sidebar-logout-btn">
                                Sign out
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="sidebar-auth-btn secondary" onClick={closeSidebar}>
                            Login
                        </Link>
                        <Link to="/signup" className="sidebar-auth-btn primary" onClick={closeSidebar}>
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
