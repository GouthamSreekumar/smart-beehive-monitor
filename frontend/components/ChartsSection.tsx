'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, TimeRange } from '../lib/types';
import { Sparkles, Calendar, TrendingUp } from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ChartsSectionProps {
  history: SensorReading[];
  thresholds: AlertThresholds;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  isLoading: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  history,
  thresholds,
  timeRange,
  setTimeRange,
}) => {
  const { timestamps, temperatures, humidities } = useMemo(() => {
    const times: string[] = [];
    const temps: number[] = [];
    const hums: number[] = [];

    history.forEach((r) => {
      const d = new Date(r.timestamp);
      times.push(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      temps.push(r.temperature_c);
      hums.push(r.humidity_pct);
    });

    return { timestamps: times, temperatures: temps, humidities: hums };
  }, [history]);

  // Modern interactive temperature chart with golden honey gradient
  const tempChartOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#f59e0b',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#1c1917', fontSize: 11 },
        formatter: (params: any) => {
          const p = params[0];
          return `<div class="font-sans">
            <span class="text-stone-400 text-[10px] font-mono">${p.name}</span><br/>
            <span class="text-xs font-bold text-amber-700">Temperature:</span> <b>${p.value} °C</b><br/>
            <span class="text-[10px] text-stone-500">Target Range: ${thresholds.minTemp}–${thresholds.maxTemp} °C</span>
          </div>`;
        },
      },
      grid: {
        left: '3%',
        right: '3%',
        bottom: '8%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e7e5e4' } },
        axisLabel: { color: '#a8a29e', fontSize: 10, fontFamily: 'monospace' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '°C',
        nameTextStyle: { color: '#a8a29e', fontSize: 10 },
        min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minTemp - 1)),
        max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxTemp + 1)),
        splitLine: { lineStyle: { color: '#f5f5f4', type: 'dashed' } },
        axisLabel: { color: '#a8a29e', fontSize: 10, fontFamily: 'monospace' },
      },
      series: [
        {
          name: 'Temperature',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 25,
          symbolSize: 6,
          data: temperatures,
          lineStyle: { width: 2.5, color: '#f59e0b' },
          itemStyle: { color: '#d97706', borderColor: '#ffffff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 158, 11, 0.28)' },
                { offset: 0.8, color: 'rgba(245, 158, 11, 0.02)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.0)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: thresholds.maxTemp,
                lineStyle: { color: '#ef4444', type: 'dashed', width: 1.2 },
                label: { formatter: `Max ${thresholds.maxTemp}°C`, position: 'insideEndTop', color: '#dc2626', fontSize: 9 },
              },
              {
                yAxis: thresholds.minTemp,
                lineStyle: { color: '#3b82f6', type: 'dashed', width: 1.2 },
                label: { formatter: `Min ${thresholds.minTemp}°C`, position: 'insideEndBottom', color: '#2563eb', fontSize: 9 },
              },
            ],
          },
        },
      ],
    };
  }, [timestamps, temperatures, thresholds, history.length]);

  // Humidity chart with cyan water droplet gradient
  const humChartOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#06b6d4',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#1c1917', fontSize: 11 },
        formatter: (params: any) => {
          const p = params[0];
          return `<div class="font-sans">
            <span class="text-stone-400 text-[10px] font-mono">${p.name}</span><br/>
            <span class="text-xs font-bold text-cyan-700">Relative Humidity:</span> <b>${p.value} %</b><br/>
            <span class="text-[10px] text-stone-500">Target Range: ${thresholds.minHumidity}–${thresholds.maxHumidity} %</span>
          </div>`;
        },
      },
      grid: {
        left: '3%',
        right: '3%',
        bottom: '8%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e7e5e4' } },
        axisLabel: { color: '#a8a29e', fontSize: 10, fontFamily: 'monospace' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '%',
        nameTextStyle: { color: '#a8a29e', fontSize: 10 },
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: '#f5f5f4', type: 'dashed' } },
        axisLabel: { color: '#a8a29e', fontSize: 10, fontFamily: 'monospace' },
      },
      series: [
        {
          name: 'Humidity',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 25,
          symbolSize: 6,
          data: humidities,
          lineStyle: { width: 2.5, color: '#06b6d4' },
          itemStyle: { color: '#0891b2', borderColor: '#ffffff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(6, 182, 212, 0.28)' },
                { offset: 0.8, color: 'rgba(6, 182, 212, 0.02)' },
                { offset: 1, color: 'rgba(6, 182, 212, 0.0)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: thresholds.maxHumidity,
                lineStyle: { color: '#f97316', type: 'dashed', width: 1.2 },
                label: { formatter: `Max ${thresholds.maxHumidity}%`, position: 'insideEndTop', color: '#ea580c', fontSize: 9 },
              },
              {
                yAxis: thresholds.minHumidity,
                lineStyle: { color: '#3b82f6', type: 'dashed', width: 1.2 },
                label: { formatter: `Min ${thresholds.minHumidity}%`, position: 'insideEndBottom', color: '#2563eb', fontSize: 9 },
              },
            ],
          },
        },
      ],
    };
  }, [timestamps, humidities, thresholds, history.length]);

  return (
    <div className="space-y-4">
      
      {/* Range switch bar with clean pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-[#44403c] uppercase tracking-wider">
            Microclimate Time Series
          </span>
          <span className="font-mono text-[11px] text-[#78716c] px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200">
            {history.length} samples
          </span>
        </div>

        {/* Time filters */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-stone-100 border border-stone-200/80">
          {(
            [
              { id: '15m', label: '15 Min' },
              { id: '1h', label: '1 Hour' },
              { id: '6h', label: '6 Hours' },
              { id: '24h', label: '24 Hours' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeRange === t.id
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Temperature chart container */}
        <div className="glass-card rounded-2xl p-5 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#44403c]">Brood Temperature Curve</span>
            <span className="text-[10px] font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Optimal: {thresholds.minTemp}–{thresholds.maxTemp}°C
            </span>
          </div>
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-stone-400 space-y-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <span>Awaiting telemetry data points...</span>
            </div>
          ) : (
            <ReactECharts option={tempChartOption} style={{ height: '270px', width: '100%' }} notMerge={true} />
          )}
        </div>

        {/* Humidity chart container */}
        <div className="glass-card rounded-2xl p-5 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#44403c]">Relative Humidity Curve</span>
            <span className="text-[10px] font-mono text-cyan-700 font-semibold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              Optimal: {thresholds.minHumidity}–{thresholds.maxHumidity}%
            </span>
          </div>
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-stone-400 space-y-2">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>Awaiting telemetry data points...</span>
            </div>
          ) : (
            <ReactECharts option={humChartOption} style={{ height: '270px', width: '100%' }} notMerge={true} />
          )}
        </div>

      </div>

    </div>
  );
};
