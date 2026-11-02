'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, TimeRange } from '../lib/types';
import {
  Activity,
  Thermometer,
  Droplets,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface LiveMonitoringViewProps {
  latestReading: SensorReading | null;
  history: SensorReading[];
  thresholds: AlertThresholds;
  backendConnected: boolean;
  secondsSinceLastReading: number | null;
  isPolling: boolean;
  onRefresh: () => void;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  latestReading,
  history,
  thresholds,
  backendConnected,
  secondsSinceLastReading,
  isPolling,
  onRefresh,
}) => {
  const [liveWindow, setLiveWindow] = useState<'30' | '60' | 'all'>('30');

  // Filter history to selected live slice
  const displaySlice = useMemo(() => {
    if (liveWindow === '30') return history.slice(-30);
    if (liveWindow === '60') return history.slice(-60);
    return history;
  }, [history, liveWindow]);

  const timestamps = useMemo(() => {
    return displaySlice.map((r) => {
      const d = new Date(r.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });
  }, [displaySlice]);

  const temperatures = useMemo(() => displaySlice.map((r) => r.temperature_c), [displaySlice]);
  const humidities = useMemo(() => displaySlice.map((r) => r.humidity_pct), [displaySlice]);

  // Genuine connection status checks
  const isOnline = backendConnected && isPolling && secondsSinceLastReading !== null && secondsSinceLastReading <= 120 && latestReading !== null;
  const isStale = backendConnected && secondsSinceLastReading !== null && secondsSinceLastReading > 30 && secondsSinceLastReading <= 120;
  const isOffline = !backendConnected || (secondsSinceLastReading !== null && secondsSinceLastReading > 120) || latestReading === null;

  // Temperature chart option (Clean light styling)
  const tempChartOption = useMemo(() => ({
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5EAE3',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#25352B', fontSize: 12 },
      shadowColor: 'rgba(37, 53, 43, 0.04)',
      shadowBlur: 8,
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-family: inherit;">
          <div style="font-size: 11px; color: #788579; margin-bottom: 2px;">${p.name}</div>
          <div style="font-weight: 600; color: #477A55;">Temperature: ${p.value} °C</div>
          <div style="font-size: 11px; color: #788579; margin-top: 2px;">Safe: ${thresholds.minTemp}–${thresholds.maxTemp} °C</div>
        </div>`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '8%', top: '12%', containLabel: true },
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
        showSymbol: displaySlice.length < 15,
        symbolSize: 6,
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
          lineStyle: { type: 'dashed', width: 1 },
          data: [
            { yAxis: thresholds.minTemp, lineStyle: { color: '#788579' }, label: { formatter: 'Min 32°C', position: 'insideEndTop', fontSize: 10, color: '#5C6C5E' } },
            { yAxis: thresholds.maxTemp, lineStyle: { color: '#D9534F' }, label: { formatter: 'Max 36°C', position: 'insideEndTop', fontSize: 10, color: '#D9534F' } },
          ],
        },
      },
    ],
  }), [timestamps, temperatures, thresholds, displaySlice.length]);

  // Humidity chart option (Clean light styling)
  const humChartOption = useMemo(() => ({
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5EAE3',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#25352B', fontSize: 12 },
      shadowColor: 'rgba(37, 53, 43, 0.04)',
      shadowBlur: 8,
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-family: inherit;">
          <div style="font-size: 11px; color: #788579; margin-bottom: 2px;">${p.name}</div>
          <div style="font-weight: 600; color: #D99A35;">Humidity: ${p.value} % RH</div>
          <div style="font-size: 11px; color: #788579; margin-top: 2px;">Safe: ${thresholds.minHumidity}–${thresholds.maxHumidity}%</div>
        </div>`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '8%', top: '12%', containLabel: true },
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
        showSymbol: displaySlice.length < 15,
        symbolSize: 6,
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
          lineStyle: { type: 'dashed', width: 1 },
          data: [
            { yAxis: thresholds.minHumidity, lineStyle: { color: '#788579' }, label: { formatter: 'Min 50%', position: 'insideEndTop', fontSize: 10, color: '#5C6C5E' } },
            { yAxis: thresholds.maxHumidity, lineStyle: { color: '#D9534F' }, label: { formatter: 'Max 70%', position: 'insideEndTop', fontSize: 10, color: '#D9534F' } },
          ],
        },
      },
    ],
  }), [timestamps, humidities, thresholds, displaySlice.length]);

  return (
    <div className="space-y-6">
      
      {/* Live Stream Header & Metric Strip */}
      <div className="agri-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Connection status & metadata */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : isStale
                ? 'bg-status-warning/10 border-status-warning/20 text-status-warning'
                : 'bg-status-critical/10 border-status-critical/20 text-status-critical'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-primary-500' : isStale ? 'bg-status-warning' : 'bg-status-critical'
              }`}
            />
            <span>
              {isOnline ? 'Live Stream Active' : isStale ? 'Telemetry Delayed' : 'Sensor Offline'}
            </span>
          </div>

          <span className="text-xs text-ink-muted">
            Cadence: 3s · Node: {latestReading?.device_id || 'beehive-001'}
          </span>
        </div>

        {/* Readout badges & live window filter */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-xs bg-canvas p-1 rounded-lg border border-border-light">
            {(['30', '60', 'all'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setLiveWindow(w)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  liveWindow === w
                    ? 'bg-surface text-ink-primary shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                {w === 'all' ? 'All' : `Last ${w}`}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            title="Refresh stream"
            className="p-1.5 text-ink-muted hover:text-ink-primary rounded-lg hover:bg-canvas border border-border-light transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Offline Notice if applicable */}
      {isOffline && (
        <div className="p-4 rounded-lg bg-surface border border-border-light flex items-start space-x-3 text-xs text-ink-secondary">
          <AlertCircle className="w-4 h-4 text-status-critical flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink-primary">Sensor signal absent: </span>
            No telemetry packets received for {Math.round(secondsSinceLastReading || 0)}s. Please check ESP32 power and Wi-Fi connection. Charts will resume dynamically once telemetry resumes.
          </div>
        </div>
      )}

      {/* Dual Large Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Temperature Live Chart */}
        <div className="agri-card p-5">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-subtle">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-ink-primary">
                Live Temperature (°C)
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-ink-muted">Latest:</span>
              <span className="font-bold text-ink-primary">
                {latestReading ? `${latestReading.temperature_c.toFixed(1)} °C` : '--'}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {displaySlice.length > 0 ? (
              <ReactECharts
                option={tempChartOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-ink-muted space-y-2">
                <Clock className="w-6 h-6 text-ink-faint animate-pulse" />
                <span>Waiting for initial ESP32 telemetry packet...</span>
              </div>
            )}
          </div>
        </div>

        {/* Humidity Live Chart */}
        <div className="agri-card p-5">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-subtle">
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-honey-600" />
              <h3 className="text-sm font-semibold text-ink-primary">
                Live Relative Humidity (%)
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-ink-muted">Latest:</span>
              <span className="font-bold text-ink-primary">
                {latestReading ? `${latestReading.humidity_pct.toFixed(1)} %` : '--'}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {displaySlice.length > 0 ? (
              <ReactECharts
                option={humChartOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-ink-muted space-y-2">
                <Clock className="w-6 h-6 text-ink-faint animate-pulse" />
                <span>Waiting for initial ESP32 telemetry packet...</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

