import React from 'react';
import './About.css'; // Assuming we'll create a CSS file for specific styles if needed, or rely on App.css

function About() {
    return (
        <div className="about-page">
            <div className="about-header">
                <span className="about-subtitle">The Project</span>
                <h1>A Curated Collection of<br/>Singapore's Cafe Culture</h1>
            </div>

            <div className="about-content">
                <div className="about-intro">
                    <p className="lead-text">
                        SGMakan is a curated digital archive dedicated to the art of cafe culture in Singapore. 
                        More than just a directory, it is a discerning collection of spaces that champion 
                        exceptional coffee, culinary craftsmanship, and thoughtful design.
                    </p>
                </div>

                <div className="about-grid">
                    <section className="about-section">
                        <h3>The Mission</h3>
                        <p>
                            In a city teeming with options, finding a space that truly resonates can be overwhelming. 
                            SGMakan exists to cut through the noise. We document establishments that offer 
                            substance over hype. We look for places where the barista knows the beans, the kitchen respects 
                            the ingredients, and the ambiance invites you to linger.
                        </p>
                    </section>

                    <section className="about-section">
                        <h3>Our Philosophy</h3>
                        <p>
                            We believe a great cafe is an anchor for its community. Our selection process is rigorous 
                            and personal. We prioritize independent operators, heritage preservation, and 
                            innovative concepts. We look for the intangible "soul" of a place. It might be the quiet corner 
                            for deep work, the bustle of a Sunday brunch, or the aroma of a perfectly pulled shot.
                        </p>
                    </section>
                </div>

                <section className="about-section full-width-section">
                    <h3>Using the Platform</h3>
                    <div className="features-grid">
                        <div className="feature-item">
                            <span className="feature-icon">📍</span>
                            <h4>Curated Neighborhoods</h4>
                            <p>Navigate the city through its most vibrant districts, from the heritage shophouses of Joo Chiat to the modern enclaves of Robertson Quay.</p>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🔖</span>
                            <h4>Personalized Tracking</h4>
                            <p>Build your own cafe itinerary. Mark spots as "To Visit," catalog your "Favorites," and keep a log of places you've "Visited."</p>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">👁️</span>
                            <h4>Dual Perspectives</h4>
                            <p>Switch between a visual Gallery view for inspiration and a detailed Table view for quick, data-rich comparisons.</p>
                        </div>
                    </div>
                </section>

                <section className="about-section footer-note">
                    <hr className="divider" />
                    <p>
                        <em>SGMakan is a living document, continuously updated to reflect the dynamic nature of Singapore's food scene. 
                        It is built for the coffee connoisseur, the digital nomad, and the weekend explorer.</em>
                    </p>
                </section>
            </div>
        </div>
    );
}

export default About;
