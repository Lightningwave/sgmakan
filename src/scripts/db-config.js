/**
 * Database configuration for Supabase (Node.js scripts)
 * 
 * Environment variables (set in .env at project root):
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_KEY: Your Supabase service_role key (bypasses RLS)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
    console.error('Missing SUPABASE_URL in environment variables');
    process.exit(1);
}

if (!supabaseKey) {
    console.error('Missing SUPABASE_SERVICE_KEY in environment variables');
    process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized');

// Helper function to mimic pg query interface for compatibility
async function query(text, params = []) {
    const start = Date.now();
    
    try {
        // Handle COUNT queries
        if (text.toLowerCase().includes('select count')) {
            const tableMatch = text.match(/from\s+(\w+)/i);
            if (tableMatch) {
                const tableName = tableMatch[1];
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                
                if (error) throw error;
                
                const duration = Date.now() - start;
                console.log(`Query executed in ${duration}ms`);
                return { rows: [{ count }] };
            }
        }
        
        // Handle SELECT queries
        if (text.toLowerCase().startsWith('select')) {
            const tableMatch = text.match(/from\s+(\w+)/i);
            if (tableMatch) {
                const tableName = tableMatch[1];
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*');
                
                if (error) throw error;
                
                const duration = Date.now() - start;
                console.log(`Query executed in ${duration}ms`);
                return { rows: data || [] };
            }
        }
        
        throw new Error('Unsupported query type. Use supabase client directly for complex queries.');
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
}

// Mock pool.end() for compatibility
const pool = {
    end: async () => {
        console.log('Supabase connection closed');
    }
};

// Export supabase client and compatibility helpers
module.exports = { supabase, pool, query };
