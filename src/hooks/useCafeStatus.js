import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sgmakan_cafe_statuses';
const NOTES_STORAGE_KEY = 'sgmakan_cafe_notes';

/**
 * Custom hook to manage cafe statuses and notes with localStorage
 * Returns: { getCafeStatus, updateCafeStatus, getAllCafesWithStatus, getCafeNote, updateCafeNote }
 */
const useCafeStatus = () => {
    const [userStatuses, setUserStatuses] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading statuses from localStorage:', error);
            return {};
        }
    });

    const [userNotes, setUserNotes] = useState(() => {
        try {
            const stored = localStorage.getItem(NOTES_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading notes from localStorage:', error);
            return {};
        }
    });

    // Save to localStorage whenever userStatuses changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userStatuses));
        } catch (error) {
            console.error('Error saving statuses to localStorage:', error);
        }
    }, [userStatuses]);

    // Save to localStorage whenever userNotes changes
    useEffect(() => {
        try {
            localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(userNotes));
        } catch (error) {
            console.error('Error saving notes to localStorage:', error);
        }
    }, [userNotes]);

    /**
     * Get status for a specific cafe (user's custom status or default)
     */
    const getCafeStatus = (cafeId, defaultStatus) => {
        return userStatuses[cafeId] || defaultStatus;
    };

    /**
     * Update status for a specific cafe
     */
    const updateCafeStatus = (cafeId, newStatus) => {
        setUserStatuses(prev => ({
            ...prev,
            [cafeId]: newStatus
        }));
    };

    /**
     * Get note for a specific cafe
     */
    const getCafeNote = (cafeId) => {
        return userNotes[cafeId] || '';
    };

    /**
     * Update note for a specific cafe
     */
    const updateCafeNote = (cafeId, newNote) => {
        setUserNotes(prev => ({
            ...prev,
            [cafeId]: newNote
        }));
    };

    /**
     * Get all cafes with their current status (user custom or default)
     */
    const getAllCafesWithStatus = (cafes) => {
        return cafes.map(cafe => ({
            ...cafe,
            status: getCafeStatus(cafe.id, cafe.status),
            note: getCafeNote(cafe.id)
        }));
    };

    return {
        getCafeStatus,
        updateCafeStatus,
        getCafeNote,
        updateCafeNote,
        getAllCafesWithStatus
    };
};

export default useCafeStatus;
