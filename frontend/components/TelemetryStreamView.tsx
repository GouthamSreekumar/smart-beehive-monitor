'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, TimeRange } from '../lib/types';
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

interface TelemetryStreamViewProps {
  history: SensorReading[];
  thresholds: AlertThresholds;
  timeRange: TimeRange;
  onSelectTimeRange: (range: TimeRange) => void;
}

export const TelemetryStreamView: React.FC<TelemetryStreamViewProps> = ({
  history,
  thresholds,
  timeRange,
  onSelectTimeRange,
}) => {
  const [viewType, setViewType] = useState<'dual' | 'combined'>('dual');

  // Compute statistics strictly from real stored readings
  const stats = useMemo(() => {
    if (history.length === 0) {
      return { tempMin: null, tempMax: null, tempAvg: null, humMin: null, humMax: null, humAvg: null, count: 0 };
    }
    const temps = history.map((r) => r.temperature_c);
    const hums = history.map((r) => r.humidity_pct);

    return {
      tempMin: Math.min(...temps),
      tempMax: Math.max(...temps),
      tempAvg: temps.reduce((a, b) => a + b, 0) / temps.length,
      humMin: Math.min(...hums),
      humMax: Math.max(...hums),
      humAvg: hums.reduce((a, b) => a + b, 0) / hums.length,
      count: history.length,
    };
  }, [history]);

  const timestamps = useMemo(() => {
    return history.map((r) => {
      const d = new Date(r.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }, [history]);

  const temperatures = useMemo(() => history.map((r) => r.temperature_c), [history]);
  const humidities = useMemo(() => history.map((r) => r.humidity_pct), [history]);

  const tempChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#DFE5DC',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#18261C', fontSize: 12 },
    },
    grid: { left: '2%', right: '2%', bottom: '14%', top: '10%', containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        show: history.length > 10,
        bottom: 5,
        height: 16,
        borderColor: '#DFE5DC',
        backgroundColor: '#F6F8F5',
        fillerColor: 'rgba(45, 90, 60, 0.15)',
        handleStyle: { color: '#2D5A3C' },
        textStyle: { color: '#6E7F72', fontSize: 10 },
      },
      { type: 'inside' },
    ],
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E0E6DD' } },
      axisTick: { show: false },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '°C',
      nameTextStyle: { color: '#2D5A3C', fontSize: 11 },
      min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minTemp - 1)),
      max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxTemp + 1)),
      splitLine: { lineStyle: { color: '#F0F4EF', type: 'solid' } },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    series: [
      {
        name: 'Brood Temperature',
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        data: temperatures,
        lineStyle: { width: 2.2, color: '#2D5A3C' },
        itemStyle: { color: '#2D5A3C' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(45, 90, 60, 0.18)' },
              { offset: 1, color: 'rgba(45, 90, 60, 0.0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { yAxis: thresholds.minTemp, lineStyle: { color: '#6E7F72', type: 'dashed' }, label: { formatter: 'Min 32°C', position: 'insideEndTop', color: '#435447', fontSize: 10 } },
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
      borderColor: '#DFE5DC',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#18261C', fontSize: 12 },
    },
    grid: { left: '2%', right: '2%', bottom: '14%', top: '10%', containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        show: history.length > 10,
        bottom: 5,
        height: 16,
        borderColor: '#DFE5DC',
        backgroundColor: '#F6F8F5',
        fillerColor: 'rgba(217, 138, 38, 0.15)',
        handleStyle: { color: '#D98A26' },
        textStyle: { color: '#6E7F72', fontSize: 10 },
      },
      { type: 'inside' },
    ],
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E0E6DD' } },
      axisTick: { show: false },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '% RH',
      nameTextStyle: { color: '#D98A26', fontSize: 11 },
      min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minHumidity - 5)),
      max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxHumidity + 5)),
      splitLine: { lineStyle: { color: '#F0F4EF', type: 'solid' } },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    series: [
      {
        name: 'Relative Humidity',
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        data: humidities,
        lineStyle: { width: 2.2, color: '#D98A26' },
        itemStyle: { color: '#D98A26' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(217, 138, 38, 0.16)' },
              { offset: 1, color: 'rgba(217, 138, 38, 0.0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { yAxis: thresholds.minHumidity, lineStyle: { color: '#6E7F72', type: 'dashed' }, label: { formatter: 'Min 50%', position: 'insideEndTop', color: '#435447', fontSize: 10 } },
            { yAxis: thresholds.maxHumidity, lineStyle: { color: '#D9534F', type: 'dashed' }, label: { formatter: 'Max 70%', position: 'insideEndTop', color: '#D9534F', fontSize: 10 } },
          ],
        },
      },
    ],
  }), [timestamps, humidities, thresholds, history.length]);

  return (
    <div className="space-y-6 animate-stage-enter">
      
      {/* Top Filter Deck */}
      <div className="studio-stage p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#2D5A3C]" />
          <span className="text-xs font-bold text-[#18261C]">Observation Window:</span>
          <div className="flex items-center space-x-1 bg-[#F6F8F5] p-1 rounded-lg border border-[#DFE5DC] text-xs">
            {(['session', '1h', '6h', '24h', '72h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => onSelectTimeRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  timeRange === r ? 'bg-white text-[#18261C] shadow-xs' : 'text-[#6E7F72] hover:text-[#18261C]'
                }`}
              >
                {r === 'session' ? 'Latest Session' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-[#F6F8F5] p-1 rounded-lg border border-[#DFE5DC] text-xs">
          <button
            onClick={() => setViewType('dual')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              viewType === 'dual' ? 'bg-white text-[#18261C] shadow-xs' : 'text-[#6E7F72] hover:text-[#18261C]'
            }`}
          >
            Split Views
          </button>
          <button
            onClick={() => setViewType('combined')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              viewType === 'combined' ? 'bg-white text-[#18261C] shadow-xs' : 'text-[#6E7F72] hover:text-[#18261C]'
            }`}
          >
            Combined Overlay
          </button>
        </div>
      </div>

      {/* Aggregate Numerical Ledger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="studio-stage p-4">
          <span className="text-[11px] text-[#6E7F72] block">Telemetry Points</span>
          <span className="text-xl font-extrabold text-[#18261C]">{stats.count}</span>
          <span className="text-[10px] text-[#6E7F72] block mt-1">Recorded packets</span>
        </div>

        <div className="studio-stage p-4">
          <span className="text-[11px] text-[#6E7F72] flex items-center space-x-1">
            <ArrowDown className="w-3 h-3 text-[#2D5A3C]" />
            <span>Min Temp</span>
          </span>
          <span className="text-xl font-extrabold text-[#18261C]">
            {stats.tempMin !== null ? `${stats.tempMin.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[10px] text-[#6E7F72] block mt-1">Celsius</span>
        </div>

        <div className="studio-stage p-4">
          <span className="text-[11px] text-[#2D5A3C] font-semibold flex items-center space-x-1">
            <Minus className="w-3 h-3" />
            <span>Avg Temp</span>
          </span>
          <span className="text-xl font-extrabold text-[#2D5A3C]">
            {stats.tempAvg !== null ? `${stats.tempAvg.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[10px] text-[#6E7F72] block mt-1">Target: ~34.5°C</span>
        </div>

        <div className="studio-stage p-4">
          <span className="text-[11px] text-[#6E7F72] flex items-center space-x-1">
            <ArrowUp className="w-3 h-3 text-rose-600" />
            <span>Max Temp</span>
          </span>
          <span className="text-xl font-extrabold text-[#18261C]">
            {stats.tempMax !== null ? `${stats.tempMax.toFixed(1)}°` : '--'}
          </span>
          <span className="text-[10px] text-[#6E7F72] block mt-1">Celsius</span>
        </div>

        <div className="studio-stage p-4">
          <span className="text-[11px] text-[#6E7F72] flex items-center space-x-1">
            <ArrowDown className="w-3 h-3 text-[#D98A26]" />
            <span>Min Humidity</span>
          </span>
          <span className="text-xl font-extrabold text-[#18261C]">
            {stats.humMin !== null ? `${stats.humMin.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[10px] text-[#6E7F72] block mt-1">% RH</span>
        </div>

        <div className="studio-stage p-4">
          <span className="text-[11px] text-[#D98A26] font-semibold flex items-center space-x-1">
            <Minus className="w-3 h-3" />
            <span>Avg Humidity</span>
          </span>
          <span className="text-xl font-extrabold text-[#D98A26]">
            {stats.humAvg !== null ? `${stats.humAvg.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[10px] text-[#6E7F72] block mt-1">Target: ~60.0%</span>
        </div>

        <div className="studio-stage p-4">
          <span className="text-[11px] text-[#6E7F72] flex items-center space-x-1">
            <ArrowUp className="w-3 h-3 text-rose-600" />
            <span>Max Humidity</span>
          </span>
          <span className="text-xl font-extrabold text-[#18261C]">
            {stats.humMax !== null ? `${stats.humMax.toFixed(1)}%` : '--'}
          </span>
          <span className="text-[10px] text-[#6E7F72] block mt-1">% RH</span>
        </div>
      </div>

      {/* Main Charts */}
      {viewType === 'dual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="studio-stage p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#DFE5DC]">
              <h3 className="text-sm font-bold text-[#18261C] flex items-center space-x-2">
                <Thermometer className="w-4 h-4 text-[#2D5A3C]" />
                <span>Brood Temperature Curve</span>
              </h3>
              <span className="text-xs text-[#6E7F72]">Interactive Zoom Slider</span>
            </div>
            <div className="h-72 w-full">
              {history.length > 0 ? (
                <ReactECharts option={tempChartOption} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#6E7F72]">
                  No recordings in this window. Select Latest Session above.
                </div>
              )}
            </div>
          </div>

          <div className="studio-stage p-5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#DFE5DC]">
              <h3 className="text-sm font-bold text-[#18261C] flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-[#D98A26]" />
                <span>Relative Humidity Curve</span>
              </h3>
              <span className="text-xs text-[#6E7F72]">Interactive Zoom Slider</span>
            </div>
            <div className="h-72 w-full">
              {history.length > 0 ? (
                <ReactECharts option={humChartOption} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#6E7F72]">
                  No recordings in this window. Select Latest Session above.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="studio-stage p-5">
          <div className="pb-3 mb-2 border-b border-[#DFE5DC]">
            <h3 className="text-sm font-bold text-[#18261C] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#2D5A3C]" />
              <span>Combined Dual-Axis Telemetry Stream</span>
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
              <div className="h-full flex items-center justify-center text-xs text-[#6E7F72]">
                No recordings in this window.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

