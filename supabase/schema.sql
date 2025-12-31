-- AI Auditor Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'reviewer', 'admin')),
  is_reviewer_approved BOOLEAN NOT NULL DEFAULT FALSE,
  reviewer_application_status TEXT NOT NULL DEFAULT 'none' CHECK (reviewer_application_status IN ('none', 'pending', 'approved', 'rejected')),
  reviewer_application_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit requests table
CREATE TABLE IF NOT EXISTS audit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('it_code', 'translation', 'academic')),
  title TEXT NOT NULL CHECK (char_length(title) <= 40),
  ai_chat_url TEXT,
  content TEXT NOT NULL,
  budget INTEGER NOT NULL CHECK (budget >= 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  category_options JSONB NOT NULL,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Audit deliveries table
CREATE TABLE IF NOT EXISTS audit_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES audit_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL CHECK (verdict IN ('approved', 'needs_revision', 'dangerous')),
  comment TEXT NOT NULL,
  revision TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0 CHECK (fee_rate >= 0 AND fee_rate <= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Insert default platform settings
INSERT INTO platform_settings (fee_rate) VALUES (0.0) ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_requests_client_id ON audit_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_requests_reviewer_id ON audit_requests(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_audit_requests_status ON audit_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_requests_category ON audit_requests(category);
CREATE INDEX IF NOT EXISTS idx_audit_deliveries_request_id ON audit_deliveries(request_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_reviewer_application_status ON profiles(reviewer_application_status);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS audit_requests_updated_at ON audit_requests;
CREATE TRIGGER audit_requests_updated_at
  BEFORE UPDATE ON audit_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS platform_settings_updated_at ON platform_settings;
CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit requests policies
CREATE POLICY "Clients can view their own requests"
  ON audit_requests FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create requests"
  ON audit_requests FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own open requests"
  ON audit_requests FOR UPDATE
  USING (auth.uid() = client_id AND status = 'open');

CREATE POLICY "Reviewers can view open requests"
  ON audit_requests FOR SELECT
  USING (
    status = 'open' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'reviewer' AND is_reviewer_approved = true
    )
  );

CREATE POLICY "Reviewers can view their assigned requests"
  ON audit_requests FOR SELECT
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can claim open requests"
  ON audit_requests FOR UPDATE
  USING (
    status = 'open' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'reviewer' AND is_reviewer_approved = true
    )
  )
  WITH CHECK (
    reviewer_id = auth.uid() AND status = 'in_progress'
  );

CREATE POLICY "Reviewers can complete their assigned requests"
  ON audit_requests FOR UPDATE
  USING (
    auth.uid() = reviewer_id AND status = 'in_progress'
  )
  WITH CHECK (
    status = 'completed'
  );

CREATE POLICY "Admins can view all requests"
  ON audit_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all requests"
  ON audit_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit deliveries policies
CREATE POLICY "Request clients can view deliveries"
  ON audit_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM audit_requests
      WHERE id = request_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can view their own deliveries"
  ON audit_deliveries FOR SELECT
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can create deliveries for their requests"
  ON audit_deliveries FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM audit_requests
      WHERE id = request_id AND reviewer_id = auth.uid() AND status = 'in_progress'
    )
  );

CREATE POLICY "Admins can view all deliveries"
  ON audit_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Platform settings policies
CREATE POLICY "Anyone can view platform settings"
  ON platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update platform settings"
  ON platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
