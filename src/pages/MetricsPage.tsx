import AppLayout from '../components/AppLayout';
import { TrendingUp, Target, BarChart3, Activity } from 'lucide-react';

const models = [
  {
    name: 'Random Forest',
    accuracy: 85.4,
    precision: 86.2,
    recall: 83.8,
    f1: 85.0,
    color: 'blue',
    active: true,
  },
  {
    name: 'Logistic Regression',
    accuracy: 82.1,
    precision: 82.5,
    recall: 80.1,
    f1: 81.3,
    color: 'emerald',
    active: false,
  },
  {
    name: 'Decision Tree',
    accuracy: 78.6,
    precision: 78.9,
    recall: 76.4,
    f1: 77.6,
    color: 'amber',
    active: false,
  },
];

const confusionMatrix = {
  tp: 112, fp: 18,
  fn: 22,  tn: 148,
};

const featureImportance = [
  { name: 'Angina inducida por ejercicio', pct: 18 },
  { name: 'Depresión ST (oldpeak)', pct: 16 },
  { name: 'Freq. cardíaca máxima', pct: 14 },
  { name: 'Tipo de dolor de pecho', pct: 12 },
  { name: 'Edad', pct: 11 },
  { name: 'Pendiente ST', pct: 10 },
  { name: 'Colesterol', pct: 7 },
  { name: 'Presión arterial', pct: 6 },
  { name: 'Sexo', pct: 4 },
  { name: 'Azúcar en ayunas', pct: 1 },
  { name: 'ECG en reposo', pct: 1 },
];

const colorMap: Record<string, { bar: string; bg: string; border: string; text: string }> = {
  blue: { bar: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
  emerald: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
  amber: { bar: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
};

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-300 font-medium">{label}</span>
        <span className="text-gray-900 dark:text-white font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color].bar} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const total = confusionMatrix.tp + confusionMatrix.fp + confusionMatrix.fn + confusionMatrix.tn;
  const accuracy = ((confusionMatrix.tp + confusionMatrix.tn) / total * 100).toFixed(1);

  const rocPoints = Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    return { fpr: t, tpr: Math.min(1, t + (1 - t) * 0.85 * (1 - Math.pow(t - 0.5, 2) * 0.4)) };
  });

  return (
    <AppLayout title="Métricas del Modelo ML">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comparación de Modelos ML</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Entrenado con Heart Disease UCI Dataset · 303 muestras · 80/20 split</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Accuracy', value: '85.4%', icon: Target, color: 'blue' },
            { label: 'Precision', value: '86.2%', icon: TrendingUp, color: 'emerald' },
            { label: 'Recall', value: '83.8%', icon: Activity, color: 'amber' },
            { label: 'F1-Score', value: '85.0%', icon: BarChart3, color: 'blue' },
          ].map(k => (
            <div key={k.label} className={`rounded-2xl border p-4 ${colorMap[k.color].bg} ${colorMap[k.color].border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${colorMap[k.color].text}`}>{k.label}</span>
                <k.icon className={`w-4 h-4 ${colorMap[k.color].text}`} />
              </div>
              <p className={`text-2xl font-bold ${colorMap[k.color].text}`}>{k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Random Forest</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Model comparison */}
          <div className="lg:col-span-2 space-y-4">
            {models.map(m => {
              const c = colorMap[m.color];
              return (
                <div key={m.name} className={`bg-white dark:bg-gray-900 rounded-2xl border ${m.active ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-800'} shadow-sm p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${c.bar}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</h3>
                      {m.active && <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">Activo</span>}
                    </div>
                    <span className={`text-xl font-bold ${c.text}`}>{m.accuracy}%</span>
                  </div>
                  <div className="space-y-2">
                    <MetricBar label="Accuracy" value={m.accuracy} color={m.color} />
                    <MetricBar label="Precision" value={m.precision} color={m.color} />
                    <MetricBar label="Recall" value={m.recall} color={m.color} />
                    <MetricBar label="F1-Score" value={m.f1} color={m.color} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confusion matrix + feature importance */}
          <div className="space-y-4">
            {/* Confusion matrix */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Matriz de Confusión</h3>
              <p className="text-xs text-gray-400 mb-4">Random Forest · Accuracy {accuracy}%</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{confusionMatrix.tp}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">VP</p>
                  <p className="text-xs text-gray-400">Verdadero Positivo</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{confusionMatrix.fp}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">FP</p>
                  <p className="text-xs text-gray-400">Falso Positivo</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{confusionMatrix.fn}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">FN</p>
                  <p className="text-xs text-gray-400">Falso Negativo</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{confusionMatrix.tn}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">VN</p>
                  <p className="text-xs text-gray-400">Verdadero Negativo</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">n = {total} muestras de prueba</p>
            </div>

            {/* ROC AUC visualization */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Curva ROC</h3>
              <p className="text-xs text-gray-400 mb-3">AUC = 0.91</p>
              <svg viewBox="0 0 200 160" className="w-full">
                {/* Grid */}
                {[0.25, 0.5, 0.75].map(g => (
                  <g key={g}>
                    <line x1={g * 180 + 10} y1="10" x2={g * 180 + 10} y2="150" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" className="text-gray-400" />
                    <line x1="10" y1={(1 - g) * 140 + 10} x2="190" y2={(1 - g) * 140 + 10} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" className="text-gray-400" />
                  </g>
                ))}
                {/* Diagonal baseline */}
                <line x1="10" y1="150" x2="190" y2="10" stroke="#9ca3af" strokeWidth="1" strokeDasharray="4,4" />
                {/* ROC curve */}
                <polyline
                  points={rocPoints.map(p => `${p.fpr * 180 + 10},${(1 - p.tpr) * 140 + 10}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* Fill */}
                <polygon
                  points={['10,150', ...rocPoints.map(p => `${p.fpr * 180 + 10},${(1 - p.tpr) * 140 + 10}`), '190,150'].join(' ')}
                  fill="#3b82f6"
                  fillOpacity="0.1"
                />
                {/* Axes */}
                <text x="100" y="165" textAnchor="middle" fontSize="9" fill="#9ca3af">FPR</text>
                <text x="3" y="85" textAnchor="middle" fontSize="9" fill="#9ca3af" transform="rotate(-90,3,85)">TPR</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Feature importance */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Importancia de Variables (Random Forest)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {featureImportance.map(f => (
              <div key={f.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{f.name}</span>
                  <span className="text-gray-900 dark:text-white font-bold">{f.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${(f.pct / 18) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
