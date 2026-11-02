'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, ThemeMode } from '../lib/types';
import { Activity, Radio, AlertCircle, Clock, Thermometer, Droplets, RefreshCw } from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface LiveTelemetrySectionProps {
  latestReading: SensorReading | null;
  history: SensorReading[];
  thresholds: AlertThresholds;
  backendConnected: boolean;
  secondsSinceLastReading: number | null;
  isPolling: boolean;
  theme: ThemeMode;
  onRefresh: () => void;
}

export const LiveTelemetrySection: React.FC<LiveTelemetrySectionProps> = ({
  latestReading,
  history,
  thresholds,
  backendConnected,
  secondsSinceLastReading,
  isPolling,
  theme,
  onRefresh,
}) => {
  const isDark = theme === 'dark';

  // Live status evaluations (Real checks, no fake statuses)
  const isStale = secondsSinceLastReading !== null && secondsSinceLastReading > 30 && secondsSinceLastReading <= 120;
  const isOffline = !backendConnected || (secondsSinceLastReading !== null && secondsSinceLastReading > 120) || !latestReading;
  const isLiveActive = backendConnected && isPolling && !isOffline && !isStale && latestReading !== null;

  // Recent data slice for live high-frequency view (last 20 readings)
  const liveSlice = useMemo(() => {
    return history.slice(-25);
  }, [history]);

  const timestamps = useMemo(() => {
    return liveSlice.map((r) => {
      const d = new Date(r.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });
  }, [liveSlice]);

  const temperatures = useMemo(() => liveSlice.map((r) => r.temperature_c), [liveSlice]);
  const humidities = useMemo(() => liveSlice.map((r) => r.humidity_pct), [liveSlice]);

  // ECharts options adapted for dark / light theme
  const chartTextColor = isDark ? '#9CA3AF' : '#4B5563';
  const chartSplitColor = isDark ? '#1F2937' : '#E5E7EB';
  const tooltipBg = isDark ? '#111827' : '#FFFFFF';
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB';

  const liveTempChartOption = useMemo(() => ({
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: '#F59E0B',
      borderWidth: 1,
      textStyle: { color: isDark ? '#F3F4F6' : '#111827', fontSize: 11, fontFamily: 'monospace' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div>
          <span style="color:#9CA3AF; font-size:10px;">${p.name}</span><br/>
          <strong style="color:#F59E0B;">Temperature:</strong> <b>${p.value} °C</b><br/>
          <span style="font-size:10px; color:#9CA3AF;">Brood Range: ${thresholds.minTemp}–${thresholds.maxTemp} °C</span>
        </div>`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '8%', top: '14%', containLabel: true },
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
        name: 'Live Temperature',
        type: 'line',
        smooth: 0.3,
        showSymbol: liveSlice.length < 15,
        symbolSize: 6,
        data: temperatures,
        lineStyle: { width: 2.5, color: '#F59E0B' },
        itemStyle: { color: '#F59E0B' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.35)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.01)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 1.2 },
          data: [
            { yAxis: thresholds.minTemp, lineStyle: { color: '#38BDF8' }, label: { formatter: 'Min 32°C', position: 'insideEndTop', fontSize: 9, color: '#38BDF8' } },
            { yAxis: thresholds.maxTemp, lineStyle: { color: '#F43F5E' }, label: { formatter: 'Max 36°C', position: 'insideEndTop', fontSize: 9, color: '#F43F5E' } },
          ],
        },
      },
    ],
  }), [timestamps, temperatures, thresholds, isDark, chartTextColor, chartSplitColor, tooltipBg, liveSlice.length]);

  const liveHumChartOption = useMemo(() => ({
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: '#0284C7',
      borderWidth: 1,
      textStyle: { color: isDark ? '#F3F4F6' : '#111827', fontSize: 11, fontFamily: 'monospace' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div>
          <span style="color:#9CA3AF; font-size:10px;">${p.name}</span><br/>
          <strong style="color:#0284C7;">Humidity:</strong> <b>${p.value} % RH</b><br/>
          <span style="font-size:10px; color:#9CA3AF;">Safe Range: ${thresholds.minHumidity}–${thresholds.maxHumidity}%</span>
        </div>`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '8%', top: '14%', containLabel: true },
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
        name: 'Live Relative Humidity',
        type: 'line',
        smooth: 0.3,
        showSymbol: liveSlice.length < 15,
        symbolSize: 6,
        data: humidities,
        lineStyle: { width: 2.5, color: '#0284C7' },
        itemStyle: { color: '#0284C7' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(2, 132, 199, 0.35)' },
              { offset: 1, color: 'rgba(2, 132, 199, 0.01)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', width: 1.2 },
          data: [
            { yAxis: thresholds.minHumidity, lineStyle: { color: '#EAB308' }, label: { formatter: 'Min 50%', position: 'insideEndTop', fontSize: 9, color: '#EAB308' } },
            { yAxis: thresholds.maxHumidity, lineStyle: { color: '#F43F5E' }, label: { formatter: 'Max 70%', position: 'insideEndTop', fontSize: 9, color: '#F43F5E' } },
          ],
        },
      },
    ],
  }), [timestamps, humidities, thresholds, isDark, chartTextColor, chartSplitColor, tooltipBg, liveSlice.length]);

  return (
    <div className="space-y-4">
      
      {/* Top Telemetry Header & Freshness Banner */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {/* Visible LIVE Indicator */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md font-mono text-xs font-bold border ${
              isLiveActive
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : isStale
                ? 'bg-honey-950/40 border-honey-500/40 text-honey-400'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isLiveActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLiveActive ? 'bg-emerald-500' : isStale ? 'bg-honey-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <span>
              {isLiveActive ? 'LIVE TELEMETRY STREAMING' : isStale ? 'TELEMETRY SIGNAL STALE' : 'TRANSMITTER OFFLINE'}
            </span>
          </div>

          <span className="text-xs text-industrial-400 font-mono hidden sm:inline">
            Poll rate: 3.0s · Ingestion: ESP32 REST
          </span>
        </div>

        {/* Live Metrics readout badges */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1 rounded bg-industrial-850 border border-industrial-800 flex items-center space-x-2">
            <Thermometer className="w-3.5 h-3.5 text-honey-500" />
            <span className="text-industrial-400">Temp:</span>
            <span className="font-bold text-white">
              {latestReading ? `${latestReading.temperature_c.toFixed(1)} °C` : '--'}
            </span>
          </div>

          <div className="px-3 py-1 rounded bg-industrial-850 border border-industrial-800 flex items-center space-x-2">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-industrial-400">Humidity:</span>
            <span className="font-bold text-white">
              {latestReading ? `${latestReading.humidity_pct.toFixed(1)} %` : '--'}
            </span>
          </div>

          <button
            onClick={onRefresh}
            title="Force telemetry refresh"
            className="p-1 rounded bg-industrial-850 border border-industrial-800 hover:bg-industrial-800 text-industrial-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Network / Stale Warnings */}
      {isOffline && (
        <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/30 flex items-start space-x-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-rose-200">Sensor Signal Interrupted:</strong> No telemetry packets received for {Math.round(secondsSinceLastReading || 0)}s. Please verify ESP32 power, 2.4 GHz Wi-Fi connectivity, or use the <i>Test Ingest</i> action in the top bar to verify pipeline ingestion.
          </div>
        </div>
      )}

      {isStale && (
        <div className="p-3.5 rounded-lg bg-honey-950/30 border border-honey-500/30 flex items-start space-x-3 text-xs text-honey-300">
          <AlertCircle className="w-4 h-4 text-honey-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-honey-200">Packet Delay Warning:</strong> Last sensor telemetry arrived {Math.round(secondsSinceLastReading || 0)}s ago (normal cadence: 3s). Chart updates will resume automatically once next packet arrives.
          </div>
        </div>
      )}

      {/* Real-Time Live Charts: Temperature & Humidity Dual Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Real-Time Temperature Chart */}
        <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-honey-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Live Hive Temperature Stream
              </h3>
            </div>
            <span className="text-[10px] font-mono text-industrial-400">
              Safe: {thresholds.minTemp}°C – {thresholds.maxTemp}°C
            </span>
          </div>

          <div className="h-64 w-full">
            {liveSlice.length > 0 ? (
              <ReactECharts
                option={liveTempChartOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-industrial-500 space-y-2">
                <Clock className="w-6 h-6 animate-pulse" />
                <span>Awaiting live telemetry packets from ESP32...</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Humidity Chart */}
        <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Live Relative Humidity Stream
              </h3>
            </div>
            <span className="text-[10px] font-mono text-industrial-400">
              Safe: {thresholds.minHumidity}% – {thresholds.maxHumidity}%
            </span>
          </div>

          <div className="h-64 w-full">
            {liveSlice.length > 0 ? (
              <ReactECharts
                option={liveHumChartOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-industrial-500 space-y-2">
                <Clock className="w-6 h-6 animate-pulse" />
                <span>Awaiting live telemetry packets from ESP32...</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

