/**
 * Protected Route Component
 * Restricts access based on authentication and role
 */

import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const location = useLocation();

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Requires admin but user is not admin
    if (requireAdmin && !isAdmin) {
        return (
            <div className="access-denied">
                <div className="access-denied-content">
                    <h1>Access Denied</h1>
                    <p>You don't have permission to view this page.</p>
                    <Link to="/" className="btn-primary">Go to Home</Link>
                </div>
            </div>
        );
    }

    return children;
}

export default ProtectedRoute;
