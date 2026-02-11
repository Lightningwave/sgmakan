/**
 * API Service for SGMakan
 * Fetches data from Supabase
 */

import { supabase } from './supabase';

// Ensure auth session is loaded before queries (prevents stale token on reload)
async function ensureAuthSession() {
    try {
        await supabase.auth.getSession();
    } catch (error) {
        console.error('Error ensuring auth session:', error?.message);
    }
}

function isRetryableError(error) {
    if (!error) return false;
    const message = String(error?.message || '').toLowerCase();
    return (
        error?.name === 'AbortError' ||
        message.includes('aborted') ||
        message.includes('jwt') ||
        message.includes('token') ||
        message.includes('expired') ||
        error?.code === 'PGRST301'
    );
}

async function withRetry(fn, retries = 2, delay = 500) {
    for (let i = 0; i <= retries; i++) {
        try {
            await ensureAuthSession();
            return await fn();
        } catch (error) {
            if (i === retries || !isRetryableError(error)) {
                throw error;
            }
            // Wait before retry
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// Transform database cafe to frontend format
function transformCafe(dbCafe) {
    return {
        id: dbCafe.slug,
        cafe_id: dbCafe.cafe_id, 
        title: dbCafe.title,
        location: dbCafe.location,
        rating: dbCafe.rating?.toString() || '0',
        price: dbCafe.price,
        userStatus: null, // merged from favorites table per-user
        mrt: dbCafe.mrt,
        vibe: dbCafe.vibe,
        tags: dbCafe.tags || [],
        description: dbCafe.description,
        image: dbCafe.image_url || dbCafe.image,
        created_at: dbCafe.created_at
    };
}

// Transform database neighborhood to frontend format
function transformNeighborhood(dbNeighborhood) {
    const id = dbNeighborhood.name.toLowerCase().replace(/\s+/g, '-');
    return {
        id: id,
        name: dbNeighborhood.name,
        icon: dbNeighborhood.icon || '📍',
        image: dbNeighborhood.image_url,
        description: dbNeighborhood.description
    };
}

// Fetch all cafes
export async function fetchCafes() {
    try {
        return await withRetry(async () => {
            const { data, error } = await supabase
                .from('cafes')
                .select('*')
                .eq('is_active', true)
                .order('title');

            if (error) throw error;
            return data.map(transformCafe);
        });
    } catch (error) {
        console.error('Error fetching cafes:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        return [];
    }
}

// Fetch single cafe by ID (slug)
export async function fetchCafeById(id) {
    try {
        return await withRetry(async () => {
            const { data, error } = await supabase
                .from('cafes')
                .select('*')
                .eq('slug', id)
                .eq('is_active', true)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }
            return transformCafe(data);
        });
    } catch (error) {
        console.error('Error fetching cafe:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        return null;
    }
}

// Fetch all neighborhoods
export async function fetchNeighborhoods() {
    try {
        return await withRetry(async () => {
            const { data, error } = await supabase
                .from('neighborhoods')
                .select('*')
                .order('name');

            if (error) throw error;
            return data.map(transformNeighborhood);
        });
    } catch (error) {
        console.error('Error fetching neighborhoods:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        return [];
    }
}

// Fetch cafes by neighborhood
export async function fetchCafesByNeighborhood(area) {
    try {
        return await withRetry(async () => {
            // Convert area slug to neighborhood name (e.g., "tiong-bahru" -> "Tiong Bahru")
            const areaName = area.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Look up the neighborhood_id by name
            const { data: neighborhood, error: nhError } = await supabase
                .from('neighborhoods')
                .select('neighborhood_id')
                .eq('name', areaName)
                .single();

            if (nhError || !neighborhood) {
                console.warn(`Neighborhood "${areaName}" not found, returning empty`);
                return [];
            }

            const { data, error } = await supabase
                .from('cafes')
                .select('*')
                .eq('neighborhood_id', neighborhood.neighborhood_id)
                .eq('is_active', true)
                .order('title');

            if (error) throw error;
            return data.map(transformCafe);
        });
    } catch (error) {
        console.error('Error fetching neighborhood cafes:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        return [];
    }
}

// Fetch journal note for a cafe (requires authentication)
export async function fetchJournalNote(cafeId) {
    try {
        return await withRetry(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return null; // Not authenticated
            }

            const { data, error } = await supabase
                .from('favorites')
                .select('note')
                .eq('cafe_id', cafeId)
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No favorite found
                throw error;
            }
            return data?.note || null;
        });
    } catch (error) {
        console.error('Error fetching journal note:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        return null;
    }
}

// Save journal note for a cafe (requires authentication)
export async function saveJournalNote(cafeId, note) {
    try {
        return await withRetry(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Authentication required to save journal notes');
            }

            // Check if favorite already exists
            const { data: existing } = await supabase
                .from('favorites')
                .select('favorite_id')
                .eq('cafe_id', cafeId)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                // Update existing favorite
                const { error } = await supabase
                    .from('favorites')
                    .update({ note: note || null })
                    .eq('favorite_id', existing.favorite_id);

                if (error) throw error;
            } else {
                // Create new favorite with note
                const { error } = await supabase
                    .from('favorites')
                    .insert({
                        cafe_id: cafeId,
                        user_id: user.id,
                        status: 'Want to go',
                        note: note || null
                    });

                if (error) throw error;
            }

            return true;
        });
    } catch (error) {
        console.error('Error saving journal note:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });
        throw error;
    }
}

// ─── USER FAVORITES (per-user cafe status) ──────────────────────────────────────

// Fetch all favorites for the current user (returns map of cafe_id -> status)
export async function fetchUserFavorites() {
    try {
        return await withRetry(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return {};

            const { data, error } = await supabase
                .from('favorites')
                .select('cafe_id, status')
                .eq('user_id', user.id);

            if (error) throw error;

            const favMap = {};
            (data || []).forEach(fav => {
                favMap[fav.cafe_id] = fav.status;
            });
            return favMap;
        });
    } catch (error) {
        console.error('Error fetching user favorites:', error?.message);
        return {};
    }
}

// Fetch user's status for a single cafe
export async function fetchUserCafeStatus(cafeId) {
    try {
        return await withRetry(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('favorites')
                .select('status')
                .eq('cafe_id', cafeId)
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            return data?.status || null;
        });
    } catch (error) {
        console.error('Error fetching cafe status:', error?.message);
        return null;
    }
}

// Set or update the user's status for a cafe (Favorite, Want to go, Visited)
export async function updateCafeStatus(cafeId, status) {
    try {
        return await withRetry(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Authentication required');

            const { data: existing } = await supabase
                .from('favorites')
                .select('favorite_id')
                .eq('cafe_id', cafeId)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                const { error } = await supabase
                    .from('favorites')
                    .update({ status })
                    .eq('favorite_id', existing.favorite_id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('favorites')
                    .insert({
                        cafe_id: cafeId,
                        user_id: user.id,
                        status
                    });
                if (error) throw error;
            }
            return true;
        });
    } catch (error) {
        console.error('Error updating cafe status:', error?.message);
        throw error;
    }
}

// Remove user's status for a cafe (delete the favorites row)
export async function removeCafeStatus(cafeId) {
    try {
        return await withRetry(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Authentication required');

            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('cafe_id', cafeId)
                .eq('user_id', user.id);

            if (error) throw error;
            return true;
        });
    } catch (error) {
        console.error('Error removing cafe status:', error?.message);
        throw error;
    }
}
