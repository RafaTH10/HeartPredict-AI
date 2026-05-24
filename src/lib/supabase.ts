import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Role = 'doctor' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Patient {
  id: string;
  doctor_id: string;
  patient_name: string;
  age: number;
  sex: 'male' | 'female';
  chest_pain_type: number;
  resting_bp: number;
  cholesterol: number;
  fasting_bs: boolean;
  resting_ecg: number;
  max_heart_rate: number;
  exercise_angina: boolean;
  oldpeak: number;
  st_slope: number;
  created_at: string;
}

export interface Prediction {
  id: string;
  patient_id: string;
  doctor_id: string;
  prediction: boolean;
  probability: number;
  risk_level: 'low' | 'medium' | 'high';
  model_used: string;
  top_features: { name: string; value: number; importance: number }[];
  created_at: string;
  patients?: Patient;
}
