import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { useBackendData } from '../hooks/useBackendData';
import useCafeStatus from '../hooks/useCafeStatus';

function Explore() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const area = queryParams.get('area');
    const statusParam = queryParams.get('status');
    const { getAllCafesWithStatus, updateCafeStatus } = useCafeStatus();
    const { cafes, neighborhoods, isLoading } = useBackendData();

    // Get cafes with user's custom statuses
    const cafesWithStatus = getAllCafesWithStatus(cafes);

    const filteredCafes = area && area !== 'all'
        ? cafesWithStatus.filter(cafe => cafe.location.toLowerCase().replace(/\s+/g, '-') === area)
        : cafesWithStatus;

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

    if (isLoading) {
        return (
            <div className="explore-page">
                <h1>All Cafes</h1>
                <EmptyState icon="⏳" title="Loading cafes" message="Fetching your curated list..." />
            </div>
        );
    }

    // Filter by area first, then by status and search query
    const displayedCafes = filteredCafes.filter(cafe => {
        let statusMatch = true;
        if (statusFilter === 'all') statusMatch = true;
        else if (statusFilter === 'favorite') statusMatch = cafe.status === 'Favorite';
        else if (statusFilter === 'want-to-go') statusMatch = cafe.status === 'Want to go';
        else if (statusFilter === 'visited') statusMatch = cafe.status === 'Visited';

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
        // 1. Use currently displayed cafes (respects area & status filters)
        // 2. Prioritize "Want to go" within this view
        const wantToGo = displayedCafes.filter(c => c.status === 'Want to go');
        const pool = wantToGo.length > 0 ? wantToGo : displayedCafes;

        if (pool.length === 0) {
            alert("No cafes found in this view!");
            return;
        }

        const randomCafe = pool[Math.floor(Math.random() * pool.length)];
        // Navigate to the cafe
        window.location.href = `/place/${randomCafe.id}`;
    };

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
                            <Card key={cafe.id} {...cafe} />
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
                                    <tr key={cafe.id} onClick={() => window.location.href = `/place/${cafe.id}`} className="table-row">
                                        <td className="cell-name">
                                            <span className="icon">📄</span> {cafe.title}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={cafe.status}
                                                onChange={(e) => updateCafeStatus(cafe.id, e.target.value)}
                                                className="table-status-dropdown"
                                            >
                                                <option value="Want to go">Want to go</option>
                                                <option value="Favorite">Favorite</option>
                                                <option value="Visited">Visited</option>
                                            </select>
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
