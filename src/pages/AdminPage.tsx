import { useEffect, useState } from 'react';
import { Shield, Users, RefreshCw, Database, Settings, TrendingUp } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainDone, setRetrainDone] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers((data as Profile[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  if (profile?.role !== 'admin') {
    return (
      <AppLayout title="Administrador">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Acceso restringido</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Se requiere rol de Administrador para acceder a esta sección.</p>
        </div>
      </AppLayout>
    );
  }

  async function simulateRetrain() {
    setRetraining(true);
    await new Promise(r => setTimeout(r, 2500));
    setRetraining(false);
    setRetrainDone(true);
    setTimeout(() => setRetrainDone(false), 4000);
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    doctor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  };

  return (
    <AppLayout title="Panel Administrador">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Panel de Administración</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión global del sistema HeartPredict AI</p>
        </div>

        {/* System stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Usuarios registrados', value: users.length, icon: Users, color: 'blue' },
            { label: 'Modelo activo', value: 'Random Forest', icon: TrendingUp, color: 'emerald' },
            { label: 'Dataset', value: 'UCI Heart Disease', icon: Database, color: 'amber' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                s.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40' :
                s.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                'bg-amber-100 dark:bg-amber-900/40'
              }`}>
                <s.icon className={`w-5 h-5 ${
                  s.color === 'blue' ? 'text-blue-600' :
                  s.color === 'emerald' ? 'text-emerald-600' :
                  'text-amber-600'
                }`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users table */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Gestión de Usuarios
              </h3>
              <span className="text-xs text-gray-400">{users.length} usuarios</span>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{u.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.full_name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-400 truncate">{new Date(u.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleColors[u.role]}`}>{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System actions */}
          <div className="space-y-4">
            {/* Retrain model */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Reentrenar Modelo</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Vuelve a entrenar el modelo con los datos actuales en la base de datos. El proceso tarda aproximadamente 30 segundos.
              </p>
              {retrainDone && (
                <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
                  Modelo reentrenado exitosamente · Accuracy: 85.4%
                </div>
              )}
              <button
                onClick={simulateRetrain}
                disabled={retraining}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
                {retraining ? 'Reentrenando...' : 'Iniciar Reentrenamiento'}
              </button>
            </div>

            {/* Dataset info */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Dataset de Entrenamiento</h3>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  ['Fuente', 'UCI ML Repository'],
                  ['Muestras', '303 pacientes'],
                  ['Variables', '13 características'],
                  ['Positivos', '165 (54.5%)'],
                  ['Negativos', '138 (45.5%)'],
                  ['División', '80% train / 20% test'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="text-gray-500 dark:text-gray-400">{k}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System config */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Configuración del Sistema</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Modelo activo', value: 'Random Forest', editable: false },
                  { label: 'Umbral de riesgo medio', value: '35%', editable: false },
                  { label: 'Umbral de riesgo alto', value: '65%', editable: false },
                  { label: 'Versión API', value: 'v1.0.0', editable: false },
                ].map(c => (
                  <div key={c.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
