'use client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { estimateFPS } from '@/lib/fps-estimator';

export function FpsChartPlot({fpsData,isDark}: {fpsData:NonNullable<ReturnType<typeof estimateFPS>>;isDark:boolean}) {
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? '#94a3b8' : '#475569';
  return (        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fpsData.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvgBneck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorLowsBneck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#d946ef" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPeakBneck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />
            <XAxis
              dataKey="resolution"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
              domain={fpsData.isIntegratedGraphics ? [0, 80] : [0, 360]}
              ticks={fpsData.isIntegratedGraphics ? [0, 20, 40, 60, 80] : [0, 120, 240, 360]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/95 dark:bg-[#151922]/95 backdrop-blur-md border border-slate-300 dark:border-white/15 p-2.5 rounded-lg shadow-xl text-[11px]">
                      <div className="font-bold text-slate-700 dark:text-slate-300 mb-1 border-b border-slate-200 dark:border-white/10 pb-1">
                        {payload[0]?.payload?.resolution} FPS Details
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-3 text-amber-600 dark:text-amber-400 font-bold">
                          <span>Peak:</span>
                          <span>{payload[2]?.value ?? payload.find(p => p.dataKey === 'peak')?.value} FPS</span>
                        </div>
                        <div className="flex justify-between gap-3 text-cyan-600 dark:text-cyan-400 font-bold">
                          <span>Average:</span>
                          <span>{payload[1]?.value ?? payload.find(p => p.dataKey === 'average')?.value} FPS</span>
                        </div>
                        <div className="flex justify-between gap-3 text-fuchsia-600 dark:text-fuchsia-400 font-semibold">
                          <span>1% Lows:</span>
                          <span>{payload[0]?.value ?? payload.find(p => p.dataKey === 'lows')?.value} FPS</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="lows"
              stroke="#e879f9"
              strokeWidth={1.5}
              fill="url(#colorLowsBneck)"
            />
            <Area
              type="monotone"
              dataKey="average"
              stroke="#22d3ee"
              strokeWidth={2.5}
              fill="url(#colorAvgBneck)"
            />
            <Area
              type="monotone"
              dataKey="peak"
              stroke="#fbbf24"
              strokeWidth={1.5}
              fill="url(#colorPeakBneck)"
            />
          </AreaChart>
        </ResponsiveContainer>);
}
