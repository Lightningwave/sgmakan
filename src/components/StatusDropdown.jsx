import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const STATUS_OPTIONS = [
    { value: 'Want to go', label: 'To Visit' },
    { value: 'Visited', label: 'Visited' },
    { value: 'Favorite', label: 'Favorite' },
];

function StatusDropdown({ cafeId, userStatus, onStatusChange, variant }) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const displayStatus = userStatus || 'Want to go';
    const currentOpt = STATUS_OPTIONS.find(o => o.value === displayStatus);

    // Close on outside click
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

    const handleToggle = (e) => {
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
        if (onStatusChange && cafeId) {
            await onStatusChange(cafeId, value);
        }
    };

    return (
        <div className={`card-status-wrapper ${variant || ''}`} ref={menuRef}>
            <button
                className={`card-status-trigger ${displayStatus.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={handleToggle}
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
    );
}

export { STATUS_OPTIONS };
export default StatusDropdown;
