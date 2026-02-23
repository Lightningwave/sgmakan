import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    fetchAdminStats, fetchAdminNeighborhoods, fetchRecentActivity,
    fetchAdminCafes, fetchPendingCafes, fetchAiLogs,
    deleteCafe, approvePendingCafe, rejectPendingCafe,
    createCafe, updateCafe
} from '../services/api';

function Admin() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ cafes: 0, users: 0, pending: 0, aiRuns: 0 });
    const [cafes, setCafes] = useState([]);
    const [pendingCafes, setPendingCafes] = useState([]);
    const [aiLogs, setAiLogs] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCafe, setEditingCafe] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [deletingCafe, setDeletingCafe] = useState(null);
    // Manage Cafes — search, filter, sort, pagination
    const [cafeSearch, setCafeSearch] = useState('');
    const [cafeNeighborhoodFilter, setCafeNeighborhoodFilter] = useState('all');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [cafePage, setCafePage] = useState(1);
    // AI Logs — pagination
    const [logPage, setLogPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch stats + neighborhoods (shared across tabs)
                const [statsData, neighborhoodsData] = await Promise.all([
                    fetchAdminStats(),
                    fetchAdminNeighborhoods()
                ]);
                if (!isMounted) return;
                setStats(statsData);
                setNeighborhoods(neighborhoodsData);

                if (activeTab === 'overview') {
                    const activity = await fetchRecentActivity();
                    if (isMounted) setRecentActivity(activity);
                } else if (activeTab === 'cafes') {
                    const data = await fetchAdminCafes();
                    if (isMounted) setCafes(data);
                } else if (activeTab === 'pending') {
                    const data = await fetchPendingCafes();
                    if (isMounted) setPendingCafes(data);
                } else if (activeTab === 'ai-logs') {
                    const data = await fetchAiLogs();
                    if (isMounted) setAiLogs(data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            if (isMounted) setLoading(false);
        };
        
        fetchData();
        
        return () => { isMounted = false; };
    }, [activeTab]);

    const handleDeleteCafe = async () => {
        if (!deletingCafe) return;
        const cafeId = deletingCafe.cafe_id;
        try {
            await deleteCafe(cafeId);
            setCafes(cafes.filter(c => c.cafe_id !== cafeId));
            setStats(prev => ({ ...prev, cafes: prev.cafes - 1 }));
            setDeletingCafe(null);
        } catch (error) {
            alert('Failed to delete cafe: ' + error.message);
        }
    };

    const handleApprovePending = async (pending) => {
        try {
            await approvePendingCafe(pending, profile?.profile_id);
            setPendingCafes(pendingCafes.filter(p => p.pending_id !== pending.pending_id));
            setStats(prev => ({ ...prev, pending: prev.pending - 1, cafes: prev.cafes + 1 }));
        } catch (error) {
            alert('Failed to approve cafe: ' + error.message);
        }
    };

    const handleRejectPending = async () => {
        if (!rejectReason.trim() || !rejectingId) return;
        try {
            await rejectPendingCafe(rejectingId, rejectReason.trim(), profile?.profile_id);
            setPendingCafes(pendingCafes.filter(p => p.pending_id !== rejectingId));
            setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
            setRejectingId(null);
            setRejectReason('');
        } catch (error) {
            alert('Failed to reject cafe: ' + error.message);
        }
    };

    const handleEditCafe = (cafe) => {
        setEditingCafe({ ...cafe, _isNew: false });
        setIsEditing(true);
    };

    const handleAddCafe = () => {
        setEditingCafe({
            title: '', neighborhood_id: '', location: '', rating: '',
            price: '', mrt: '', vibe: '', tags: [], description: '',
            image_url: '', _isNew: true
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingCafe(null);
    };

    // Sort toggle
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filtered + sorted cafes for Manage tab
    const filteredCafes = cafes
        .filter(cafe => {
            if (cafeSearch) {
                const q = cafeSearch.toLowerCase();
                const match = (cafe.title || '').toLowerCase().includes(q)
                    || (cafe.location || '').toLowerCase().includes(q)
                    || (cafe.mrt || '').toLowerCase().includes(q);
                if (!match) return false;
            }
            if (cafeNeighborhoodFilter !== 'all') {
                if (String(cafe.neighborhood_id) !== cafeNeighborhoodFilter) return false;
            }
            return true;
        })
        .sort((a, b) => {
            let aVal, bVal;
            if (sortField === 'title') {
                aVal = (a.title || '').toLowerCase();
                bVal = (b.title || '').toLowerCase();
            } else if (sortField === 'neighborhood') {
                aVal = (a.neighborhoods?.name || '').toLowerCase();
                bVal = (b.neighborhoods?.name || '').toLowerCase();
            } else if (sortField === 'rating') {
                aVal = parseFloat(a.rating) || 0;
                bVal = parseFloat(b.rating) || 0;
            } else if (sortField === 'source') {
                aVal = a.source || '';
                bVal = b.source || '';
            } else {
                aVal = new Date(a.created_at || 0);
                bVal = new Date(b.created_at || 0);
            }
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

    // Pagination — cafes
    const cafePageCount = Math.ceil(filteredCafes.length / ITEMS_PER_PAGE);
    const displayedCafes = filteredCafes.slice((cafePage - 1) * ITEMS_PER_PAGE, cafePage * ITEMS_PER_PAGE);

    // Pagination — AI logs
    const logPageCount = Math.ceil(aiLogs.length / ITEMS_PER_PAGE);
    const displayedLogs = aiLogs.slice((logPage - 1) * ITEMS_PER_PAGE, logPage * ITEMS_PER_PAGE);

    const handleSaveCafe = async (updatedCafe) => {
        try {
            const payload = {
                title: updatedCafe.title,
                neighborhood_id: updatedCafe.neighborhood_id || null,
                location: updatedCafe.location,
                rating: updatedCafe.rating || null,
                price: updatedCafe.price || null,
                mrt: updatedCafe.mrt || null,
                vibe: updatedCafe.vibe || null,
                tags: updatedCafe.tags || [],
                description: updatedCafe.description || '',
                image_url: updatedCafe.image_url || null,
                last_updated: new Date().toISOString()
            };

            if (updatedCafe._isNew) {
                const data = await createCafe(payload);
                setCafes(prev => [data, ...prev]);
                setStats(prev => ({ ...prev, cafes: prev.cafes + 1 }));
            } else {
                await updateCafe(updatedCafe.cafe_id, payload);
                setCafes(cafes.map(cafe =>
                    cafe.cafe_id === updatedCafe.cafe_id ? { ...cafe, ...updatedCafe } : cafe
                ));
            }
            setIsEditing(false);
            setEditingCafe(null);
        } catch (error) {
            console.error('Error saving cafe:', error);
            alert('Failed to save cafe: ' + (error?.message || 'Unknown error'));
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'cafes', label: 'Cafes' },
        { id: 'pending', label: 'Pending' },
        { id: 'ai-logs', label: 'AI Logs' }
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
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="admin-content">
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="admin-overview">
                                <div className="stats-grid">
                                    <div className="stat-card clickable" onClick={() => setActiveTab('cafes')}>
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
                                    <div className="stat-card pending clickable" onClick={() => setActiveTab('pending')}>
                                        <span className="stat-icon">PEN</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.pending}</span>
                                            <span className="stat-label">Pending Review</span>
                                        </div>
                                    </div>
                                    <div className="stat-card clickable" onClick={() => setActiveTab('ai-logs')}>
                                        <span className="stat-icon">AI</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.aiRuns}</span>
                                            <span className="stat-label">AI Pipeline Runs</span>
                                        </div>
                                    </div>
                                </div>
                                {recentActivity.length > 0 && (
                                    <div className="recent-activity">
                                        <h3>Recent Activity</h3>
                                        <div className="activity-list">
                                            {recentActivity.map((item, i) => (
                                                <div key={i} className={`activity-item ${item.type}`}>
                                                    <span className={`activity-dot ${item.type}`} />
                                                    <div className="activity-content">
                                                        <span className="activity-label">{item.label}</span>
                                                        {item.detail && <span className="activity-detail">{item.detail}</span>}
                                                    </div>
                                                    <span className="activity-time">
                                                        {item.date ? new Date(item.date).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Manage Cafes Tab */}
                        {activeTab === 'cafes' && (
                            <div className="admin-cafes">
                                <div className="admin-table-header">
                                    <h2>All Cafes ({filteredCafes.length})</h2>
                                    <button className="btn-action edit" onClick={handleAddCafe}>+ New Cafe</button>
                                </div>
                                <div className="admin-filters">
                                    <input
                                        type="text"
                                        className="admin-search"
                                        placeholder="Search by name, address, or MRT..."
                                        value={cafeSearch}
                                        onChange={e => { setCafeSearch(e.target.value); setCafePage(1); }}
                                    />
                                    <select
                                        className="admin-filter-select"
                                        value={cafeNeighborhoodFilter}
                                        onChange={e => { setCafeNeighborhoodFilter(e.target.value); setCafePage(1); }}
                                    >
                                        <option value="all">All Neighborhoods</option>
                                        {neighborhoods.map(n => (
                                            <option key={n.neighborhood_id} value={n.neighborhood_id}>{n.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="admin-table-wrap">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th className="sortable" onClick={() => handleSort('title')}>
                                                    Name {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th className="sortable" onClick={() => handleSort('neighborhood')}>
                                                    Area {sortField === 'neighborhood' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th className="sortable" onClick={() => handleSort('rating')}>
                                                    Rating {sortField === 'rating' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th className="sortable" onClick={() => handleSort('source')}>
                                                    Source {sortField === 'source' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedCafes.map(cafe => (
                                                <tr key={cafe.cafe_id}>
                                                    <td>
                                                        <div className="cafe-cell">
                                                            {cafe.image_url ? (
                                                                <img src={cafe.image_url} alt="" className="cafe-thumb" />
                                                            ) : (
                                                                <span className="no-img-indicator" title="No image">—</span>
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
                                                                onClick={() => setDeletingCafe(cafe)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredCafes.length === 0 && (
                                    <div className="empty-state">
                                        {cafeSearch || cafeNeighborhoodFilter !== 'all'
                                            ? 'No cafes match your search'
                                            : 'No cafes found'}
                                    </div>
                                )}
                                {cafePageCount > 1 && (
                                    <div className="pagination">
                                        <button
                                            className="pagination-btn"
                                            disabled={cafePage === 1}
                                            onClick={() => setCafePage(prev => prev - 1)}
                                        >
                                            Previous
                                        </button>
                                        <div className="pagination-pages">
                                            {Array.from({ length: cafePageCount }, (_, i) => i + 1).map(p => (
                                                <button
                                                    key={p}
                                                    className={`pagination-num ${p === cafePage ? 'active' : ''}`}
                                                    onClick={() => setCafePage(p)}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            className="pagination-btn"
                                            disabled={cafePage === cafePageCount}
                                            onClick={() => setCafePage(prev => prev + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
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
                                        {displayedLogs.map(log => (
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
                                {logPageCount > 1 && (
                                    <div className="pagination">
                                        <button
                                            className="pagination-btn"
                                            disabled={logPage === 1}
                                            onClick={() => setLogPage(prev => prev - 1)}
                                        >
                                            Previous
                                        </button>
                                        <div className="pagination-pages">
                                            {Array.from({ length: logPageCount }, (_, i) => i + 1).map(p => (
                                                <button
                                                    key={p}
                                                    className={`pagination-num ${p === logPage ? 'active' : ''}`}
                                                    onClick={() => setLogPage(p)}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            className="pagination-btn"
                                            disabled={logPage === logPageCount}
                                            onClick={() => setLogPage(prev => prev + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit / Add Cafe Modal */}
            {isEditing && editingCafe && (
                <Modal
                    title={editingCafe._isNew ? 'Add New Cafe' : `Edit Cafe: ${editingCafe.title}`}
                    onClose={handleCancelEdit}
                >
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
                                        {editingCafe._isNew ? 'Create Cafe' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                </Modal>
            )}
            {/* Log Details Modal */}
            {selectedLog && (
                <Modal
                    title={`Pipeline Run #${selectedLog.log_id}`}
                    onClose={() => setSelectedLog(null)}
                    className="log-detail-modal"
                >
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
                </Modal>
            )}
            {/* Delete Cafe Modal */}
            {deletingCafe && (
                <Modal title="Delete Cafe" onClose={() => setDeletingCafe(null)} className="reject-modal">
                    <p style={{ marginBottom: '12px', color: '#4a5568', fontSize: '14px' }}>
                        Are you sure you want to remove <strong>{deletingCafe.title}</strong> from the list? This cannot be undone.
                    </p>
                    <div className="form-actions" style={{ marginTop: '16px' }}>
                        <button className="btn-secondary" onClick={() => setDeletingCafe(null)}>Cancel</button>
                        <button className="btn-action delete" onClick={handleDeleteCafe}>Delete</button>
                    </div>
                </Modal>
            )}

            {/* Reject Reason Modal */}
            {rejectingId && (
                <Modal title="Reject Cafe" onClose={() => setRejectingId(null)} className="reject-modal">
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
                        <button className="btn-secondary" onClick={() => setRejectingId(null)}>Cancel</button>
                        <button className="btn-action reject" onClick={handleRejectPending} disabled={!rejectReason.trim()}>Reject</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Admin;
