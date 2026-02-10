/**
 * Manages user authentication state using Supabase Auth
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from profiles table (profile_id = auth.users.id)
    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('profile_id', userId)
                .single();

            if (error) {
                console.log('Profile not found, user may need to re-login');
                return null;
            }
            return data;
        } catch (err) {
            console.error('Error fetching profile:', err);
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;
        let initialHandled = false;
        let subscription;

        const handleSession = async (event, session) => {
            if (!isMounted) return;

            if (event === 'INITIAL_SESSION') {
                if (initialHandled) return;
                initialHandled = true;
            }

            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (event === 'SIGNED_OUT' || !currentUser) {
                setProfile(null);
                setLoading(false);
                return;
            }

            if (event === 'TOKEN_REFRESHED') {
                setLoading(false);
                return;
            }

            try {
                const userProfile = await fetchProfile(currentUser.id);
                if (isMounted) {
                    setProfile(userProfile);
                }
            } catch (err) {
                console.error('Profile fetch error:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                await handleSession('INITIAL_SESSION', session);
            } catch (error) {
                if (error?.name !== 'AbortError' && !String(error?.message || '').includes('aborted')) {
                    console.error('Error getting session:', error);
                }
                if (isMounted) {
                    setLoading(false);
                }
            }

            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                handleSession(event, session);
            });
            subscription = data.subscription;
        };

        initAuth();

        return () => {
            isMounted = false;
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/login`
            }
        });

        if (error) throw error;
        return data;
    };

    // Sign in with email and password
    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    };

    // Sign out 
    const signOut = async () => {
        // Clear local state first
        setUser(null);
        setProfile(null);
        
        // Force clear all Supabase auth storage
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') || key.includes('supabase') || key === 'sgmakan-auth')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.error('Error clearing localStorage:', e);
        }
        
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (err) {
            console.log('Supabase signOut cleanup:', err?.message);
        }
    };

    // Reset password
    const resetPassword = async (email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;
        return data;
    };

    // Update user email (requires confirmation)
    const updateEmail = async (newEmail) => {
        const { data, error } = await supabase.auth.updateUser({
            email: newEmail
        });

        if (error) throw error;
        return data;
    };

    // Delete/deactivate user account
    const deleteAccount = async () => {
        if (!user) throw new Error('Not authenticated');

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ is_active: false })
            .eq('profile_id', user.id);

        if (profileError) throw profileError;

        // Sign out the user
        await signOut();
    };

    // Update user profile (username)
    const updateProfile = async (updates) => {
        if (!user) throw new Error('Not authenticated');

        const safeUpdates = {
            username: updates.username,
            avatar_url: updates.avatar_url
        };

        Object.keys(safeUpdates).forEach(key => {
            if (safeUpdates[key] === undefined) {
                delete safeUpdates[key];
            }
        });

        const { data, error } = await supabase
            .from('profiles')
            .update(safeUpdates)
            .eq('profile_id', user.id)
            .select()
            .single();

        if (error) throw error;

        setProfile(prev => ({ ...prev, ...data }));
        return data;
    };

    const value = {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateEmail,
        updateProfile,
        deleteAccount,
        isAuthenticated: !!user,
        isAdmin: profile?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
