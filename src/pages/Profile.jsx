import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
    const { user, profile, updateProfile, updateEmail, deleteAccount } = useAuth();
    const [formData, setFormData] = useState({
        username: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const [showEmailChange, setShowEmailChange] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailSuccess, setEmailSuccess] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);

    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.username || ''
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username.trim()) {
            setError('Username is required');
            return;
        }

        if (formData.username.length < 2) {
            setError('Username must be at least 2 characters');
            return;
        }

        if (formData.username.length > 50) {
            setError('Username must be less than 50 characters');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            await updateProfile({
                username: formData.username.trim()
            });

            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();

        if (!newEmail.trim()) {
            setEmailError('Please enter a new email address');
            return;
        }

        if (!newEmail.includes('@')) {
            setEmailError('Please enter a valid email address');
            return;
        }

        if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
            setEmailError('New email must be different from current email');
            return;
        }

        try {
            setEmailLoading(true);
            setEmailError('');
            setEmailSuccess('');

            await updateEmail(newEmail.trim());

            setEmailSuccess('Confirmation email sent! Please check both your current and new email addresses to confirm the change.');
            setNewEmail('');
        } catch (err) {
            setEmailError(err.message || 'Failed to update email');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();

        if (deleteConfirmText !== 'DELETE') {
            setDeleteError('Please type DELETE to confirm');
            return;
        }

        try {
            setDeleteLoading(true);
            setDeleteError('');
            await deleteAccount();
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete account');
            setDeleteLoading(false);
        }
    };

    const getInitial = () => {
        if (formData.username) {
            return formData.username.charAt(0).toUpperCase();
        }
        return user?.email?.charAt(0).toUpperCase() || '?';
    };

    return (
        <div className="auth-page">
            <div className="auth-container profile-container">
                <div className="auth-header">
                    <h1>Edit Profile</h1>
                    <p>Update your personal information</p>
                </div>

                <div className="profile-avatar-section">
                    <div className="profile-avatar-large">
                        <span className="profile-avatar-fallback">
                            {getInitial()}
                        </span>
                    </div>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    {success && <div className="auth-success">{success}</div>}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Your display name"
                            maxLength={50}
                        />
                        <span className="form-hint">This is how you'll appear on the site</span>
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                {/* Email Change Section */}
                <div className="profile-section">
                    <div className="profile-section-header">
                        <h3>Email Address</h3>
                        <span className="current-email">{user?.email}</span>
                    </div>

                    {!showEmailChange ? (
                        <button 
                            className="auth-button-secondary"
                            onClick={() => setShowEmailChange(true)}
                        >
                            Change Email
                        </button>
                    ) : (
                        <form className="email-change-form" onSubmit={handleEmailChange}>
                            {emailError && <div className="auth-error">{emailError}</div>}
                            {emailSuccess && <div className="auth-success">{emailSuccess}</div>}

                            <div className="form-group">
                                <label htmlFor="newEmail">New Email Address</label>
                                <input
                                    type="email"
                                    id="newEmail"
                                    value={newEmail}
                                    onChange={(e) => {
                                        setNewEmail(e.target.value);
                                        setEmailError('');
                                    }}
                                    placeholder="new@email.com"
                                />
                                <span className="form-hint">
                                    Confirmation emails will be sent to both your current and new email addresses.
                                </span>
                            </div>

                            <div className="email-change-buttons">
                                <button 
                                    type="submit" 
                                    className="auth-button" 
                                    disabled={emailLoading}
                                >
                                    {emailLoading ? 'Sending...' : 'Send Confirmation'}
                                </button>
                                <button 
                                    type="button" 
                                    className="auth-button-secondary"
                                    onClick={() => {
                                        setShowEmailChange(false);
                                        setNewEmail('');
                                        setEmailError('');
                                        setEmailSuccess('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="profile-links">
                    <Link to="/forgot-password" className="profile-link">
                        Change Password
                    </Link>
                    <button 
                        className="profile-link-button danger-link"
                        onClick={() => setShowDeleteAccount(!showDeleteAccount)}
                    >
                        Close Account
                    </button>
                </div>

                {/* Delete Account Form (Hidden by default) */}
                {showDeleteAccount && (
                    <div className="delete-account-form slide-down">
                        <div className="delete-warning">
                            <strong>Warning:</strong> This will permanently deactivate your account and remove your saved data.
                        </div>

                        {deleteError && <div className="auth-error">{deleteError}</div>}

                        <form onSubmit={handleDeleteAccount}>
                            <div className="form-group">
                                <label htmlFor="deleteConfirm">
                                    Type <strong>DELETE</strong> to confirm
                                </label>
                                <input
                                    type="text"
                                    id="deleteConfirm"
                                    value={deleteConfirmText}
                                    onChange={(e) => {
                                        setDeleteConfirmText(e.target.value);
                                        setDeleteError('');
                                    }}
                                    placeholder="DELETE"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="email-change-buttons">
                                <button 
                                    type="submit" 
                                    className="btn-danger" 
                                    disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                                >
                                    {deleteLoading ? 'Closing...' : 'Close My Account'}
                                </button>
                                <button 
                                    type="button" 
                                    className="auth-button-secondary"
                                    onClick={() => {
                                        setShowDeleteAccount(false);
                                        setDeleteConfirmText('');
                                        setDeleteError('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="auth-switch">
                    <Link to="/">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}

export default Profile;
