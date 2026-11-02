'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds } from '../lib/types';
import {
  Activity,
  Thermometer,
  Droplets,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  WifiOff,
  Wifi,
  Send,
  HelpCircle,
  Check,
  ShieldAlert,
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
  onOpenTestModal: () => void;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  latestReading,
  history,
  thresholds,
  backendConnected,
  secondsSinceLastReading,
  isPolling,
  onRefresh,
  onOpenTestModal,
}) => {
  const [liveWindow, setLiveWindow] = useState<'30' | '60' | 'all'>('30');
  const [showTroubleshooting, setShowTroubleshooting] = useState<boolean>(false);

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
          <div style="font-size: 11px; color: #788579; margin-top: 2px;">Safe Band: ${thresholds.minTemp}–${thresholds.maxTemp} °C</div>
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

  // Humidity chart option
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
          <div style="font-size: 11px; color: #788579; margin-top: 2px;">Safe Band: ${thresholds.minHumidity}–${thresholds.maxHumidity}%</div>
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
    <div className="space-y-6 animate-tab-enter">
      
      {/* 1. Central Sensor Connection Status Panel */}
      <div className="agri-card p-5 sm:p-6 bg-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          
          {/* Left: Device & Live Indicator */}
          <div className="flex items-start sm:items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${
                isOnline
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : isStale
                  ? 'bg-status-warning/10 border-status-warning/20 text-status-warning'
                  : 'bg-status-critical/10 border-status-critical/20 text-status-critical'
              }`}
            >
              {isOnline ? (
                <Wifi className="w-5 h-5 animate-pulse" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-ink-primary">
                  {latestReading?.device_id || 'beehive-001'}
                </h3>
                <span
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isOnline
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : isStale
                      ? 'bg-status-warning/10 border-status-warning/20 text-status-warning'
                      : 'bg-status-critical/10 border-status-critical/20 text-status-critical'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? 'bg-primary-500 animate-signal-pulse' : isStale ? 'bg-status-warning' : 'bg-status-critical'
                    }`}
                  />
                  <span>
                    {isOnline ? 'Online · Live Stream Active' : isStale ? 'Delayed · Signal Lag' : 'Offline · Sensor Disconnected'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                ESP32 Brood Chamber Transmitter · Expected Cadence: 3s
              </p>
            </div>
          </div>

          {/* Right: Actions (Refresh, Test, Troubleshooting) */}
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={onRefresh}
              title="Refresh telemetry stream"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-border-light hover:border-border-hover bg-surface hover:bg-canvas text-xs font-medium text-ink-secondary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>

            <button
              onClick={onOpenTestModal}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-honey-50 border border-honey-200 hover:bg-honey-100 text-xs font-medium text-honey-800 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Ingest</span>
            </button>

            <button
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-border-light hover:border-border-hover bg-surface hover:bg-canvas text-xs font-medium text-ink-muted transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>
        </div>

        {/* Central Sensor Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div>
            <span className="text-ink-muted block text-[11px]">Last Communication</span>
            <span className="font-semibold text-ink-primary">
              {latestReading ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'No packets'}
            </span>
          </div>

          <div>
            <span className="text-ink-muted block text-[11px]">Time Since Last Packet</span>
            <span className={`font-semibold ${isOnline ? 'text-primary-700' : 'text-status-critical'}`}>
              {secondsSinceLastReading !== null ? `${Math.round(secondsSinceLastReading)} seconds ago` : 'Never'}
            </span>
          </div>

          <div>
            <span className="text-ink-muted block text-[11px]">Latest Brood Temperature</span>
            <span className="font-semibold text-ink-primary">
              {latestReading ? `${latestReading.temperature_c.toFixed(1)} °C` : '--'}
            </span>
          </div>

          <div>
            <span className="text-ink-muted block text-[11px]">Latest Relative Humidity</span>
            <span className="font-semibold text-ink-primary">
              {latestReading ? `${latestReading.humidity_pct.toFixed(1)} %` : '--'}
            </span>
          </div>
        </div>

        {/* Expandable Troubleshooting Guidance */}
        {showTroubleshooting && (
          <div className="mt-4 p-4 rounded-lg bg-canvas border border-border-light text-xs text-ink-secondary space-y-2 animate-in fade-in duration-150">
            <h4 className="font-bold text-ink-primary flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-primary-600" />
              <span>Sensor Connection & Troubleshooting Steps</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside">
              <li>Ensure the ESP32 is powered via USB (verify the red onboard power LED is steady).</li>
              <li>Confirm your Wi-Fi hotspot is set to the <b>2.4 GHz band</b> (ESP32 does not support 5 GHz).</li>
              <li>Inspect GPIO 4 pin connection to DHT22 data pin and confirm 3.3V power rails.</li>
              <li>Click <b>Test Ingest</b> above to push a diagnostic packet and verify that FastAPI & PostgreSQL are operating normally.</li>
            </ul>
          </div>
        )}
      </div>

      {/* 2. Dual Real-Time Charts with Informative States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Temperature Live Chart */}
        <div className="agri-card p-5">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-subtle">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-ink-primary">
                Live Brood Temperature
              </h3>
            </div>
            
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-ink-muted">Safe:</span>
              <span className="font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200 text-[11px]">
                {thresholds.minTemp}–{thresholds.maxTemp}°C
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
              /* Beautiful informative empty state */
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600">
                  <Thermometer className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-ink-primary">
                    Waiting for Sensor Telemetry
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1 max-w-xs">
                    Live temperature data will display here automatically once the ESP32 transmitter connects.
                  </p>
                </div>
                <button
                  onClick={onOpenTestModal}
                  className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                >
                  Post Diagnostic Reading
                </button>
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
                Live Relative Humidity
              </h3>
            </div>
            
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-ink-muted">Safe:</span>
              <span className="font-semibold text-honey-700 bg-honey-50 px-2 py-0.5 rounded border border-honey-200 text-[11px]">
                {thresholds.minHumidity}–{thresholds.maxHumidity}%
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
              /* Beautiful informative empty state */
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-honey-50 border border-honey-200 flex items-center justify-center text-honey-600">
                  <Droplets className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-ink-primary">
                    Waiting for Sensor Telemetry
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1 max-w-xs">
                    Live relative humidity data will render dynamically once telemetry packets arrive.
                  </p>
                </div>
                <button
                  onClick={onOpenTestModal}
                  className="px-3 py-1.5 text-xs font-medium text-honey-800 bg-honey-50 hover:bg-honey-100 border border-honey-200 rounded-lg transition-colors"
                >
                  Post Diagnostic Reading
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
