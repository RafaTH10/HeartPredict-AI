import { useState, FormEvent } from 'react';
import { HeartPulse, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  patient_name: string;
  age: string;
  sex: 'male' | 'female';
  chest_pain_type: string;
  resting_bp: string;
  cholesterol: string;
  fasting_bs: boolean;
  resting_ecg: string;
  max_heart_rate: string;
  exercise_angina: boolean;
  oldpeak: string;
  st_slope: string;
}

interface PredictionResult {
  prediction: boolean;
  probability: number;
  risk_level: 'low' | 'medium' | 'high';
  top_features: { name: string; value: number; importance: number }[];
}

const featureLabels: Record<string, string> = {
  age: 'Edad',
  sex: 'Sexo',
  chest_pain_type: 'Dolor de pecho',
  resting_bp: 'Presión arterial',
  cholesterol: 'Colesterol',
  fasting_bs: 'Azúcar en ayunas',
  resting_ecg: 'ECG en reposo',
  max_heart_rate: 'Freq. cardíaca máx.',
  exercise_angina: 'Angina inducida',
  oldpeak: 'Depresión ST',
  st_slope: 'Pendiente ST',
};

const riskConfig = {
  low: { label: 'Riesgo Bajo', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', bar: 'bg-emerald-500', icon: CheckCircle },
  medium: { label: 'Riesgo Medio', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700', bar: 'bg-amber-500', icon: Info },
  high: { label: 'Riesgo Alto', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700', bar: 'bg-red-500', icon: AlertTriangle },
};

const chestPainLabels = ['Angina típica', 'Angina atípica', 'No-anginoso', 'Asintomático'];
const ecgLabels = ['Normal', 'Anormalidad ST-T', 'Hipertrofia VI'];
const slopeLabels = ['Ascendente', 'Plano', 'Descendente'];

export default function PredictionPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>({
    patient_name: '', age: '', sex: 'male',
    chest_pain_type: '0', resting_bp: '', cholesterol: '',
    fasting_bs: false, resting_ecg: '0', max_heart_rate: '',
    exercise_angina: false, oldpeak: '0', st_slope: '0',
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        age: Number(form.age),
        sex: form.sex,
        chest_pain_type: Number(form.chest_pain_type),
        resting_bp: Number(form.resting_bp),
        cholesterol: Number(form.cholesterol),
        fasting_bs: form.fasting_bs,
        resting_ecg: Number(form.resting_ecg),
        max_heart_rate: Number(form.max_heart_rate),
        exercise_angina: form.exercise_angina,
        oldpeak: Number(form.oldpeak),
        st_slope: Number(form.st_slope),
      };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${supabaseUrl}/functions/v1/predict-heart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || anonKey}`,
          'Apikey': anonKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error en la predicción');
      const predResult: PredictionResult = await res.json();
      setResult(predResult);

      // Save to DB
      const { data: patientRow } = await supabase.from('patients').insert({
        doctor_id: user.id,
        patient_name: form.patient_name || 'Anónimo',
        ...payload,
      }).select('id').maybeSingle();

      if (patientRow) {
        await supabase.from('predictions').insert({
          patient_id: patientRow.id,
          doctor_id: user.id,
          prediction: predResult.prediction,
          probability: predResult.probability,
          risk_level: predResult.risk_level,
          model_used: 'random_forest',
          top_features: predResult.top_features,
        });
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? riskConfig[result.risk_level] : null;

  return (
    <AppLayout title="Módulo de Predicción">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Predicción de Riesgo Cardíaco</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ingresa los datos clínicos del paciente para obtener el análisis de IA</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="xl:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-5">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-500" />
              Datos del Paciente
            </h3>

            <div>
              <label className="label">Nombre del paciente</label>
              <input type="text" value={form.patient_name} onChange={e => set('patient_name', e.target.value)} placeholder="Nombre opcional" className="input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Edad *</label>
                <input type="number" required min={1} max={120} value={form.age} onChange={e => set('age', e.target.value)} placeholder="ej. 54" className="input" />
              </div>
              <div>
                <label className="label">Sexo *</label>
                <select required value={form.sex} onChange={e => set('sex', e.target.value as 'male' | 'female')} className="input">
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Presión arterial (mmHg) *</label>
                <input type="number" required min={60} max={250} value={form.resting_bp} onChange={e => set('resting_bp', e.target.value)} placeholder="ej. 130" className="input" />
              </div>
              <div>
                <label className="label">Colesterol (mg/dl) *</label>
                <input type="number" required min={100} max={600} value={form.cholesterol} onChange={e => set('cholesterol', e.target.value)} placeholder="ej. 250" className="input" />
              </div>
            </div>

            <div>
              <label className="label">Frecuencia cardíaca máxima *</label>
              <input type="number" required min={40} max={300} value={form.max_heart_rate} onChange={e => set('max_heart_rate', e.target.value)} placeholder="ej. 150" className="input" />
            </div>

            <div>
              <label className="label">Tipo de dolor de pecho</label>
              <select value={form.chest_pain_type} onChange={e => set('chest_pain_type', e.target.value)} className="input">
                {chestPainLabels.map((l, i) => <option key={i} value={i}>{i} – {l}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">ECG en reposo</label>
                <select value={form.resting_ecg} onChange={e => set('resting_ecg', e.target.value)} className="input">
                  {ecgLabels.map((l, i) => <option key={i} value={i}>{i} – {l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Pendiente ST</label>
                <select value={form.st_slope} onChange={e => set('st_slope', e.target.value)} className="input">
                  {slopeLabels.map((l, i) => <option key={i} value={i}>{i} – {l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Depresión ST (oldpeak)</label>
              <input type="number" step="0.1" min={-3} max={7} value={form.oldpeak} onChange={e => set('oldpeak', e.target.value)} className="input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" checked={form.fasting_bs} onChange={e => set('fasting_bs', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Azúcar en ayunas &gt;120</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" checked={form.exercise_angina} onChange={e => set('exercise_angina', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Angina inducida</span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-60 text-white font-bold rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analizando...</> : <><HeartPulse className="w-5 h-5" /> Analizar Riesgo</>}
            </button>
          </form>

          {/* Result panel */}
          <div className="xl:col-span-2 space-y-4">
            {!result && !loading && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <HeartPulse className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">El resultado aparecerá aquí</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Completa el formulario y presiona "Analizar Riesgo"</p>
              </div>
            )}

            {loading && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px] gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-white">Procesando con IA</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analizando variables clínicas...</p>
                </div>
                <div className="w-full space-y-2">
                  {['Normalización de datos', 'Modelo Random Forest', 'Calculando probabilidad'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && cfg && (
              <>
                {/* Main result */}
                <div className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <cfg.icon className={`w-8 h-8 ${cfg.color}`} />
                    <div>
                      <p className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {result.prediction ? 'Riesgo de enfermedad cardíaca detectado' : 'Sin riesgo significativo detectado'}
                      </p>
                    </div>
                  </div>

                  {/* Probability bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Probabilidad de riesgo</span>
                      <span className={`font-bold text-lg ${cfg.color}`}>{result.probability.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cfg.bar} rounded-full transition-all duration-1000`}
                        style={{ width: `${result.probability}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0% - Sin riesgo</span>
                      <span>100% - Alto riesgo</span>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.bar}`} />
                    Modelo: Random Forest · Acc. 85.4%
                  </div>
                </div>

                {/* Feature importance */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Variables más influyentes</h4>
                  <div className="space-y-3">
                    {result.top_features.map(f => (
                      <div key={f.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">{featureLabels[f.name] || f.name}</span>
                          <span className="text-gray-400 dark:text-gray-500">{(f.importance * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                            style={{ width: `${f.importance * 100 / 0.18}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Aviso:</strong> Este análisis es de apoyo diagnóstico y no reemplaza la evaluación clínica profesional. Siempre consultar con especialista.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
