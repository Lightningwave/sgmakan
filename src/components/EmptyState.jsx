import React from 'react';
import { Link } from 'react-router-dom';

function EmptyState({ 
    icon = "📭", 
    title = "No items found", 
    message = "We couldn't find anything matching your criteria.", 
    actionText, 
    actionLink 
}) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{message}</p>
            {actionText && actionLink && (
                <Link to={actionLink} className="btn-secondary empty-state-btn">
                    {actionText}
                </Link>
            )}
        </div>
    );
}

export default EmptyState;

