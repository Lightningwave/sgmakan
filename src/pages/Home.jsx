import React from 'react';
import Card from '../components/Card';
import Hero from '../components/Hero';
import EmptyState from '../components/EmptyState';
import cafes from '../data/cafes';
import useCafeStatus from '../hooks/useCafeStatus';
import { Link } from 'react-router-dom';

function Home() {
    const { getAllCafesWithStatus } = useCafeStatus();

    // Get all cafes with user's custom statuses, then select first 3
    const cafesWithStatus = getAllCafesWithStatus(cafes);
    const featuredCafes = cafesWithStatus.slice(0, 3);
    const recentCafes = cafesWithStatus.slice(3, 6); // Just simulating recent for now

    return (
        <div className="home-page">
            <Hero />

            <div className="section-header">
                <h2>Top Picks</h2>
                <Link to="/explore" className="see-all-link">See all →</Link>
            </div>
            
            <div className="card-grid">
                {featuredCafes.map((cafe) => (
                    <Card key={cafe.id} {...cafe} />
                ))}
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
