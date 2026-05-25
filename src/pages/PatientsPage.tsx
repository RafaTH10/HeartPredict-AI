import { useEffect, useState } from 'react';
import { Search, Download, Users, HeartPulse, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { supabase, Prediction, Patient } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Row extends Prediction {
  patients: Patient;
}

const PAGE_SIZE = 10;

const riskColors: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
const riskLabels: Record<string, string> = { low: 'Bajo', medium: 'Medio', high: 'Alto' };

const chestPainLabels = ['Angina típica', 'Angina atípica', 'No-anginoso', 'Asintomático'];
const ecgLabels = ['Normal', 'Anormalidad ST-T', 'Hipertrofia VI'];
const slopeLabels = ['Ascendente', 'Plano', 'Descendente'];

function DetailModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const p = row.patients;
  const riskBg: Record<string, string> = {
    low: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700',
    medium: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700',
    high: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
  };
  const riskText: Record<string, string> = {
    low: 'text-emerald-700 dark:text-emerald-300',
    medium: 'text-amber-700 dark:text-amber-300',
    high: 'text-red-700 dark:text-red-300',
  };
  const barColor: Record<string, string> = {
    low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-red-500',
  };

  const clinicalFields = [
    { label: 'Nombre', value: p?.patient_name || 'Anónimo' },
    { label: 'Edad', value: `${p?.age} años` },
    { label: 'Sexo', value: p?.sex === 'male' ? 'Masculino' : 'Femenino' },
    { label: 'Presión arterial', value: `${p?.resting_bp} mmHg` },
    { label: 'Colesterol', value: `${p?.cholesterol} mg/dl` },
    { label: 'Frec. cardíaca máx.', value: `${p?.max_heart_rate} bpm` },
    { label: 'Tipo dolor de pecho', value: chestPainLabels[p?.chest_pain_type ?? 0] },
    { label: 'ECG en reposo', value: ecgLabels[p?.resting_ecg ?? 0] },
    { label: 'Pendiente ST', value: slopeLabels[p?.st_slope ?? 0] },
    { label: 'Depresión ST (oldpeak)', value: `${p?.oldpeak}` },
    { label: 'Azúcar en ayunas >120', value: p?.fasting_bs ? 'Sí' : 'No' },
    { label: 'Angina inducida', value: p?.exercise_angina ? 'Sí' : 'No' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{p?.patient_name?.charAt(0)?.toUpperCase() || 'A'}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{p?.patient_name || 'Anónimo'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(row.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Result summary */}
          <div className={`rounded-xl border p-4 ${riskBg[row.risk_level]}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${riskText[row.risk_level]}`}>
                Riesgo {riskLabels[row.risk_level]} — {row.prediction ? 'Positivo' : 'Negativo'}
              </span>
              <span className={`text-lg font-bold ${riskText[row.risk_level]}`}>{row.probability.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/60 dark:bg-black/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor[row.risk_level]} transition-all duration-700`} style={{ width: `${row.probability}%` }} />
            </div>
            <p className="text-xs mt-2 opacity-70 {riskText[row.risk_level]}">Modelo: {row.model_used?.replace('_', ' ')}</p>
          </div>

          {/* Clinical data */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos Clínicos</p>
            <div className="grid grid-cols-2 gap-2">
              {clinicalFields.map(f => (
                <div key={f.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top features */}
          {row.top_features && row.top_features.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Variables más influyentes</p>
              <div className="space-y-2">
                {row.top_features.map((f, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-300 font-medium capitalize">{f.name.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500 dark:text-gray-400">{(f.importance * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${f.importance * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Row | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('predictions')
        .select('*, patients(*)')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });
      setRows((data as Row[]) || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const filtered = rows.filter(r => {
    const nameMatch = r.patients?.patient_name?.toLowerCase().includes(search.toLowerCase());
    const riskMatch = filterRisk === 'all' || r.risk_level === filterRisk;
    return nameMatch && riskMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCSV() {
    const header = [
      'Paciente','Edad','Sexo','Resultado','Probabilidad','Riesgo','Fecha',
      'Presion_arterial','Colesterol','Frec_cardiaca_max','Dolor_pecho','ECG_reposo',
      'Pendiente_ST','Depresion_ST','Azucar_ayunas','Angina_inducida','Modelo',
    ];
    const csvRows = filtered.map(r => [
      r.patients?.patient_name || 'Anónimo',
      r.patients?.age,
      r.patients?.sex === 'male' ? 'M' : 'F',
      r.prediction ? 'Positivo' : 'Negativo',
      `${r.probability.toFixed(1)}%`,
      riskLabels[r.risk_level],
      new Date(r.created_at).toLocaleDateString('es-ES'),
      r.patients?.resting_bp,
      r.patients?.cholesterol,
      r.patients?.max_heart_rate,
      chestPainLabels[r.patients?.chest_pain_type ?? 0],
      ecgLabels[r.patients?.resting_ecg ?? 0],
      slopeLabels[r.patients?.st_slope ?? 0],
      r.patients?.oldpeak,
      r.patients?.fasting_bs ? 'Sí' : 'No',
      r.patients?.exercise_angina ? 'Sí' : 'No',
      r.model_used?.replace('_', ' '),
    ]);
    const csv = [header, ...csvRows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pacientes_heartpredict.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout title="Historial de Pacientes">
      {selected && <DetailModal row={selected} onClose={() => setSelected(null)} />}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Pacientes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{filtered.length} registros encontrados</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar paciente..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterRisk}
            onChange={e => { setFilterRisk(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los riesgos</option>
            <option value="low">Riesgo Bajo</option>
            <option value="medium">Riesgo Medio</option>
            <option value="high">Riesgo Alto</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Edad</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sexo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resultado</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Probabilidad</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Riesgo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron registros</p>
                    </td>
                  </tr>
                ) : (
                  pageRows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {row.patients?.patient_name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{row.patients?.patient_name || 'Anónimo'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{row.patients?.age}</td>
                      <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{row.patients?.sex === 'male' ? 'Masculino' : 'Femenino'}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          <HeartPulse className={`w-4 h-4 ${row.prediction ? 'text-red-500' : 'text-emerald-500'}`} />
                          <span className={`text-xs font-semibold ${row.prediction ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {row.prediction ? 'Positivo' : 'Negativo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.risk_level === 'high' ? 'bg-red-500' : row.risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${row.probability}%` }}
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{row.probability.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${riskColors[row.risk_level]}`}>
                          {riskLabels[row.risk_level]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(row.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setSelected(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
