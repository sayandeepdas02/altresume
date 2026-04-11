'use client';

import { useState, useEffect } from 'react';
import { getAnalytics, type AnalyticsData } from '@/services/careerApi';
import {
  BarChart, Activity, Target, Zap, Building, ChevronRight,
  TrendingDown, TrendingUp, AlertTriangle, Layers
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(res => {
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <div className="h-8 w-8 rounded-full border-2 border-[#4f0f62] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-600">Loading pattern analysis...</p>
      </div>
    );
  }

  if (!data || !data.has_data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Activity size={32} className="mx-auto text-gray-400 mb-3" />
        <h3 className="text-sm font-bold text-gray-900 mb-1">Not Enough Data</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Scan and evaluate more jobs to unlock rejection pattern analysis and conversion metrics.
        </p>
      </div>
    );
  }

  const funnelOrder = ['new', 'evaluated', 'applied', 'interview', 'offer', 'rejected', 'skipped'];
  const maxFunnel = Math.max(...Object.values(data.funnel));

  return (
    <div className="space-y-6">
      {/* Top Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">AI Recommendations</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-indigo-50/50">
                 <div className="flex items-start gap-2">
                   <div className={`mt-0.5 shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${
                      rec.impact === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                   }`}>
                     <AlertTriangle size={10} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-gray-900 mb-1">{rec.action}</p>
                     <p className="text-[10px] text-gray-500 leading-relaxed">{rec.reasoning}</p>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
             <BarChart size={14} /> Conversion Funnel
           </h3>
           <div className="space-y-3">
             {funnelOrder.map(stage => {
               const count = data.funnel[stage] || 0;
               if (count === 0 && stage !== 'new' && stage !== 'applied') return null;
               const pct = maxFunnel > 0 ? (count / maxFunnel) * 100 : 0;
               return (
                 <div key={stage} className="flex items-center gap-3">
                   <div className="w-20 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right shrink-0">
                     {stage}
                   </div>
                   <div className="flex-1 h-6 bg-gray-50 rounded-full overflow-hidden flex items-center relative border border-gray-100">
                     <div 
                       className={`absolute left-0 top-0 bottom-0 ${
                         stage === 'offer' ? 'bg-green-400' :
                         stage === 'interview' ? 'bg-blue-400' :
                         stage === 'rejected' ? 'bg-red-300' :
                         stage === 'skipped' ? 'bg-gray-300' :
                         'bg-[#4f0f62]/20'
                       }`}
                       style={{ width: \`\${pct}%\` }}
                     />
                     <span className="relative z-10 text-[10px] font-bold text-gray-800 ml-2">
                       {count}
                     </span>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Archetype Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
             <Target size={14} /> Archetype Performance
           </h3>
           <div className="space-y-3">
             {Object.entries(data.archetype_performance)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5)
                .map(([arch, stats]) => {
                  const conversionRate = stats.applied > 0 
                     ? Math.round(((stats.interview + stats.offer) / stats.applied) * 100) 
                     : 0;
                  
                  return (
                    <div key={arch} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                       <div>
                         <p className="text-xs font-bold text-gray-900">{arch}</p>
                         <p className="text-[10px] text-gray-500">
                           {stats.total} total · {stats.applied} applied · {stats.interview + stats.offer} positive
                         </p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs font-bold text-[#4f0f62]">{conversionRate}%</p>
                         <p className="text-[9px] uppercase tracking-wider text-gray-400">Conversion</p>
                       </div>
                    </div>
                  );
                })}
           </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
             <Activity size={14} /> Score Distribution
           </h3>
           <div className="flex items-end h-32 gap-2 mb-2">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-red-100 rounded-t-md relative flex items-end justify-center pb-2 transition-all"
                     style={{ height: \`\${Math.max(10, (data.score_buckets.low_fit / data.score_stats.total_scored) * 100)}%\` }}>
                   <span className="text-xs font-bold text-red-700">{data.score_buckets.low_fit}</span>
                </div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase">&lt; 2.5</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-yellow-100 rounded-t-md relative flex items-end justify-center pb-2 transition-all"
                     style={{ height: \`\${Math.max(10, (data.score_buckets.medium_fit / data.score_stats.total_scored) * 100)}%\` }}>
                   <span className="text-xs font-bold text-yellow-700">{data.score_buckets.medium_fit}</span>
                </div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase">2.5 - 3.4</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-green-100 rounded-t-md relative flex items-end justify-center pb-2 transition-all"
                     style={{ height: \`\${Math.max(10, (data.score_buckets.high_fit / data.score_stats.total_scored) * 100)}%\` }}>
                   <span className="text-xs font-bold text-green-700">{data.score_buckets.high_fit}</span>
                </div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase">&gt;= 3.5</span>
              </div>
           </div>
           <p className="text-[10px] text-center text-gray-500 mt-2">
              Average Score: <strong className="text-gray-900">{data.score_stats.avg}/5</strong> globally
           </p>
        </div>

        {/* Top Skill Gaps */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
             <Layers size={14} /> Recurring Skill Gaps
           </h3>
           <div className="flex flex-wrap gap-2">
             {data.top_skill_gaps.map(gap => (
                <div key={gap.skill} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                  <span className="text-xs font-medium text-red-800">{gap.skill}</span>
                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-red-500 font-bold">{gap.frequency}</span>
                </div>
             ))}
             {data.top_skill_gaps.length === 0 && (
               <p className="text-xs text-gray-500">No significant skill gaps detected.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
