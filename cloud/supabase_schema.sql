-- Dvirious Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create the required tables.

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT DEFAULT '',
    ai_name TEXT DEFAULT 'Dvirious',
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
    polar_customer_id TEXT,
    settings JSONB DEFAULT '{}',

    -- Daily usage counters (reset by a cron job at midnight UTC)
    minutes_used_today REAL DEFAULT 0,
    cad_generations_today INTEGER DEFAULT 0,
    web_tasks_today INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI session tracking
CREATE TABLE IF NOT EXISTS ai_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    started_at DOUBLE PRECISION,
    ended_at DOUBLE PRECISION,
    plan TEXT,
    minutes_used REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions"
    ON ai_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can do everything (used by cloud backend)
CREATE POLICY "Service role full access profiles"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access sessions"
    ON ai_sessions FOR ALL
    USING (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_polar ON profiles(polar_customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON ai_sessions(user_id);
