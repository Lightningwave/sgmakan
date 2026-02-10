-- =====================================================
-- SGMakan Auth Integration v2.0
-- =====================================================
-- Run this AFTER schema.sql to set up Supabase Auth integration
-- Follows Supabase best practices for production
-- =====================================================

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

-- Function to create profile when someone signs up via Supabase Auth
-- SECURITY DEFINER: Runs with owner privileges
-- SET search_path: Prevents search path hijacking attacks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (profile_id, username, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (Required for production)
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles are viewable by everyone (for displaying usernames, avatars)
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Enable RLS on favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
    ON favorites FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
    ON favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own favorites
CREATE POLICY "Users can update own favorites"
    ON favorites FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
    ON favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS on cafes (public read, admin write)
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;

-- Everyone can view active cafes
CREATE POLICY "Active cafes are viewable by everyone"
    ON cafes FOR SELECT
    USING (is_active = true);

-- Admins can view all cafes (including inactive)
CREATE POLICY "Admins can view all cafes"
    ON cafes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profile_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert cafes
CREATE POLICY "Admins can insert cafes"
    ON cafes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profile_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update cafes
CREATE POLICY "Admins can update cafes"
    ON cafes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profile_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete cafes
CREATE POLICY "Admins can delete cafes"
    ON cafes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profile_id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on neighborhoods (public read)
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

-- Everyone can view neighborhoods
CREATE POLICY "Neighborhoods are viewable by everyone"
    ON neighborhoods FOR SELECT
    USING (true);

-- Admins can manage neighborhoods
CREATE POLICY "Admins can manage neighborhoods"
    ON neighborhoods FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profile_id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on pending_cafes (admin only)
ALTER TABLE pending_cafes ENABLE ROW LEVEL SECURITY;

-- Admins can view pending cafes
CREATE POLICY "Admins can view pending cafes"
    ON pending_cafes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profile_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can manage pending cafes
CREATE POLICY "Admins can manage pending cafes"
    ON pending_cafes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profile_id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on ai_pipeline_log (admin only)
ALTER TABLE ai_pipeline_log ENABLE ROW LEVEL SECURITY;

-- Admins can view AI logs
CREATE POLICY "Admins can view AI logs"
    ON ai_pipeline_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profile_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- ADMIN SETUP HELPER
-- =====================================================
-- To make a user an admin, run:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Auth integration v2.0 complete!' AS status;
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' ORDER BY tablename;
