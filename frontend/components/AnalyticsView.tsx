'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, TimeRange, TelemetryStats } from '../lib/types';
import {
  Calendar,
  Thermometer,
  Droplets,
  ArrowDown,
  ArrowUp,
  Minus,
  Layers,
  Clock,
} from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface AnalyticsViewProps {
  history: SensorReading[];
  thresholds: AlertThresholds;
  timeRange: TimeRange;
  onSelectTimeRange: (range: TimeRange) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  history,
  thresholds,
  timeRange,
  onSelectTimeRange,
}) => {
  const [viewType, setViewType] = useState<'individual' | 'combined'>('individual');

  // Compute summary stats strictly from genuine historical readings
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

    return {
      tempMin,
      tempMax,
      tempAvg,
      humidityMin,
      humidityMax,
      humidityAvg,
      sampleCount: history.length,
    };
  }, [history]);

  // Timestamps and series arrays
  const timestamps = useMemo(() => {
    return history.map((r) => {
      const d = new Date(r.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }, [history]);

  const temperatures = useMemo(() => history.map((r) => r.temperature_c), [history]);
  const humidities = useMemo(() => history.map((r) => r.humidity_pct), [history]);

  // Time filters
  const ranges: { id: TimeRange; label: string }[] = [
    { id: '15m', label: '15m' },
    { id: '1h', label: '1 Hour' },
    { id: '6h', label: '6 Hours' },
    { id: '24h', label: '24 Hours' },
  ];

  // ECharts Options
  const tempChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5EAE3',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#25352B', fontSize: 12 },
      shadowColor: 'rgba(37, 53, 43, 0.04)',
      shadowBlur: 8,
    },
    grid: { left: '2%', right: '2%', bottom: '12%', top: '10%', containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        show: history.length > 15,
        bottom: 5,
        height: 16,
        borderColor: '#E5EAE3',
        backgroundColor: '#F7F9F6',
        fillerColor: 'rgba(71, 122, 85, 0.15)',
        handleStyle: { color: '#477A55' },
        textStyle: { color: '#788579', fontSize: 10 },
      },
      { type: 'inside' },
    ],
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E5EAE3' } },
      axisTick: { show: false },
      axisLabel: { color: '#788579', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '°C',
      nameTextStyle: { color: '#477A55', fontSize: 11 },
      min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minTemp - 1)),
      max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxTemp + 1)),
      splitLine: { lineStyle: { color: '#F0F4EF', type: 'solid' } },
      axisLabel: { color: '#788579', fontSize: 11 },
    },
    series: [
      {
        name: 'Brood Temperature',
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        data: temperatures,
        lineStyle: { width: 2.2, color: '#477A55' },
        itemStyle: { color: '#477A55' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(71, 122, 85, 0.16)' },
              { offset: 1, color: 'rgba(71, 122, 85, 0.0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { yAxis: thresholds.minTemp, lineStyle: { color: '#788579', type: 'dashed' }, label: { formatter: 'Min 32°C', position: 'insideEndTop', color: '#5C6C5E', fontSize: 10 } },
            { yAxis: thresholds.maxTemp, lineStyle: { color: '#D9534F', type: 'dashed' }, label: { formatter: 'Max 36°C', position: 'insideEndTop', color: '#D9534F', fontSize: 10 } },
          ],
        },
      },
    ],
  }), [timestamps, temperatures, thresholds, history.length]);

  const humChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5EAE3',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#25352B', fontSize: 12 },
      shadowColor: 'rgba(37, 53, 43, 0.04)',
      shadowBlur: 8,
    },
    grid: { left: '2%', right: '2%', bottom: '12%', top: '10%', containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        show: history.length > 15,
        bottom: 5,
        height: 16,
        borderColor: '#E5EAE3',
        backgroundColor: '#F7F9F6',
        fillerColor: 'rgba(217, 154, 53, 0.15)',
        handleStyle: { color: '#D99A35' },
        textStyle: { color: '#788579', fontSize: 10 },
      },
      { type: 'inside' },
    ],
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E5EAE3' } },
      axisTick: { show: false },
      axisLabel: { color: '#788579', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '% RH',
      nameTextStyle: { color: '#D99A35', fontSize: 11 },
      min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minHumidity - 5)),
      max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxHumidity + 5)),
      splitLine: { lineStyle: { color: '#F0F4EF', type: 'solid' } },
      axisLabel: { color: '#788579', fontSize: 11 },
    },
    series: [
      {
        name: 'Relative Humidity',
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        data: humidities,
        lineStyle: { width: 2.2, color: '#D99A35' },
        itemStyle: { color: '#D99A35' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(217, 154, 53, 0.16)' },
              { offset: 1, color: 'rgba(217, 154, 53, 0.0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { yAxis: thresholds.minHumidity, lineStyle: { color: '#788579', type: 'dashed' }, label: { formatter: 'Min 50%', position: 'insideEndTop', color: '#5C6C5E', fontSize: 10 } },
            { yAxis: thresholds.maxHumidity, lineStyle: { color: '#D9534F', type: 'dashed' }, label: { formatter: 'Max 70%', position: 'insideEndTop', color: '#D9534F', fontSize: 10 } },
          ],
        },
      },
    ],
  }), [timestamps, humidities, thresholds, history.length]);

  return (
    <div className="space-y-6">
      
      {/* Top Controls: Range selection & Graph toggle */}
      <div className="agri-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-primary-600" />
          <span className="text-xs font-semibold text-ink-primary">
            Analysis Window:
          </span>
          <div className="flex items-center space-x-1 bg-canvas p-1 rounded-lg border border-border-light">
            {ranges.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectTimeRange(r.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeRange === r.id
                    ? 'bg-surface text-ink-primary shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-canvas p-1 rounded-lg border border-border-light self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewType('individual')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              viewType === 'individual'
                ? 'bg-surface text-ink-primary shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            Individual Charts
          </button>
          <button
            onClick={() => setViewType('combined')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              viewType === 'combined'
                ? 'bg-surface text-ink-primary shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            Combined Overlay
          </button>
        </div>
      </div>

      {/* Summary Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        
        {/* Readings Count */}
        <div className="agri-card p-4">
          <span className="text-xs text-ink-muted block mb-1">Total Readings</span>
          <span className="text-xl font-bold text-ink-primary">{stats.sampleCount}</span>
          <span className="text-[11px] text-ink-faint block mt-1">Recorded points</span>
        </div>

        {/* Temp Min */}
        <div className="agri-card p-4">
          <span className="text-xs text-ink-muted flex items-center space-x-1 mb-1">
            <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
            <span>Min Temp</span>
          </span>
          <span className="text-xl font-bold text-ink-primary">
            {stats.tempMin !== null ? `${stats.tempMin.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1">Celsius</span>
        </div>

        {/* Temp Avg */}
        <div className="agri-card p-4">
          <span className="text-xs text-ink-muted flex items-center space-x-1 mb-1">
            <Minus className="w-3.5 h-3.5 text-primary-600" />
            <span>Avg Temp</span>
          </span>
          <span className="text-xl font-bold text-primary-700">
            {stats.tempAvg !== null ? `${stats.tempAvg.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1">Target: ~34.5°C</span>
        </div>

        {/* Temp Max */}
        <div className="agri-card p-4">
          <span className="text-xs text-ink-muted flex items-center space-x-1 mb-1">
            <ArrowUp className="w-3.5 h-3.5 text-status-critical" />
            <span>Max Temp</span>
          </span>
          <span className="text-xl font-bold text-ink-primary">
            {stats.tempMax !== null ? `${stats.tempMax.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1">Celsius</span>
        </div>

        {/* Humidity Min */}
        <div className="agri-card p-4">
          <span className="text-xs text-ink-muted flex items-center space-x-1 mb-1">
            <ArrowDown className="w-3.5 h-3.5 text-honey-600" />
            <span>Min Humidity</span>
          </span>
          <span className="text-xl font-bold text-ink-primary">
            {stats.humidityMin !== null ? `${stats.humidityMin.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1">% RH</span>
        </div>

        {/* Humidity Avg */}
        <div className="agri-card p-4">
          <span className="text-xs text-ink-muted flex items-center space-x-1 mb-1">
            <Minus className="w-3.5 h-3.5 text-honey-600" />
            <span>Avg Humidity</span>
          </span>
          <span className="text-xl font-bold text-honey-700">
            {stats.humidityAvg !== null ? `${stats.humidityAvg.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1">Target: ~60%</span>
        </div>

        {/* Humidity Max */}
        <div className="agri-card p-4">
          <span className="text-xs text-ink-muted flex items-center space-x-1 mb-1">
            <ArrowUp className="w-3.5 h-3.5 text-status-critical" />
            <span>Max Humidity</span>
          </span>
          <span className="text-xl font-bold text-ink-primary">
            {stats.humidityMax !== null ? `${stats.humidityMax.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1">% RH</span>
        </div>

      </div>

      {/* Main Historical Graphs */}
      {viewType === 'individual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          <div className="agri-card p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-ink-primary flex items-center space-x-2">
                <Thermometer className="w-4 h-4 text-primary-600" />
                <span>Historical Temperature Trend</span>
              </h3>
              <span className="text-xs text-ink-muted">Range slider enabled</span>
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
                <div className="h-full flex items-center justify-center text-xs text-ink-muted">
                  No telemetry recordings stored for this interval.
                </div>
              )}
            </div>
          </div>

          <div className="agri-card p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-subtle">
              <h3 className="text-sm font-semibold text-ink-primary flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-honey-600" />
                <span>Historical Relative Humidity Trend</span>
              </h3>
              <span className="text-xs text-ink-muted">Range slider enabled</span>
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
                <div className="h-full flex items-center justify-center text-xs text-ink-muted">
                  No telemetry recordings stored for this interval.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Combined overlay */
        <div className="agri-card p-5">
          <div className="pb-3 mb-2 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-ink-primary flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary-600" />
              <span>Combined Temperature and Humidity Telemetry</span>
            </h3>
          </div>

          <div className="h-80 w-full">
            {history.length > 0 ? (
              <ReactECharts
                option={{
                  ...tempChartOption,
                  yAxis: [
                    { ...tempChartOption.yAxis, name: '°C' },
                    { ...humChartOption.yAxis, name: '% RH', position: 'right', splitLine: { show: false } },
                  ],
                  series: [
                    tempChartOption.series[0],
                    { ...humChartOption.series[0], yAxisIndex: 1 },
                  ],
                }}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-ink-muted">
                No telemetry recordings stored for this interval.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

