import React from 'react';
import { Link } from 'react-router-dom';

function Hero() {
    return (
        <section className="hero">
            <div className="hero-content">
                <span className="hero-badge">Curated Guide</span>
                <h1>Discover Singapore's<br />Best Cafes & Brunch Spots</h1>
                <p>A personal collection of the most aesthetic and delicious places to eat in the city. Hand-picked, tested, and reviewed.</p>
                <div className="hero-actions">
                    <Link to="/explore" className="btn-primary">Explore Guide</Link>
                    <Link to="/about" className="btn-secondary">Read Our Story</Link>
                </div>
            </div>
        </section>
    );
}

export default Hero;
