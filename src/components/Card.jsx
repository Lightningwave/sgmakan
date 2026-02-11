import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const STATUS_OPTIONS = [
    { value: 'Want to go', label: 'To Visit' },
    { value: 'Visited', label: 'Visited' },
    { value: 'Favorite', label: 'Favorite' },
];

function Card({ id, cafe_id, title, location, rating, price, userStatus, mrt, vibe, tags, image, onStatusChange }) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Default to "Want to go" display when no user status
    const displayStatus = userStatus || 'Want to go';
    const currentOpt = STATUS_OPTIONS.find(o => o.value === displayStatus);

    // Close menu on outside click
    useEffect(() => {
        if (!showMenu) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMenu]);

    const handleStatusClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowMenu(prev => !prev);
    };

    const handleSelect = async (e, value) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        if (onStatusChange && cafe_id) {
            await onStatusChange(cafe_id, value);
        }
    };

    return (
        <Link to={`/place/${id}`} className="card-link">
            <div className="card">
                <div className="card-image">
                    {image ? <img src={image} alt={title} /> : <div className="image-placeholder"></div>}
                    <div className="card-overlay">
                        <span>View Details</span>
                    </div>
                </div>
                <div className="card-content">
                    <h3 className="card-title"><span className="icon">📄</span> {title}</h3>

                    <div className="card-properties">
                        {/* Status Property — dropdown */}
                        <div className="property-row" ref={menuRef}>
                            <span className="property-name">Status</span>
                            <div className="card-status-wrapper">
                                <button
                                    className={`card-status-trigger ${displayStatus.toLowerCase().replace(/\s+/g, '-')}`}
                                    onClick={handleStatusClick}
                                >
                                    {currentOpt?.label || 'To Visit'}
                                    <span className="card-status-chevron">▾</span>
                                </button>
                                {showMenu && (
                                    <div className="card-status-menu">
                                        {STATUS_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                className={`card-status-option ${displayStatus === opt.value ? 'selected' : ''}`}
                                                onClick={(e) => handleSelect(e, opt.value)}
                                            >
                                                {opt.label}
                                                {displayStatus === opt.value && <span className="check-mark">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Area Property */}
                        <div className="property-row">
                            <span className="property-name">Area</span>
                            <span className="property-value area-pill">{location}</span>
                        </div>

                        {/* Price Property */}
                        <div className="property-row">
                            <span className="property-name">Price</span>
                            <span className="property-value">{price}</span>
                        </div>

                        {/* Tags Property */}
                        <div className="property-row">
                            <span className="property-name">Tags</span>
                            <div className="tags-container">
                                {tags && tags.map((tag, index) => (
                                    <span key={index} className="tag-pill">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default Card;
