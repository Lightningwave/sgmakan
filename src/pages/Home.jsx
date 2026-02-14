import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Hero from '../components/Hero';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchCafes } from '../services/api';
import { Link } from 'react-router-dom';

function Home() {
    const [cafes, setCafes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function loadCafes() {
            try {
                const data = await fetchCafes();
                if (isMounted) {
                    setCafes(data);
                    setLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error loading cafes:', error);
                    setLoading(false);
                }
            }
        }
        loadCafes();
        
        return () => { isMounted = false; };
    }, []);

    // Top Picks: highest rated cafes
    const featuredCafes = [...cafes]
        .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
        .slice(0, 6);

    // Recently Added: newest cafes by created_at date
    const recentCafes = [...cafes]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 6);

    if (loading) {
        return (
            <div className="home-page">
                <Hero />
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="home-page">
            <Hero />

            <div className="section-header">
                <h2>Top Picks</h2>
                <Link to="/explore" className="see-all-link">See all →</Link>
            </div>
            
            <div className="card-grid">
                {featuredCafes.length > 0 ? (
                    featuredCafes.map((cafe) => (
                        <Card key={cafe.id} {...cafe} />
                    ))
                ) : (
                    <EmptyState icon="☕" title="No cafes yet" message="Check back soon!" />
                )}
            </div>

            <div className="intro-block" style={{ marginTop: '60px' }}>
                <div className="intro-icon">💡</div>
                <div className="intro-content">
                    <h3>Curator's Note</h3>
                    <p>Singapore's cafe scene is ever-changing. This list focuses on places with <strong>great coffee</strong>, <strong>reliable wifi</strong>, and <strong>inspiring interiors</strong>. Treat this as your digital notebook.</p>
                </div>
            </div>

            <div className="section-header" style={{ marginTop: '40px' }}>
                <h2>Recently Added</h2>
            </div>
            {recentCafes.length > 0 ? (
                <div className="card-grid">
                    {recentCafes.map((cafe) => (
                        <Card key={cafe.id} {...cafe} />
                    ))}
                </div>
            ) : (
                 <EmptyState 
                    icon="📝" 
                    title="No recent additions" 
                    message="Check back soon for more curated spots." 
                 />
            )}
        </div>
    );
}

export default Home;
