import React from 'react';

function Modal({ title, onClose, className, children }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${className || ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;
