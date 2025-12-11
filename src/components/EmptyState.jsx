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
            <style jsx>{`
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    text-align: center;
                    background-color: #FAFAFA;
                    border: 1px dashed var(--border-color);
                    border-radius: 8px;
                    margin: 20px 0;
                }
                
                .empty-state-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.8;
                }
                
                .empty-state h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    color: var(--primary-text);
                }
                
                .empty-state p {
                    color: var(--secondary-text);
                    font-size: 14px;
                    max-width: 400px;
                    margin-bottom: 24px;
                }
                
                .empty-state-btn {
                    font-size: 14px;
                    padding: 8px 16px;
                }
            `}</style>
        </div>
    );
}

export default EmptyState;

