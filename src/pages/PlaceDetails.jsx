import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchCafeById, fetchJournalNote, saveJournalNote, fetchUserCafeStatus, updateCafeStatus, removeCafeStatus } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatusDropdown, { STATUS_OPTIONS } from '../components/StatusDropdown';

function PlaceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [cafe, setCafe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [noteLoading, setNoteLoading] = useState(false);
    const [userStatus, setUserStatus] = useState(null);

    useEffect(() => {
        let isMounted = true;
        
        async function loadCafe() {
            try {
                const data = await fetchCafeById(id);
                if (isMounted) {
                    setCafe(data);
                    setLoading(false);
                    
                    if (isAuthenticated && data?.cafe_id) {
                        setNoteLoading(true);
                        try {
                            const [existingNote, existingStatus] = await Promise.all([
                                fetchJournalNote(data.cafe_id),
                                fetchUserCafeStatus(data.cafe_id)
                            ]);
                            if (isMounted) {
                                if (existingNote) setNote(existingNote);
                                setUserStatus(existingStatus);
                            }
                        } catch (error) {
                            console.error('Error loading journal note:', error);
                        } finally {
                            if (isMounted) {
                                setNoteLoading(false);
                            }
                        }
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error loading cafe:', error);
                    setLoading(false);
                }
            }
        }
        loadCafe();
        
        return () => { isMounted = false; };
    }, [id, isAuthenticated]);

    const handleStatusChange = async (cafeId, newStatus) => {
        try {
            await updateCafeStatus(cafeId, newStatus);
            setUserStatus(newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) {
        return <div className="place-details-error">Loading...</div>;
    }

    if (!cafe) {
        return <div className="place-details-error">Place not found</div>;
    }

    // Function to handle opening Google Maps
    const openGoogleMaps = () => {
        const destination = encodeURIComponent(`${cafe.title} ${cafe.location} Singapore`);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    };

    // Handle saving journal note
    const handleSaveNote = async () => {
        if (!isAuthenticated) {
            const confirmLogin = window.confirm(
                'Please sign in to save your journal notes. Would you like to go to the login page?'
            );
            if (confirmLogin) {
                navigate(`/login?redirect=/place/${id}`);
            }
            return;
        }

        if (!cafe?.cafe_id) {
            alert('Unable to save note. Please try again.');
            return;
        }

        setSaving(true);
        setSaved(false);

        try {
            await saveJournalNote(cafe.cafe_id, note);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000); 
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="place-details-page">
            {/* Immersive Header */}
            <div className="place-hero" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${cafe.image})` }}>
                <Link to="/explore" className="back-link-hero">← Back to Explore</Link>
                <div className="place-hero-content">
                    <div className="place-badges">
                        <span className="place-badge-status">
                            {STATUS_OPTIONS.find(o => o.value === (userStatus || 'Want to go'))?.label || 'To Visit'}
                        </span>
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
                            {cafe.tags && cafe.tags.map((tag, index) => (
                                <span key={index} className="tag-pill">{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className="place-map-section" style={{ marginTop: '40px' }}>
                        <h3>Location</h3>
                        {/* Map Embed */}
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
                        <StatusDropdown
                            cafeId={cafe.cafe_id}
                            userStatus={userStatus}
                            onStatusChange={handleStatusChange}
                            variant="detail-status"
                        />
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
                        {!isAuthenticated && (
                            <div className="journal-auth-prompt">
                                <p>Sign in to save your journal notes</p>
                                <Link to={`/login?redirect=/place/${id}`} className="btn-save-note">
                                    Sign In
                                </Link>
                            </div>
                        )}
                        <div className="journal-paper">
                            {isAuthenticated && (
                                <textarea
                                    className="journal-textarea"
                                    placeholder="What did you order? How was the coffee? Would you come back?"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={noteLoading}
                                />
                            )}
                            {noteLoading && (
                                <div style={{ padding: '10px 20px', textAlign: 'center', color: '#666' }}>
                                    Loading...
                                </div>
                            )}
                        </div>
                        <div className="journal-footer">
                            <span className="journal-date">{new Date().toLocaleDateString()}</span>
                            {isAuthenticated && (
                                <button
                                    className={`btn-save-note ${saved ? 'saved' : ''}`}
                                    onClick={handleSaveNote}
                                    disabled={saving || noteLoading}
                                >
                                    {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Note'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlaceDetails;
