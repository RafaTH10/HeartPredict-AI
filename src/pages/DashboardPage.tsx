import { useEffect, useState } from 'react';
import { Users, HeartPulse, AlertTriangle, TrendingUp, Activity, Clock } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import KpiCard from '../components/KpiCard';
import { supabase, Patient, Prediction } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RecentPrediction extends Prediction {
  patients: Patient;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [predictions, setPredictions] = useState<RecentPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [{ data: pts }, { data: preds }] = await Promise.all([
        supabase.from('patients').select('*').eq('doctor_id', user.id).order('created_at', { ascending: false }),
        supabase.from('predictions').select('*, patients(*)').eq('doctor_id', user.id).order('created_at', { ascending: false }).limit(8),
      ]);
      setPatients((pts as Patient[]) || []);
      setPredictions((preds as RecentPrediction[]) || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const totalPatients = patients.length;
  const atRisk = predictions.filter(p => p.prediction).length;
  const accuracy = 85.4;
  const avgProbability = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + p.probability, 0) / predictions.length)
    : 0;

  const riskColors: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  const ageGroups = patients.reduce<Record<string, number>>((acc, p) => {
    const g = p.age < 40 ? '<40' : p.age < 60 ? '40-59' : '60+';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bienvenido, {profile?.full_name?.split(' ')[0] || 'Doctor'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Panel de monitoreo cardíaco — {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <a
            href="/predict"
            onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/predict'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-blue-600 transition-all"
          >
            <HeartPulse className="w-4 h-4" />
            Nueva Predicción
          </a>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Pacientes"
            value={loading ? '—' : totalPatients}
            subtitle="registros en sistema"
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-100 dark:bg-blue-900/40"
            trend={{ value: 12, positive: true }}
          />
          <KpiCard
            title="Pacientes en Riesgo"
            value={loading ? '—' : atRisk}
            subtitle="predicción positiva"
            icon={AlertTriangle}
            iconColor="text-red-500"
            iconBg="bg-red-100 dark:bg-red-900/40"
            trend={{ value: 3, positive: false }}
          />
          <KpiCard
            title="Precisión Modelo"
            value={`${accuracy}%`}
            subtitle="Random Forest · F1: 84%"
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          />
          <KpiCard
            title="Probabilidad Media"
            value={loading ? '—' : `${avgProbability}%`}
            subtitle="últimas predicciones"
            icon={Activity}
            iconColor="text-amber-600"
            iconBg="bg-amber-100 dark:bg-amber-900/40"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent predictions */}
          <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Predicciones Recientes</h3>
              <a
                href="/patients"
                onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/patients'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver todas
              </a>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            ) : predictions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <HeartPulse className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No hay predicciones aún</p>
                <a
                  href="/predict"
                  onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/predict'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                  className="mt-2 text-xs text-blue-500 hover:underline"
                >
                  Realizar primera predicción
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {predictions.map(pred => (
                  <div key={pred.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${pred.prediction ? 'bg-red-100 dark:bg-red-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
                      <HeartPulse className={`w-4 h-4 ${pred.prediction ? 'text-red-500' : 'text-emerald-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {pred.patients?.patient_name || 'Paciente'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(pred.created_at).toLocaleDateString('es-ES')} · {pred.patients?.age} años
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskColors[pred.risk_level]}`}>
                        {pred.risk_level === 'low' ? 'Bajo' : pred.risk_level === 'medium' ? 'Medio' : 'Alto'}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                        {pred.probability.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            {/* Age distribution */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Distribución por Edad</h3>
              {Object.keys(ageGroups).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(ageGroups).map(([group, count]) => {
                    const pct = totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0;
                    return (
                      <div key={group}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">{group} años</span>
                          <span className="text-gray-500 dark:text-gray-400">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Model accuracy */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Rendimiento Modelos</h3>
              <div className="space-y-3">
                {[
                  { name: 'Random Forest', acc: 85.4, color: 'from-blue-500 to-blue-400' },
                  { name: 'Logistic Reg.', acc: 82.1, color: 'from-emerald-500 to-emerald-400' },
                  { name: 'Decision Tree', acc: 78.6, color: 'from-amber-500 to-amber-400' },
                ].map(m => (
                  <div key={m.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">{m.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">{m.acc}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${m.color} rounded-full`} style={{ width: `${m.acc}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 opacity-80" />
                <span className="text-sm font-semibold opacity-90">Acción rápida</span>
              </div>
              <p className="text-xs opacity-75 mb-4">Realiza una predicción cardíaca ahora mismo</p>
              <a
                href="/predict"
                onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/predict'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className="block text-center py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors"
              >
                Iniciar predicción
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
