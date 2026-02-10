import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ForgotPassword() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await resetPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to send password reset email');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <h1>Check Your Email</h1>
                        <p>We've sent a password reset link to your email</p>
                    </div>

                    <div className="auth-success">
                        <p>
                            A password reset link has been sent to <strong>{email}</strong>.
                        </p>
                        <p>
                            Please check your inbox and click the link to reset your password.
                            The link will expire in 24 hours.
                        </p>
                        <p className="auth-success-note">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                    </div>

                    <button 
                        className="auth-button-secondary" 
                        onClick={() => {
                            setSuccess(false);
                            setEmail('');
                        }}
                    >
                        Try Another Email
                    </button>

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
                    <h1>Forgot Password?</h1>
                    <p>Enter your email and we'll send you a reset link</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            placeholder="your@email.com"
                            autoComplete="email"
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-switch">
                    Remember your password? <Link to="/login">Log in</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
