-- =====================================================
-- SGMakan Database Schema v2.1
-- =====================================================



-- Drop tables if they exist (for fresh start)
DROP TABLE IF EXISTS ai_pipeline_log CASCADE;
DROP TABLE IF EXISTS pending_cafes CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS cafes CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================

CREATE TABLE profiles (
    profile_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    username VARCHAR(128),
    email VARCHAR(128),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url VARCHAR(512),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (profile_id)
);

COMMENT ON TABLE profiles IS 'User profiles - extends Supabase Auth with app-specific data';
COMMENT ON COLUMN profiles.profile_id IS 'References auth.users.id - same UUID';
COMMENT ON COLUMN profiles.role IS 'user = regular user, admin = can manage cafes and view AI logs';

-- =====================================================
-- 2. NEIGHBORHOODS TABLE
-- =====================================================
CREATE TABLE neighborhoods (
    neighborhood_id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    slug VARCHAR(128) UNIQUE,
    icon VARCHAR(10),
    image_url VARCHAR(512),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE neighborhoods IS 'Singapore neighborhoods where cafes are located';

-- Insert default neighborhoods
INSERT INTO neighborhoods (name, slug, icon, description) VALUES
    ('Tiong Bahru', 'tiong-bahru', '🥐', 'Hip enclave of cafes, indie boutiques, and iconic murals'),
    ('Joo Chiat', 'joo-chiat', '🏠', 'Vibrant heritage town with colorful Peranakan shophouses'),
    ('Dempsey Hill', 'dempsey-hill', '🌿', 'Former military barracks turned premier lifestyle destination'),
    ('Telok Ayer', 'telok-ayer', '🏢', 'Bustling CBD district with historic shophouses'),
    ('Keong Saik', 'keong-saik', '🏮', 'Vibrant Chinatown enclave blending heritage with modernity'),
    ('Holland Village', 'holland-village', '🏘️', 'Relaxed village vibe with restaurants and cafes'),
    ('Jalan Besar', 'jalan-besar', '🛠️', 'Industrial neighborhood with hipster coffee bars'),
    ('Siglap', 'siglap', '🚲', 'Laid-back East Coast neighborhood'),
    ('Bras Basah', 'bras-basah', '🎨', 'Arts and heritage district'),
    ('Robertson Quay', 'robertson-quay', '🍷', 'Riverside dining and brunch spots'),
    ('Everton Park', 'everton-park', '🌳', 'Quiet HDB estate with artisanal coffee shops');

-- =====================================================
-- 3. CAFES TABLE
-- =====================================================
CREATE TABLE cafes (
    cafe_id SERIAL PRIMARY KEY,
    slug VARCHAR(128) UNIQUE NOT NULL,
    title VARCHAR(128) NOT NULL,
    neighborhood_id INT REFERENCES neighborhoods(neighborhood_id),
    location VARCHAR(256),
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    price VARCHAR(10),
    mrt VARCHAR(128),
    vibe VARCHAR(50),
    tags TEXT[],
    description TEXT,
    image_url VARCHAR(512),
    is_active BOOLEAN DEFAULT TRUE,
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'ai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE cafes IS 'Curated cafe listings';
COMMENT ON COLUMN cafes.source IS 'manual = added by admin, ai = discovered and verified by AI';

-- =====================================================
-- 4. FAVORITES TABLE
-- =====================================================
CREATE TABLE favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    cafe_id INT REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Want to go' CHECK (status IN ('Want to go', 'Visited', 'Favorite')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, cafe_id)
);

COMMENT ON TABLE favorites IS 'User saved cafes with personal status and notes';
COMMENT ON COLUMN favorites.user_id IS 'References profiles.profile_id (UUID from auth.users)';

-- =====================================================
-- 5. PENDING CAFES TABLE
-- =====================================================
CREATE TABLE pending_cafes (
    pending_id SERIAL PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    neighborhood_id INT REFERENCES neighborhoods(neighborhood_id),
    location VARCHAR(256),
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    price VARCHAR(10),
    mrt VARCHAR(128),
    vibe VARCHAR(50),
    tags TEXT[],
    description TEXT,
    image_url VARCHAR(512),
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    failure_reason TEXT,
    reviewed_by UUID REFERENCES profiles(profile_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE pending_cafes IS 'AI-discovered cafes awaiting verification';
COMMENT ON COLUMN pending_cafes.status IS 'pending = awaiting verification, verified = auto-approved and moved to cafes, failed = needs admin attention';
COMMENT ON COLUMN pending_cafes.failure_reason IS 'Why verification failed (invalid image, missing data, etc.)';
COMMENT ON COLUMN pending_cafes.reviewed_by IS 'Admin who reviewed (UUID from profiles.profile_id)';

-- =====================================================
-- 6. AI PIPELINE LOG TABLE
-- =====================================================
CREATE TABLE ai_pipeline_log (
    log_id SERIAL PRIMARY KEY,
    pipeline_type VARCHAR(20) NOT NULL CHECK (pipeline_type IN ('discovery', 'verification')),
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    cafes_found INT DEFAULT 0,
    cafes_verified INT DEFAULT 0,
    cafes_failed INT DEFAULT 0,
    error_message TEXT,
    details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE ai_pipeline_log IS 'Log of all AI pipeline activities for admin dashboard';
COMMENT ON COLUMN ai_pipeline_log.pipeline_type IS 'discovery = weekly cafe search, verification = data validation';
COMMENT ON COLUMN ai_pipeline_log.details IS 'Full details of pipeline run (cafes processed, errors, etc.)';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active);

-- Neighborhoods
CREATE INDEX idx_neighborhoods_slug ON neighborhoods(slug);

-- Cafes
CREATE INDEX idx_cafes_slug ON cafes(slug);
CREATE INDEX idx_cafes_neighborhood ON cafes(neighborhood_id);
CREATE INDEX idx_cafes_active ON cafes(is_active);
CREATE INDEX idx_cafes_source ON cafes(source);

-- Favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_cafe ON favorites(cafe_id);
CREATE INDEX idx_favorites_status ON favorites(status);

-- Pending Cafes
CREATE INDEX idx_pending_status ON pending_cafes(status);
CREATE INDEX idx_pending_date ON pending_cafes(created_at DESC);

-- AI Pipeline Log
CREATE INDEX idx_log_type ON ai_pipeline_log(pipeline_type);
CREATE INDEX idx_log_status ON ai_pipeline_log(status);
CREATE INDEX idx_log_date ON ai_pipeline_log(started_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update cafe last_updated timestamp
CREATE OR REPLACE FUNCTION update_cafe_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cafe_updated
BEFORE UPDATE ON cafes
FOR EACH ROW EXECUTE FUNCTION update_cafe_timestamp();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_cafe_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug = TRIM(BOTH '-' FROM NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cafe_slug
BEFORE INSERT ON cafes
FOR EACH ROW EXECUTE FUNCTION generate_cafe_slug();


-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Schema v2.1 created successfully!' AS status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
