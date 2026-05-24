/*
  # HeartPredict AI – Initial Schema

  1. New Tables
    - `profiles` – extends auth.users with role and display name
    - `patients` – clinical data entered per prediction session
    - `predictions` – ML model result linked to a patient record

  2. Security
    - Enable RLS on all tables
    - Authenticated users (doctors) can read/insert their own patients
    - Admin role can read all records
    - Profiles are readable by owner only

  3. Notes
    - `role` defaults to 'doctor'; admins must be manually promoted
    - `probability` stored as numeric 0-100 representing percentage
    - `risk_level` is low | medium | high derived from probability
*/

-- Profiles table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'doctor' CHECK (role IN ('doctor', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_name text NOT NULL DEFAULT 'Anonymous',
  age integer NOT NULL CHECK (age BETWEEN 1 AND 120),
  sex text NOT NULL CHECK (sex IN ('male', 'female')),
  chest_pain_type integer NOT NULL CHECK (chest_pain_type BETWEEN 0 AND 3),
  resting_bp integer NOT NULL CHECK (resting_bp BETWEEN 60 AND 250),
  cholesterol integer NOT NULL CHECK (cholesterol BETWEEN 100 AND 600),
  fasting_bs boolean NOT NULL DEFAULT false,
  resting_ecg integer NOT NULL CHECK (resting_ecg BETWEEN 0 AND 2),
  max_heart_rate integer NOT NULL CHECK (max_heart_rate BETWEEN 40 AND 300),
  exercise_angina boolean NOT NULL DEFAULT false,
  oldpeak numeric(4,1) NOT NULL DEFAULT 0,
  st_slope integer NOT NULL CHECK (st_slope BETWEEN 0 AND 2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can insert their own patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can read their own patients"
  ON patients FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Admins can read all patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prediction boolean NOT NULL,
  probability numeric(5,2) NOT NULL CHECK (probability BETWEEN 0 AND 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  model_used text NOT NULL DEFAULT 'random_forest',
  top_features jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can insert their own predictions"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can read their own predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Admins can read all predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_predictions_doctor_id ON predictions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_predictions_patient_id ON predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'doctor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
