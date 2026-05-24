import { useEffect, useState } from 'react';
import { Search, Download, Users, HeartPulse, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function PatientsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [page, setPage] = useState(1);

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
    const header = ['Paciente', 'Edad', 'Sexo', 'Resultado', 'Probabilidad', 'Riesgo', 'Fecha'];
    const csvRows = filtered.map(r => [
      r.patients?.patient_name || 'Anónimo',
      r.patients?.age,
      r.patients?.sex === 'male' ? 'M' : 'F',
      r.prediction ? 'Positivo' : 'Negativo',
      `${r.probability.toFixed(1)}%`,
      riskLabels[r.risk_level],
      new Date(r.created_at).toLocaleDateString('es-ES'),
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
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
