import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useCafeStatus from '../hooks/useCafeStatus';
import { useCafeById } from '../hooks/useBackendData';

function PlaceDetails() {
    const { id } = useParams();
    const { cafe, isLoading } = useCafeById(id);
    const { getCafeStatus, updateCafeStatus, getCafeNote, updateCafeNote } = useCafeStatus();
    
    // Local state for "unsaved" changes effect
    const [isSaved, setIsSaved] = useState(true);

    if (isLoading) {
        return <div className="place-details-error">Loading place...</div>;
    }

    if (!cafe) {
        return <div className="place-details-error">Place not found</div>;
    }

    const currentStatus = getCafeStatus(cafe.id, cafe.status);
    const currentNote = getCafeNote(cafe.id);

    const handleStatusChange = (e) => {
        updateCafeStatus(cafe.id, e.target.value);
    };

    const handleNoteChange = (e) => {
        updateCafeNote(cafe.id, e.target.value);
        setIsSaved(false);
    };

    const handleSave = () => {
        // In a real app, this would save to backend
        setIsSaved(true);
        // Simulate a toast or visual feedback
        const btn = document.querySelector('.btn-save-note');
        if(btn) {
            const originalText = btn.innerText;
            btn.innerText = 'Saved!';
            setTimeout(() => btn.innerText = originalText, 2000);
        }
    };
    
    // Function to handle opening Google Maps
    const openGoogleMaps = () => {
        // Use Google Maps Directions API to open navigation directly
        const destination = encodeURIComponent(`${cafe.title} ${cafe.location} Singapore`);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    };

    return (
        <div className="place-details-page">
            {/* Immersive Header */}
            <div className="place-hero" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${cafe.image})` }}>
                <Link to="/explore" className="back-link-hero">← Back to Explore</Link>
                <div className="place-hero-content">
                    <div className="place-badges">
                        <span className="place-badge-status">{currentStatus || 'To Visit'}</span>
                        <span className="place-badge-area">{cafe.location}</span>
                    </div>
                    <h1>{cafe.title}</h1>
                    <div className="place-hero-meta">
                        <span className="meta-item">★ {cafe.rating}</span>
                        <span className="meta-dot">•</span>
                        <span className="meta-item">{cafe.price}</span>
                        <span className="meta-dot">•</span>
                        <span className="meta-item">{cafe.vibe}</span>
                    </div>
                </div>
            </div>

            <div className="place-container">
                <div className="place-main">
                    {/* Key Info Cards */}
                    <div className="info-grid">
                        <div className="info-card">
                            <span className="info-icon">📍</span>
                            <div className="info-text">
                                <label>Location</label>
                                <p>{cafe.location}</p>
                            </div>
                        </div>
                        <div className="info-card">
                            <span className="info-icon">🚇</span>
                            <div className="info-text">
                                <label>Nearest MRT</label>
                                <p>{cafe.mrt || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="info-card">
                            <span className="info-icon">🏷️</span>
                            <div className="info-text">
                                <label>Vibe</label>
                                <p>{cafe.vibe}</p>
                            </div>
                        </div>
                    </div>

                    <div className="place-description-section">
                        <h3>About</h3>
                        <p className="place-description">{cafe.description}</p>
                        <div className="place-tags-list">
                            {cafe.tags.map((tag, index) => (
                                <span key={index} className="tag-pill">{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className="place-map-section" style={{ marginTop: '40px' }}>
                        <h3>Location</h3>
                        {/* We use a standard iframe embed which doesn't require an API key for simple place mode, 
                            but in production you should use the Google Maps Embed API with a key. 
                            For this demo, we'll use the output=embed format which is often permissible for testing.
                        */}
                        <div className="map-container" style={{ 
                            width: '100%', 
                            height: '350px', 
                            borderRadius: '8px', 
                            overflow: 'hidden',
                            marginTop: '16px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                             <iframe 
                                title={`Map of ${cafe.title}`}
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                style={{ border: 0 }}
                                loading="lazy" 
                                allowFullScreen
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${cafe.title} ${cafe.location} Singapore`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            >
                            </iframe>
                        </div>
                    </div>

                    <div className="place-actions">
                         <div className="status-control">
                            <label>Current Status:</label>
                            <select 
                                value={currentStatus} 
                                onChange={handleStatusChange}
                                className={`status-dropdown ${currentStatus ? currentStatus.toLowerCase().replace(/\s+/g, '-') : ''}`}
                            >
                                <option value="Want to go">Want to go</option>
                                <option value="Visited">Visited</option>
                                <option value="Favorite">Favorite</option>
                            </select>
                        </div>
                        <button className="btn-primary" onClick={openGoogleMaps}>Get Directions</button>
                    </div>
                </div>

                {/* Journal Sidebar */}
                <div className="place-sidebar">
                    <div className="journal-card">
                        <div className="journal-header">
                            <h3>My Journal</h3>
                            <span className="journal-icon">✏️</span>
                        </div>
                        <div className="journal-paper">
                            <textarea
                                className="journal-textarea"
                                placeholder="What did you order? How was the coffee? Would you come back?"
                                value={currentNote}
                                onChange={handleNoteChange}
                            />
                            <div className="journal-footer">
                                <span className="journal-date">{new Date().toLocaleDateString()}</span>
                                <button 
                                    className={`btn-save-note ${isSaved ? 'saved' : ''}`}
                                    onClick={handleSave}
                                >
                                    {isSaved ? 'Saved' : 'Save Note'}
                                </button>
                            </div>
                        </div>
                        <div className="journal-extras">
                            <label className="checkbox-container">
                                <input type="checkbox" defaultChecked={currentStatus === 'Favorite'} />
                                <span className="checkmark"></span>
                                Add to Favorites
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlaceDetails;
