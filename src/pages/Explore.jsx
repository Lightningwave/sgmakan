import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { fetchCafes, fetchCafesByNeighborhood, fetchNeighborhoods, fetchUserFavorites, updateCafeStatus, removeCafeStatus } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Explore() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const queryParams = new URLSearchParams(location.search);
    const area = queryParams.get('area');
    const statusParam = queryParams.get('status');

    const [cafes, setCafes] = useState([]);
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [userFavorites, setUserFavorites] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function loadData() {
            setLoading(true);
            try {
                const promises = [
                    area && area !== 'all' ? fetchCafesByNeighborhood(area) : fetchCafes(),
                    fetchNeighborhoods()
                ];
                if (isAuthenticated) promises.push(fetchUserFavorites());

                const results = await Promise.all(promises);
                if (isMounted) {
                    setCafes(results[0]);
                    setNeighborhoods(results[1]);
                    if (results[2]) setUserFavorites(results[2]);
                    setLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error loading data:', error);
                    setLoading(false);
                }
            }
        }
        loadData();
        
        return () => { isMounted = false; };
    }, [area, isAuthenticated]);

    // Merge user's per-cafe status into cafe list
    const cafesWithStatus = cafes.map(cafe => ({
        ...cafe,
        userStatus: userFavorites[cafe.cafe_id] || null
    }));

    const currentNeighborhood = area && area !== 'all'
        ? neighborhoods.find(n => n.id === area)
        : null;

    const [viewMode, setViewMode] = useState('gallery');
    const [statusFilter, setStatusFilter] = useState(statusParam || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    // Update status filter when URL param changes
    useEffect(() => {
        if (statusParam) {
            setStatusFilter(statusParam);
        } else {
            setStatusFilter('all');
        }
    }, [statusParam]);

    // Filter by user status and search query
    const displayedCafes = cafesWithStatus.filter(cafe => {
        let statusMatch = true;
        if (statusFilter === 'all') statusMatch = true;
        else if (statusFilter === 'favorite') statusMatch = cafe.userStatus === 'Favorite';
        else if (statusFilter === 'want-to-go') statusMatch = cafe.userStatus === 'Want to go';
        else if (statusFilter === 'visited') statusMatch = cafe.userStatus === 'Visited';

        if (!statusMatch) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const titleMatch = cafe.title.toLowerCase().includes(query);
            const vibeMatch = cafe.vibe && cafe.vibe.toLowerCase().includes(query);
            const tagsMatch = cafe.tags && cafe.tags.some(tag => tag.toLowerCase().includes(query));
            const locationMatch = cafe.location && cafe.location.toLowerCase().includes(query);
            return titleMatch || vibeMatch || tagsMatch || locationMatch;
        }

        return true;
    });

    const handleSurpriseMe = () => {
        const wantToGo = displayedCafes.filter(c => c.userStatus === 'Want to go');
        const pool = wantToGo.length > 0 ? wantToGo : displayedCafes;

        if (pool.length === 0) {
            alert("No cafes found in this view!");
            return;
        }

        const randomCafe = pool[Math.floor(Math.random() * pool.length)];
        navigate(`/place/${randomCafe.id}`);
    };

    // Handle status change from Card dropdown
    const handleCardStatusChange = async (cafeId, newStatus) => {
        try {
            if (newStatus) {
                await updateCafeStatus(cafeId, newStatus);
            } else {
                await removeCafeStatus(cafeId);
            }
            // Update local state immediately
            setUserFavorites(prev => {
                const updated = { ...prev };
                if (newStatus) {
                    updated[cafeId] = newStatus;
                } else {
                    delete updated[cafeId];
                }
                return updated;
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) {
        return (
            <div className="explore-page">
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div className="explore-page">
            {currentNeighborhood ? (
                <div className="neighborhood-header">
                    <div className="neighborhood-icon">{currentNeighborhood.icon}</div>
                    <h1>{currentNeighborhood.name}</h1>
                    <p className="neighborhood-description">{currentNeighborhood.description}</p>
                </div>
            ) : (
                <>
                    <h1>All Cafes</h1>
                    <p style={{ marginBottom: '32px', color: '#9B9A97' }}>A list of all curated spots.</p>
                </>
            )}

            <div className="explore-search-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <div className="explore-search" style={{ flex: 1, marginBottom: 0 }}>
                    <input
                        type="text"
                        placeholder="Search cafes by name, vibe, or tags..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    className="surprise-icon-btn"
                    onClick={handleSurpriseMe}
                    title="Pick a random spot from this list"
                >
                    🎲
                </button>
            </div>

            <div className="filters-container">
                <div className="status-filters">
                    <button
                        className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'favorite' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('favorite')}
                    >
                        Favorites
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'want-to-go' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('want-to-go')}
                    >
                        To Visit
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'visited' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('visited')}
                    >
                        Visited
                    </button>
                </div>

                <div className="view-switcher">
                    <button
                        className={`view-btn ${viewMode === 'gallery' ? 'active' : ''}`}
                        onClick={() => setViewMode('gallery')}
                    >
                        Gallery
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setViewMode('table')}
                    >
                        Table
                    </button>
                </div>
            </div>

            {viewMode === 'gallery' ? (
                <div className="card-grid">
                    {displayedCafes.length > 0 ? (
                        displayedCafes.map((cafe) => (
                            <Card key={cafe.id} {...cafe} onStatusChange={handleCardStatusChange} />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <EmptyState 
                                icon="☕" 
                                title="No cafes found" 
                                message="Try adjusting your filters or search query." 
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="table-view">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Area</th>
                                <th>MRT</th>
                                <th>Rating</th>
                                <th>Vibe</th>
                                <th>Price</th>
                                <th>Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedCafes.length > 0 ? (
                                displayedCafes.map((cafe) => (
                                    <tr key={cafe.id} onClick={() => navigate(`/place/${cafe.id}`)} className="table-row">
                                        <td className="cell-name">
                                            <span className="icon">📄</span> {cafe.title}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${(cafe.userStatus || 'want-to-go').toLowerCase().replace(/\s+/g, '-')}`}>
                                                {cafe.userStatus === 'Favorite' ? 'Favorite' : cafe.userStatus === 'Visited' ? 'Visited' : 'To Visit'}
                                            </span>
                                        </td>
                                        <td><span className="area-pill">{cafe.location}</span></td>
                                        <td>{cafe.mrt}</td>
                                        <td>{cafe.rating} ★</td>
                                        <td>{cafe.vibe}</td>
                                        <td>{cafe.price}</td>
                                        <td>
                                            <div className="tags-container">
                                                {cafe.tags && cafe.tags.map((tag, index) => (
                                                    <span key={index} className="tag-pill">{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8">
                                        <EmptyState 
                                            icon="🔍" 
                                            title="No results" 
                                            message="No cafes match your current filters." 
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Explore;
