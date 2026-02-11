import React from 'react';
import { Link } from 'react-router-dom';
import StatusDropdown from './StatusDropdown';

function Card({ id, cafe_id, title, location, price, userStatus, tags, image, onStatusChange }) {
    return (
        <Link to={`/place/${id}`} className="card-link">
            <div className="card">
                <div className="card-image">
                    {image ? <img src={image} alt={title} /> : <div className="image-placeholder"></div>}
                    <div className="card-overlay">
                        <span>View Details</span>
                    </div>
                </div>
                <div className="card-content">
                    <h3 className="card-title"><span className="icon">📄</span> {title}</h3>

                    <div className="card-properties">
                        {/* Status Property — dropdown */}
                        <div className="property-row">
                            <span className="property-name">Status</span>
                            <StatusDropdown
                                cafeId={cafe_id}
                                userStatus={userStatus}
                                onStatusChange={onStatusChange}
                            />
                        </div>

                        {/* Area Property */}
                        <div className="property-row">
                            <span className="property-name">Area</span>
                            <span className="property-value area-pill">{location}</span>
                        </div>

                        {/* Price Property */}
                        <div className="property-row">
                            <span className="property-name">Price</span>
                            <span className="property-value">{price}</span>
                        </div>

                        {/* Tags Property */}
                        <div className="property-row">
                            <span className="property-name">Tags</span>
                            <div className="tags-container">
                                {tags && tags.map((tag, index) => (
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
