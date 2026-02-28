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

// ─── ADMIN API ───────────────────────────────────────────────────────────────

// Fetch dashboard stats (counts)
export async function fetchAdminStats() {
    try {
        const [cafesRes, usersRes, pendingRes, logsRes] = await Promise.all([
            supabase.from('cafes').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('pending_cafes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('ai_pipeline_log').select('*', { count: 'exact', head: true })
        ]);
        return {
            cafes: cafesRes.count || 0,
            users: usersRes.count || 0,
            pending: pendingRes.count || 0,
            aiRuns: logsRes.count || 0
        };
    } catch (error) {
        console.error('Error fetching admin stats:', error?.message);
        return { cafes: 0, users: 0, pending: 0, aiRuns: 0 };
    }
}

// Fetch all neighborhoods (raw, with IDs — for admin selects)
export async function fetchAdminNeighborhoods() {
    try {
        const { data, error } = await supabase
            .from('neighborhoods')
            .select('*')
            .order('name');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching admin neighborhoods:', error?.message);
        return [];
    }
}

// Fetch recent activity for overview (AI runs + approved/rejected cafes)
export async function fetchRecentActivity() {
    try {
        const [recentLogs, recentPending] = await Promise.all([
            supabase.from('ai_pipeline_log').select('*').order('started_at', { ascending: false }).limit(3),
            supabase.from('pending_cafes').select('*').neq('status', 'pending').order('reviewed_at', { ascending: false }).limit(5)
        ]);

        const activity = [];
        (recentLogs.data || []).forEach(log => {
            activity.push({
                type: 'ai_run',
                label: `AI pipeline ${log.status}`,
                detail: `Found ${log.cafes_found || 0}, verified ${log.cafes_verified || 0}`,
                date: log.started_at
            });
        });
        (recentPending.data || []).forEach(p => {
            activity.push({
                type: p.status === 'verified' ? 'approved' : 'rejected',
                label: `${p.status === 'verified' ? 'Approved' : 'Rejected'}: ${p.title}`,
                detail: p.failure_reason || '',
                date: p.reviewed_at || p.created_at
            });
        });
        activity.sort((a, b) => new Date(b.date) - new Date(a.date));
        return activity.slice(0, 5);
    } catch (error) {
        console.error('Error fetching recent activity:', error?.message);
        return [];
    }
}

// Fetch all cafes for admin table (includes joined neighborhood name)
export async function fetchAdminCafes() {
    try {
        const { data, error } = await supabase
            .from('cafes')
            .select('*, neighborhoods(name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching admin cafes:', error?.message);
        return [];
    }
}

// Fetch pending cafes for admin review
export async function fetchPendingCafes() {
    try {
        const { data, error } = await supabase
            .from('pending_cafes')
            .select('*, neighborhoods(name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching pending cafes:', error?.message);
        return [];
    }
}

// Fetch AI pipeline logs
export async function fetchAiLogs() {
    try {
        const { data, error } = await supabase
            .from('ai_pipeline_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(200);
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching AI logs:', error?.message);
        return [];
    }
}

// Delete a cafe
export async function deleteCafe(cafeId) {
    const { error } = await supabase.from('cafes').delete().eq('cafe_id', cafeId);
    if (error) throw error;
    return true;
}

// Approve a pending cafe (insert into cafes + mark pending as verified)
export async function approvePendingCafe(pending, reviewerId) {
    const { error: insertError } = await supabase.from('cafes').insert({
        title: pending.title,
        neighborhood_id: pending.neighborhood_id,
        location: pending.location,
        rating: pending.rating,
        price: pending.price,
        mrt: pending.mrt,
        vibe: pending.vibe,
        tags: pending.tags,
        description: pending.description,
        image_url: pending.image_url,
        source: 'ai'
    });
    if (insertError) throw insertError;

    const { error: updateError } = await supabase
        .from('pending_cafes')
        .update({ status: 'verified', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
        .eq('pending_id', pending.pending_id);
    if (updateError) console.error('Failed to update pending status:', updateError);

    return true;
}

// Reject a pending cafe
export async function rejectPendingCafe(pendingId, reason, reviewerId) {
    const { error } = await supabase
        .from('pending_cafes')
        .update({
            status: 'failed',
            failure_reason: reason,
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString()
        })
        .eq('pending_id', pendingId);
    if (error) throw error;
    return true;
}

// Create a new cafe (admin manual add)
export async function createCafe(payload) {
    const { data, error } = await supabase
        .from('cafes')
        .insert([{ ...payload, source: 'manual' }])
        .select('*, neighborhoods(name)')
        .single();
    if (error) throw error;
    return data;
}

// Update an existing cafe
export async function updateCafe(cafeId, payload) {
    const { error } = await supabase
        .from('cafes')
        .update(payload)
        .eq('cafe_id', cafeId);
    if (error) throw error;
    return true;
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
