'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, TimeRange, ThemeMode, TelemetryStats } from '../lib/types';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  ArrowUp,
  ArrowDown,
  Minus,
  Maximize2,
} from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface HistoricalAnalyticsSectionProps {
  history: SensorReading[];
  thresholds: AlertThresholds;
  timeRange: TimeRange;
  onSelectTimeRange: (range: TimeRange) => void;
  theme: ThemeMode;
}

export const HistoricalAnalyticsSection: React.FC<HistoricalAnalyticsSectionProps> = ({
  history,
  thresholds,
  timeRange,
  onSelectTimeRange,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [chartMode, setChartMode] = useState<'separate' | 'combined'>('separate');

  // Compute aggregate statistics strictly from the real database history
  const stats: TelemetryStats = useMemo(() => {
    if (history.length === 0) {
      return {
        tempMin: null,
        tempMax: null,
        tempAvg: null,
        humidityMin: null,
        humidityMax: null,
        humidityAvg: null,
        sampleCount: 0,
        timeSpanMinutes: 0,
      };
    }

    const temps = history.map((r) => r.temperature_c);
    const hums = history.map((r) => r.humidity_pct);

    const tempMin = Math.min(...temps);
    const tempMax = Math.max(...temps);
    const tempAvg = temps.reduce((a, b) => a + b, 0) / temps.length;

    const humidityMin = Math.min(...hums);
    const humidityMax = Math.max(...hums);
    const humidityAvg = hums.reduce((a, b) => a + b, 0) / hums.length;

    const firstTime = new Date(history[0].timestamp).getTime();
    const lastTime = new Date(history[history.length - 1].timestamp).getTime();
    const timeSpanMinutes = Math.max(1, Math.round(Math.abs(lastTime - firstTime) / 60000));

    return {
      tempMin,
      tempMax,
      tempAvg,
      humidityMin,
      humidityMax,
      humidityAvg,
      sampleCount: history.length,
      timeSpanMinutes,
    };
  }, [history]);

  // Timestamps and series arrays
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

  // Theming colors
  const chartTextColor = isDark ? '#9CA3AF' : '#4B5563';
  const chartSplitColor = isDark ? '#1F2937' : '#E5E7EB';
  const tooltipBg = isDark ? '#111827' : '#FFFFFF';

  // Temperature chart option
  const tempChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: '#F59E0B',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: isDark ? '#F3F4F6' : '#111827', fontSize: 11, fontFamily: 'monospace' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div>
          <span style="color:#9CA3AF; font-size:10px;">${p.name}</span><br/>
          <strong style="color:#F59E0B;">Temperature:</strong> <b>${p.value} °C</b><br/>
          <span style="font-size:10px; color:#9CA3AF;">Optimal Range: ${thresholds.minTemp}–${thresholds.maxTemp} °C</span>
        </div>`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '15%', top: '12%', containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        show: history.length > 10,
        xAxisIndex: [0],
        bottom: 5,
        height: 18,
        borderColor: 'transparent',
        backgroundColor: isDark ? '#161F30' : '#F3F4F6',
        fillerColor: 'rgba(245, 158, 11, 0.2)',
        handleStyle: { color: '#F59E0B' },
        textStyle: { color: chartTextColor, fontSize: 9 },
      },
      { type: 'inside', xAxisIndex: [0] },
    ],
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: isDark ? '#374151' : '#D1D5DB' } },
      axisLabel: { color: chartTextColor, fontSize: 10, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'value',
      name: '°C',
      nameTextStyle: { color: chartTextColor, fontSize: 10 },
      min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minTemp - 1)),
      max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxTemp + 1)),
      splitLine: { lineStyle: { color: chartSplitColor, type: 'dashed' } },
      axisLabel: { color: chartTextColor, fontSize: 10, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'Brood Temperature',
        type: 'line',
        smooth: 0.35,
        showSymbol: history.length < 25,
        symbolSize: 6,
        data: temperatures,
        lineStyle: { width: 2.5, color: '#F59E0B' },
        itemStyle: { color: '#D97706', borderColor: '#FFFFFF', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.02)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { yAxis: thresholds.minTemp, lineStyle: { color: '#38BDF8', type: 'dashed' }, label: { formatter: 'Min 32°C', position: 'insideEndTop', color: '#38BDF8', fontSize: 9 } },
            { yAxis: thresholds.maxTemp, lineStyle: { color: '#F43F5E', type: 'dashed' }, label: { formatter: 'Max 36°C', position: 'insideEndTop', color: '#F43F5E', fontSize: 9 } },
          ],
        },
      },
    ],
  }), [timestamps, temperatures, thresholds, isDark, chartTextColor, chartSplitColor, tooltipBg, history.length]);

  // Humidity chart option
  const humChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: '#0284C7',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: isDark ? '#F3F4F6' : '#111827', fontSize: 11, fontFamily: 'monospace' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div>
          <span style="color:#9CA3AF; font-size:10px;">${p.name}</span><br/>
          <strong style="color:#0284C7;">Humidity:</strong> <b>${p.value} % RH</b><br/>
          <span style="font-size:10px; color:#9CA3AF;">Safe Range: ${thresholds.minHumidity}–${thresholds.maxHumidity} %</span>
        </div>`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '15%', top: '12%', containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        show: history.length > 10,
        xAxisIndex: [0],
        bottom: 5,
        height: 18,
        borderColor: 'transparent',
        backgroundColor: isDark ? '#161F30' : '#F3F4F6',
        fillerColor: 'rgba(2, 132, 199, 0.2)',
        handleStyle: { color: '#0284C7' },
        textStyle: { color: chartTextColor, fontSize: 9 },
      },
      { type: 'inside', xAxisIndex: [0] },
    ],
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: isDark ? '#374151' : '#D1D5DB' } },
      axisLabel: { color: chartTextColor, fontSize: 10, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'value',
      name: '% RH',
      nameTextStyle: { color: chartTextColor, fontSize: 10 },
      min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minHumidity - 5)),
      max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxHumidity + 5)),
      splitLine: { lineStyle: { color: chartSplitColor, type: 'dashed' } },
      axisLabel: { color: chartTextColor, fontSize: 10, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'Relative Humidity',
        type: 'line',
        smooth: 0.35,
        showSymbol: history.length < 25,
        symbolSize: 6,
        data: humidities,
        lineStyle: { width: 2.5, color: '#0284C7' },
        itemStyle: { color: '#0369A1', borderColor: '#FFFFFF', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(2, 132, 199, 0.3)' },
              { offset: 1, color: 'rgba(2, 132, 199, 0.02)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { yAxis: thresholds.minHumidity, lineStyle: { color: '#EAB308', type: 'dashed' }, label: { formatter: 'Min 50%', position: 'insideEndTop', color: '#EAB308', fontSize: 9 } },
            { yAxis: thresholds.maxHumidity, lineStyle: { color: '#F43F5E', type: 'dashed' }, label: { formatter: 'Max 70%', position: 'insideEndTop', color: '#F43F5E', fontSize: 9 } },
          ],
        },
      },
    ],
  }), [timestamps, humidities, thresholds, isDark, chartTextColor, chartSplitColor, tooltipBg, history.length]);

  // Combined Dual-Axis Chart Option
  const combinedChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: '#374151',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: isDark ? '#F3F4F6' : '#111827', fontSize: 11, fontFamily: 'monospace' },
    },
    legend: {
      data: ['Temperature (°C)', 'Humidity (% RH)'],
      textStyle: { color: chartTextColor, fontSize: 11 },
      top: 5,
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '16%', containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        show: history.length > 10,
        xAxisIndex: [0],
        bottom: 5,
        height: 18,
        borderColor: 'transparent',
        backgroundColor: isDark ? '#161F30' : '#F3F4F6',
        textStyle: { color: chartTextColor, fontSize: 9 },
      },
      { type: 'inside', xAxisIndex: [0] },
    ],
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: isDark ? '#374151' : '#D1D5DB' } },
      axisLabel: { color: chartTextColor, fontSize: 10, fontFamily: 'monospace' },
    },
    yAxis: [
      {
        type: 'value',
        name: '°C',
        position: 'left',
        nameTextStyle: { color: '#F59E0B', fontSize: 10 },
        splitLine: { lineStyle: { color: chartSplitColor, type: 'dashed' } },
        axisLabel: { color: chartTextColor, fontSize: 10, fontFamily: 'monospace' },
      },
      {
        type: 'value',
        name: '% RH',
        position: 'right',
        nameTextStyle: { color: '#0284C7', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: chartTextColor, fontSize: 10, fontFamily: 'monospace' },
      },
    ],
    series: [
      {
        name: 'Temperature (°C)',
        type: 'line',
        yAxisIndex: 0,
        smooth: 0.35,
        data: temperatures,
        lineStyle: { width: 2.2, color: '#F59E0B' },
        itemStyle: { color: '#F59E0B' },
      },
      {
        name: 'Humidity (% RH)',
        type: 'line',
        yAxisIndex: 1,
        smooth: 0.35,
        data: humidities,
        lineStyle: { width: 2.2, color: '#0284C7' },
        itemStyle: { color: '#0284C7' },
      },
    ],
  }), [timestamps, temperatures, humidities, isDark, chartTextColor, chartSplitColor, tooltipBg, history.length]);

  const timeRanges: { id: TimeRange; label: string }[] = [
    { id: '15m', label: '15m' },
    { id: '1h', label: '1 Hour' },
    { id: '6h', label: '6 Hours' },
    { id: '24h', label: '24 Hours' },
  ];

  return (
    <div className="space-y-4">
      
      {/* Top Filter Bar & Time-Range Selector */}
      <div className="panel-card rounded-lg p-3 bg-industrial-900 border-industrial-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-honey-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Historical Telemetry Range:
          </span>
          <div className="flex items-center space-x-1">
            {timeRanges.map((tr) => (
              <button
                key={tr.id}
                onClick={() => onSelectTimeRange(tr.id)}
                className={`px-3 py-1 rounded text-xs font-semibold font-mono transition-all ${
                  timeRange === tr.id
                    ? 'bg-honey-500/20 text-honey-400 border border-honey-500/40 shadow-xs'
                    : 'bg-industrial-850 text-industrial-400 border border-industrial-800 hover:text-white'
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Switcher: Separate / Combined */}
        <div className="flex items-center space-x-1 bg-industrial-850 p-1 rounded-md border border-industrial-800 text-xs font-medium">
          <button
            onClick={() => setChartMode('separate')}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
              chartMode === 'separate'
                ? 'bg-industrial-900 text-honey-400 shadow-xs'
                : 'text-industrial-400 hover:text-white'
            }`}
          >
            Dual Graphs
          </button>
          <button
            onClick={() => setChartMode('combined')}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
              chartMode === 'combined'
                ? 'bg-industrial-900 text-honey-400 shadow-xs'
                : 'text-industrial-400 hover:text-white'
            }`}
          >
            Combined Overlay
          </button>
        </div>
      </div>

      {/* Aggregate Statistics Tiles (Min, Max, Avg) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        
        {/* Sample Count */}
        <div className="panel-card rounded-lg p-3 bg-industrial-900 border-industrial-800">
          <span className="text-[10px] text-industrial-400 uppercase tracking-wider block mb-1">Data Points</span>
          <span className="text-lg font-bold font-mono text-white">{stats.sampleCount}</span>
          <span className="text-[10px] text-industrial-500 block mt-1">{stats.timeSpanMinutes}m window</span>
        </div>

        {/* Temp Min */}
        <div className="panel-card rounded-lg p-3 bg-industrial-900 border-industrial-800">
          <span className="text-[10px] text-industrial-400 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <ArrowDown className="w-3 h-3 text-sky-400" />
            <span>Min Temp</span>
          </span>
          <span className="text-lg font-bold font-mono text-white">
            {stats.tempMin !== null ? `${stats.tempMin.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[10px] text-industrial-500 block mt-1">Celsius</span>
        </div>

        {/* Temp Avg */}
        <div className="panel-card rounded-lg p-3 bg-industrial-900 border-industrial-800">
          <span className="text-[10px] text-honey-400 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <Minus className="w-3 h-3 text-honey-500" />
            <span>Mean Temp</span>
          </span>
          <span className="text-lg font-bold font-mono text-honey-400">
            {stats.tempAvg !== null ? `${stats.tempAvg.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[10px] text-industrial-500 block mt-1">Optimal: 34.5°C</span>
        </div>

        {/* Temp Max */}
        <div className="panel-card rounded-lg p-3 bg-industrial-900 border-industrial-800">
          <span className="text-[10px] text-industrial-400 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <ArrowUp className="w-3 h-3 text-rose-400" />
            <span>Max Temp</span>
          </span>
          <span className="text-lg font-bold font-mono text-white">
            {stats.tempMax !== null ? `${stats.tempMax.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[10px] text-industrial-500 block mt-1">Celsius</span>
        </div>

        {/* Humidity Min */}
        <div className="panel-card rounded-lg p-3 bg-industrial-900 border-industrial-800">
          <span className="text-[10px] text-industrial-400 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <ArrowDown className="w-3 h-3 text-honey-400" />
            <span>Min Humidity</span>
          </span>
          <span className="text-lg font-bold font-mono text-white">
            {stats.humidityMin !== null ? `${stats.humidityMin.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[10px] text-industrial-500 block mt-1">% RH</span>
        </div>

        {/* Humidity Avg */}
        <div className="panel-card rounded-lg p-3 bg-industrial-900 border-industrial-800">
          <span className="text-[10px] text-sky-400 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <Minus className="w-3 h-3 text-sky-400" />
            <span>Mean Humidity</span>
          </span>
          <span className="text-lg font-bold font-mono text-sky-400">
            {stats.humidityAvg !== null ? `${stats.humidityAvg.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[10px] text-industrial-500 block mt-1">Target: 60%</span>
        </div>

        {/* Humidity Max */}
        <div className="panel-card rounded-lg p-3 bg-industrial-900 border-industrial-800">
          <span className="text-[10px] text-industrial-400 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <ArrowUp className="w-3 h-3 text-rose-400" />
            <span>Max Humidity</span>
          </span>
          <span className="text-lg font-bold font-mono text-white">
            {stats.humidityMax !== null ? `${stats.humidityMax.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[10px] text-industrial-500 block mt-1">% RH</span>
        </div>

      </div>

      {/* Main ECharts Time-Series Rendering */}
      {chartMode === 'separate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Temperature Trend */}
          <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-4 h-4 text-honey-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Historical Temperature Trend
                </h3>
              </div>
              <span className="text-[10px] font-mono text-industrial-400">
                Interactive Zoom Slider Enabled
              </span>
            </div>

            <div className="h-72 w-full">
              {history.length > 0 ? (
                <ReactECharts
                  option={tempChartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-industrial-500">
                  No historical telemetry stored for this time window.
                </div>
              )}
            </div>
          </div>

          {/* Humidity Trend */}
          <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Historical Relative Humidity Trend
                </h3>
              </div>
              <span className="text-[10px] font-mono text-industrial-400">
                Interactive Zoom Slider Enabled
              </span>
            </div>

            <div className="h-72 w-full">
              {history.length > 0 ? (
                <ReactECharts
                  option={humChartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-industrial-500">
                  No historical telemetry stored for this time window.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Combined Dual-Axis Chart */
        <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-honey-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Combined Microclimate Telemetry Overlay
              </h3>
            </div>
            <span className="text-[10px] font-mono text-industrial-400">
              Left: Temperature (°C) · Right: Relative Humidity (% RH)
            </span>
          </div>

          <div className="h-80 w-full">
            {history.length > 0 ? (
              <ReactECharts
                option={combinedChartOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-industrial-500">
                No historical telemetry stored for this time window.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

