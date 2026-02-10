import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

function ResetPassword() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validSession, setValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                    setValidSession(true);
                } else {
                    setError('Invalid or expired password reset link. Please request a new one.');
                }
            } catch (err) {
                console.error('Session check error:', err);
                setError('Unable to verify your session. Please request a new password reset link.');
            } finally {
                setCheckingSession(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setValidSession(true);
                setCheckingSession(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <h1>Verifying...</h1>
                        <p>Please wait while we verify your reset link</p>
                    </div>
                    <div className="auth-loading">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <h1>Password Updated!</h1>
                        <p>Your password has been successfully reset</p>
                    </div>

                    <div className="auth-success">
                        <p>
                            Your password has been changed successfully.
                            You can now log in with your new password.
                        </p>
                        <p className="auth-success-note">
                            Redirecting to login page...
                        </p>
                    </div>

                    <Link to="/login" className="auth-button">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (!validSession) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <h1>Invalid Link</h1>
                        <p>This password reset link is invalid or has expired</p>
                    </div>

                    <div className="auth-error-box">
                        <p>{error || 'Please request a new password reset link.'}</p>
                    </div>

                    <Link to="/forgot-password" className="auth-button">
                        Request New Link
                    </Link>

                    <div className="auth-switch">
                        Remember your password? <Link to="/login">Log in</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Reset Your Password</h1>
                    <p>Enter your new password below</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="password">New Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                        <span className="form-hint">Must be at least 6 characters</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                <div className="auth-switch">
                    Remember your password? <Link to="/login">Log in</Link>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
