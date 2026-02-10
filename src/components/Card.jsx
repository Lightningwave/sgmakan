import React from 'react';
import { Link } from 'react-router-dom';

function Card(props) {
    return (
        <Link to={`/place/${props.id}`} className="card-link">
            <div className="card">
                <div className="card-image">
                    {props.image ? <img src={props.image} alt={props.title} /> : <div className="image-placeholder"></div>}
                    <div className="card-overlay">
                        <span>View Details</span>
                    </div>
                </div>
                <div className="card-content">
                    <h3 className="card-title"><span className="icon">📄</span> {props.title}</h3>

                    <div className="card-properties">
                        {/* Status Property */}
                        <div className="property-row">
                            <span className="property-name">Status</span>
                            <span className={`property-value status-pill ${props.status ? props.status.toLowerCase().replace(/\s+/g, '-') : ''}`}>
                                {props.status || 'To Visit'}
                            </span>
                        </div>

                        {/* Area Property */}
                        <div className="property-row">
                            <span className="property-name">Area</span>
                            <span className="property-value area-pill">{props.location}</span>
                        </div>

                        {/* Price Property */}
                        <div className="property-row">
                            <span className="property-name">Price</span>
                            <span className="property-value">{props.price}</span>
                        </div>

                        {/* Tags Property */}
                        <div className="property-row">
                            <span className="property-name">Tags</span>
                            <div className="tags-container">
                                {props.tags && props.tags.map((tag, index) => (
                                    <span key={index} className="tag-pill">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default Card;
