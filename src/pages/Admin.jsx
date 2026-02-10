import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

function Admin() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ cafes: 0, users: 0, pending: 0, aiRuns: 0 });
    const [cafes, setCafes] = useState([]);
    const [pendingCafes, setPendingCafes] = useState([]);
    const [aiLogs, setAiLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCafe, setEditingCafe] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch stats for overview
                const [cafesRes, usersRes, pendingRes, logsRes, neighborhoodsRes] = await Promise.all([
                    supabase.from('cafes').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('pending_cafes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('ai_pipeline_log').select('*', { count: 'exact', head: true }),
                    supabase.from('neighborhoods').select('*').order('name')
                ]);

                if (!isMounted) return;

                setStats({
                    cafes: cafesRes.count || 0,
                    users: usersRes.count || 0,
                    pending: pendingRes.count || 0,
                    aiRuns: logsRes.count || 0
                });

                setNeighborhoods(neighborhoodsRes.data || []);

                // Fetch data based on active tab
                if (activeTab === 'cafes') {
                    const { data } = await supabase
                        .from('cafes')
                        .select('*, neighborhoods(name)')
                        .order('created_at', { ascending: false });
                    if (isMounted) setCafes(data || []);
                } else if (activeTab === 'pending') {
                    const { data } = await supabase
                        .from('pending_cafes')
                        .select('*, neighborhoods(name)')
                        .eq('status', 'pending')
                        .order('created_at', { ascending: false });
                    if (isMounted) setPendingCafes(data || []);
                } else if (activeTab === 'ai-logs') {
                    const { data } = await supabase
                        .from('ai_pipeline_log')
                        .select('*')
                        .order('started_at', { ascending: false })
                        .limit(50);
                    if (isMounted) setAiLogs(data || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            if (isMounted) setLoading(false);
        };
        
        fetchData();
        
        return () => { isMounted = false; };
    }, [activeTab]);

    const handleDeleteCafe = async (cafeId) => {
        if (!window.confirm('Are you sure you want to delete this cafe?')) return;
        
        const { error } = await supabase.from('cafes').delete().eq('cafe_id', cafeId);
        if (error) {
            alert('Failed to delete cafe: ' + error.message);
            return;
        }
        setCafes(cafes.filter(c => c.cafe_id !== cafeId));
        setStats(prev => ({ ...prev, cafes: prev.cafes - 1 }));
    };

    const handleApprovePending = async (pending) => {
        const { error: insertError } = await supabase.from('cafes').insert({
            title: pending.title,
            neighborhood_id: pending.neighborhood_id,
            location: pending.location,
            rating: pending.rating,
            price: pending.price,
            mrt: pending.mrt,
            vibe: pending.vibe,
            tags: pending.tags,
            description: pending.description,
            image_url: pending.image_url,
            source: 'ai'
        });

        if (insertError) {
            alert('Failed to approve cafe: ' + insertError.message);
            return;
        }

        const { error: updateError } = await supabase
            .from('pending_cafes')
            .update({ status: 'verified', reviewed_by: profile?.profile_id, reviewed_at: new Date().toISOString() })
            .eq('pending_id', pending.pending_id);

        if (updateError) {
            console.error('Failed to update pending status:', updateError);
        }

        setPendingCafes(pendingCafes.filter(p => p.pending_id !== pending.pending_id));
        setStats(prev => ({ ...prev, pending: prev.pending - 1, cafes: prev.cafes + 1 }));
    };

    const handleRejectPending = async () => {
        if (!rejectReason.trim() || !rejectingId) return;

        const { error } = await supabase
            .from('pending_cafes')
            .update({
                status: 'failed',
                failure_reason: rejectReason.trim(),
                reviewed_by: profile?.profile_id,
                reviewed_at: new Date().toISOString()
            })
            .eq('pending_id', rejectingId);

        if (error) {
            alert('Failed to reject cafe: ' + error.message);
            return;
        }

        setPendingCafes(pendingCafes.filter(p => p.pending_id !== rejectingId));
        setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
        setRejectingId(null);
        setRejectReason('');
    };

    const handleEditCafe = (cafe) => {
        setEditingCafe({ ...cafe });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingCafe(null);
    };

    const handleSaveCafe = async (updatedCafe) => {
        try {
            const { error } = await supabase
                .from('cafes')
                .update({
                    title: updatedCafe.title,
                    neighborhood_id: updatedCafe.neighborhood_id,
                    location: updatedCafe.location,
                    rating: updatedCafe.rating,
                    price: updatedCafe.price,
                    mrt: updatedCafe.mrt,
                    vibe: updatedCafe.vibe,
                    tags: updatedCafe.tags,
                    description: updatedCafe.description,
                    image_url: updatedCafe.image_url,
                    last_updated: new Date().toISOString()
                })
                .eq('cafe_id', updatedCafe.cafe_id);

            if (!error) {
                // Update local state
                setCafes(cafes.map(cafe =>
                    cafe.cafe_id === updatedCafe.cafe_id ? { ...cafe, ...updatedCafe } : cafe
                ));
                setIsEditing(false);
                setEditingCafe(null);
            } else {
                alert('Error updating cafe: ' + error.message);
            }
        } catch (error) {
            console.error('Error saving cafe:', error);
            alert('Failed to save cafe changes');
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '' },
        { id: 'cafes', label: 'Manage Cafes', icon: '' },
        { id: 'pending', label: 'Pending Cafes', icon: '' },
        { id: 'ai-logs', label: 'AI Pipeline Logs', icon: '' }
    ];

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Welcome, {profile?.username || profile?.email}</p>
            </div>

            <div className="admin-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="admin-loading">Loading...</div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="admin-overview">
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <span className="stat-icon">CAF</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.cafes}</span>
                                            <span className="stat-label">Total Cafes</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <span className="stat-icon">USR</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.users}</span>
                                            <span className="stat-label">Total Users</span>
                                        </div>
                                    </div>
                                    <div className="stat-card pending">
                                        <span className="stat-icon">PEN</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.pending}</span>
                                            <span className="stat-label">Pending Review</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <span className="stat-icon">AI</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.aiRuns}</span>
                                            <span className="stat-label">AI Pipeline Runs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Manage Cafes Tab */}
                        {activeTab === 'cafes' && (
                            <div className="admin-cafes">
                                <div className="admin-table-header">
                                    <h2>All Cafes</h2>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Neighborhood</th>
                                            <th>Rating</th>
                                            <th>Source</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cafes.map(cafe => (
                                            <tr key={cafe.cafe_id}>
                                                <td>
                                                    <div className="cafe-cell">
                                                        {cafe.image_url && (
                                                            <img src={cafe.image_url} alt="" className="cafe-thumb" />
                                                        )}
                                                        <span>{cafe.title}</span>
                                                    </div>
                                                </td>
                                                <td>{cafe.neighborhoods?.name || '-'}</td>
                                                <td>{cafe.rating || '-'}</td>
                                                <td>
                                                    <span className={`source-badge ${cafe.source}`}>
                                                        {cafe.source}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-action edit"
                                                            onClick={() => handleEditCafe(cafe)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="btn-action delete"
                                                            onClick={() => handleDeleteCafe(cafe.cafe_id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {cafes.length === 0 && (
                                    <div className="empty-state">No cafes found</div>
                                )}
                            </div>
                        )}

                        {/* Pending Cafes Tab */}
                        {activeTab === 'pending' && (
                            <div className="admin-pending">
                                <div className="admin-table-header">
                                    <h2>Pending AI Discoveries</h2>
                                </div>
                                {pendingCafes.length > 0 ? (
                                    <div className="pending-cards">
                                        {pendingCafes.map(pending => (
                                            <div key={pending.pending_id} className="pending-card">
                                                <div className="pending-image">
                                                    {pending.image_url ? (
                                                        <img src={pending.image_url} alt={pending.title} />
                                                    ) : (
                                                        <div className="no-image">No Image</div>
                                                    )}
                                                </div>
                                                <div className="pending-info">
                                                    <h3>{pending.title}</h3>
                                                    <p className="pending-location">{pending.location}</p>
                                                    <p className="pending-neighborhood">{pending.neighborhoods?.name}</p>
                                                    <div className="pending-meta">
                                                        <span>Confidence: {Math.round((pending.ai_confidence || 0) * 100)}%</span>
                                                        <span className={`status-badge ${pending.status}`}>{pending.status}</span>
                                                    </div>
                                                </div>
                                                <div className="pending-actions">
                                                    <button 
                                                        className="btn-action approve"
                                                        onClick={() => handleApprovePending(pending)}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        className="btn-action reject"
                                                        onClick={() => { setRejectingId(pending.pending_id); setRejectReason(''); }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">No pending cafes to review</div>
                                )}
                            </div>
                        )}

                        {/* AI Logs Tab */}
                        {activeTab === 'ai-logs' && (
                            <div className="admin-logs">
                                <div className="admin-table-header">
                                    <h2>AI Pipeline Activity</h2>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Found</th>
                                            <th>Verified</th>
                                            <th>Failed</th>
                                            <th>Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aiLogs.map(log => (
                                            <tr 
                                                key={log.log_id} 
                                                className="log-row-clickable"
                                                onClick={() => setSelectedLog(log)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td>{new Date(log.started_at).toLocaleString()}</td>
                                                <td>
                                                    <span className={`type-badge ${log.pipeline_type}`}>
                                                        {log.pipeline_type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${log.status}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td>{log.cafes_found}</td>
                                                <td>{log.cafes_verified}</td>
                                                <td>{log.cafes_failed}</td>
                                                <td>
                                                    {log.completed_at && log.started_at
                                                        ? `${Math.round((new Date(log.completed_at) - new Date(log.started_at)) / 1000)}s`
                                                        : log.status === 'running' ? 'Running...' : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {aiLogs.length === 0 && (
                                    <div className="empty-state">No AI pipeline runs yet</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Cafe Modal */}
            {isEditing && editingCafe && (
                <div className="modal-overlay" onClick={handleCancelEdit}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Cafe: {editingCafe.title}</h2>
                            <button className="modal-close" onClick={handleCancelEdit}>×</button>
                        </div>
                        <div className="modal-body">
                            <form className="edit-cafe-form" onSubmit={(e) => {
                                e.preventDefault();
                                handleSaveCafe(editingCafe);
                            }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="title">Name *</label>
                                        <input
                                            type="text"
                                            id="title"
                                            value={editingCafe.title || ''}
                                            onChange={(e) => setEditingCafe({...editingCafe, title: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="neighborhood">Neighborhood *</label>
                                        <select
                                            id="neighborhood"
                                            value={editingCafe.neighborhood_id || ''}
                                            onChange={(e) => setEditingCafe({...editingCafe, neighborhood_id: parseInt(e.target.value)})}
                                            required
                                        >
                                            <option value="">Select neighborhood</option>
                                            {neighborhoods.map(neighborhood => (
                                                <option key={neighborhood.neighborhood_id} value={neighborhood.neighborhood_id}>
                                                    {neighborhood.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="location">Address *</label>
                                    <input
                                        type="text"
                                        id="location"
                                        value={editingCafe.location || ''}
                                        onChange={(e) => setEditingCafe({...editingCafe, location: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="rating">Rating</label>
                                        <input
                                            type="number"
                                            id="rating"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={editingCafe.rating || ''}
                                            onChange={(e) => setEditingCafe({...editingCafe, rating: parseFloat(e.target.value) || null})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="price">Price Range</label>
                                        <select
                                            id="price"
                                            value={editingCafe.price || ''}
                                            onChange={(e) => setEditingCafe({...editingCafe, price: e.target.value})}
                                        >
                                            <option value="">Select price range</option>
                                            <option value="$">$ - Budget friendly</option>
                                            <option value="$$">$$ - Moderate</option>
                                            <option value="$$$">$$$ - Expensive</option>
                                            <option value="$$$$">$$$$ - Very expensive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="mrt">Nearest MRT</label>
                                        <input
                                            type="text"
                                            id="mrt"
                                            value={editingCafe.mrt || ''}
                                            onChange={(e) => setEditingCafe({...editingCafe, mrt: e.target.value})}
                                            placeholder="e.g., Orchard MRT"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="vibe">Vibe</label>
                                        <select
                                            id="vibe"
                                            value={editingCafe.vibe || ''}
                                            onChange={(e) => setEditingCafe({...editingCafe, vibe: e.target.value})}
                                        >
                                            <option value="">Select vibe</option>
                                            <option value="cozy">Cozy</option>
                                            <option value="modern">Modern</option>
                                            <option value="vintage">Vintage</option>
                                            <option value="industrial">Industrial</option>
                                            <option value="minimalist">Minimalist</option>
                                            <option value="eclectic">Eclectic</option>
                                            <option value="traditional">Traditional</option>
                                            <option value="artsy">Artsy</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="tags">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        id="tags"
                                        value={editingCafe.tags ? editingCafe.tags.join(', ') : ''}
                                        onChange={(e) => setEditingCafe({
                                            ...editingCafe,
                                            tags: e.target.value ? e.target.value.split(',').map(tag => tag.trim()) : []
                                        })}
                                        placeholder="specialty coffee, wifi, workspace, vegan"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        value={editingCafe.description || ''}
                                        onChange={(e) => setEditingCafe({...editingCafe, description: e.target.value})}
                                        rows="4"
                                        placeholder="Describe the cafe, its atmosphere, special features, etc."
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="image_url">Image URL</label>
                                    <input
                                        type="url"
                                        id="image_url"
                                        value={editingCafe.image_url || ''}
                                        onChange={(e) => setEditingCafe({...editingCafe, image_url: e.target.value})}
                                        placeholder="https://example.com/cafe-image.jpg"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Log Details Modal */}
            {selectedLog && (
                <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="modal-content log-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Pipeline Run #{selectedLog.log_id}</h2>
                            <button className="modal-close" onClick={() => setSelectedLog(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Run Info */}
                            <div className="log-run-info">
                                <div className="log-info-row">
                                    <span className="log-info-label">Status</span>
                                    <span className={`status-badge ${selectedLog.status}`}>{selectedLog.status}</span>
                                </div>
                                <div className="log-info-row">
                                    <span className="log-info-label">Started</span>
                                    <span>{new Date(selectedLog.started_at).toLocaleString()}</span>
                                </div>
                                {selectedLog.completed_at && (
                                    <div className="log-info-row">
                                        <span className="log-info-label">Completed</span>
                                        <span>{new Date(selectedLog.completed_at).toLocaleString()}</span>
                                    </div>
                                )}
                                {selectedLog.completed_at && selectedLog.started_at && (
                                    <div className="log-info-row">
                                        <span className="log-info-label">Duration</span>
                                        <span>{Math.round((new Date(selectedLog.completed_at) - new Date(selectedLog.started_at)) / 1000)}s</span>
                                    </div>
                                )}
                                <div className="log-info-row">
                                    <span className="log-info-label">Type</span>
                                    <span className={`type-badge ${selectedLog.pipeline_type}`}>{selectedLog.pipeline_type}</span>
                                </div>
                            </div>

                            {selectedLog.error_message && (
                                <div className="log-error-box">
                                    <strong>Error:</strong> {selectedLog.error_message}
                                </div>
                            )}

                            {/* Pipeline Stats from details JSON */}
                            {(() => {
                                try {
                                    const details = selectedLog.details
                                        ? (typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details) : selectedLog.details)
                                        : null;
                                    
                                    if (!details) return null;

                                    return (
                                        <div className="log-pipeline-stats">
                                            <h3>Pipeline Breakdown</h3>
                                            <div className="log-stats-grid">
                                                {details.articles_found != null && (
                                                    <div className="log-stat-item">
                                                        <span className="log-stat-value">{details.articles_found}</span>
                                                        <span className="log-stat-label">Articles Scraped</span>
                                                    </div>
                                                )}
                                                {details.discovered != null && (
                                                    <div className="log-stat-item">
                                                        <span className="log-stat-value">{details.discovered}</span>
                                                        <span className="log-stat-label">Candidates Extracted</span>
                                                    </div>
                                                )}
                                                {details.duplicate != null && (
                                                    <div className="log-stat-item">
                                                        <span className="log-stat-value">{details.duplicate}</span>
                                                        <span className="log-stat-label">Duplicates Skipped</span>
                                                    </div>
                                                )}
                                                {details.rejected != null && (
                                                    <div className="log-stat-item">
                                                        <span className="log-stat-value">{details.rejected}</span>
                                                        <span className="log-stat-label">Rejected</span>
                                                    </div>
                                                )}
                                                {details.auto_approved != null && (
                                                    <div className="log-stat-item highlight-green">
                                                        <span className="log-stat-value">{details.auto_approved}</span>
                                                        <span className="log-stat-label">Auto-Approved</span>
                                                    </div>
                                                )}
                                                {details.pending_review != null && (
                                                    <div className="log-stat-item highlight-yellow">
                                                        <span className="log-stat-value">{details.pending_review}</span>
                                                        <span className="log-stat-label">Pending Review</span>
                                                    </div>
                                                )}
                                                {details.errors != null && details.errors > 0 && (
                                                    <div className="log-stat-item highlight-red">
                                                        <span className="log-stat-value">{details.errors}</span>
                                                        <span className="log-stat-label">Errors</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                } catch {
                                    return null;
                                }
                            })()}

                            {/* Summary counts from columns */}
                            <div className="log-summary-counts">
                                <h3>Summary</h3>
                                <div className="log-counts-row">
                                    <div className="log-count-item">
                                        <span className="log-count-value">{selectedLog.cafes_found || 0}</span>
                                        <span className="log-count-label">Found</span>
                                    </div>
                                    <div className="log-count-item">
                                        <span className="log-count-value">{selectedLog.cafes_verified || 0}</span>
                                        <span className="log-count-label">Verified</span>
                                    </div>
                                    <div className="log-count-item">
                                        <span className="log-count-value">{selectedLog.cafes_failed || 0}</span>
                                        <span className="log-count-label">Failed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Console Log Output */}
                            {(() => {
                                try {
                                    const details = selectedLog.details
                                        ? (typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details) : selectedLog.details)
                                        : null;
                                    if (!details?.console_log) return null;
                                    return (
                                        <div className="log-console-section">
                                            <h3>Console Output</h3>
                                            <pre className="log-console-output">{details.console_log}</pre>
                                        </div>
                                    );
                                } catch {
                                    return null;
                                }
                            })()}
                        </div>
                    </div>
                </div>
            )}
            {/* Reject Reason Modal */}
            {rejectingId && (
                <div className="modal-overlay" onClick={() => setRejectingId(null)}>
                    <div className="modal-content reject-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Reject Cafe</h2>
                            <button className="modal-close" onClick={() => setRejectingId(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '12px', color: '#718096', fontSize: '14px' }}>
                                Why is this cafe being rejected?
                            </p>
                            <textarea
                                className="reject-reason-input"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Not a cafe, permanently closed, duplicate entry..."
                                rows="3"
                                autoFocus
                            />
                            <div className="form-actions" style={{ marginTop: '16px' }}>
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => setRejectingId(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-action reject"
                                    onClick={handleRejectPending}
                                    disabled={!rejectReason.trim()}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
