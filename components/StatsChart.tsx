import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Prompt } from '../types';

interface StatsChartProps {
  prompts: Prompt[];
}

const COLORS = ['#14b8a6', '#8b5cf6', '#f43f5e', '#eab308', '#3b82f6', '#ec4899'];

const StatsChart: React.FC<StatsChartProps> = ({ prompts }) => {
  // Aggregate data by category
  const data = React.useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    prompts.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + p.viewCount;
    });

    return Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories by views
  }, [prompts]);

  if (prompts.length === 0) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg mb-8">
      <h3 className="text-lg font-bold text-white mb-4">Top Trending Categories (by Views)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                width={100}
                tickLine={false}
                axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#f0fdfa' }}
              cursor={{fill: 'transparent'}}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;