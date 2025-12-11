import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBackendData } from '../hooks/useBackendData';

function Sidebar({ isOpen, closeSidebar }) {
    const location = useLocation();
    const currentPath = location.pathname + location.search;
    const { neighborhoods, isLoading } = useBackendData();

    const isActive = (path) => {
        return currentPath === path ? 'active' : '';
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header-mobile">
                <button className="close-sidebar-btn" onClick={closeSidebar}>×</button>
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
        </aside>
    );
}

export default Sidebar;
