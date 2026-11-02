'use client';

import React from 'react';
import { SensorReading, AlertThresholds, Device } from '../lib/types';
import {
  Thermometer,
  Droplets,
  Radio,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
} from 'lucide-react';

interface MetricOverviewCardsProps {
  latestReading: SensorReading | null;
  previousReading: SensorReading | null;
  history: SensorReading[];
  activeDevice: Device | null;
  thresholds: AlertThresholds;
  backendConnected: boolean;
  secondsSinceLastPacket: number | null;
  activeAlertCount: number;
}

// Crisp inline SVG Sparkline generator
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({
  data,
  color,
  height = 28,
}) => {
  if (data.length < 2) {
    return <div className="h-7 w-20 flex items-center justify-center text-[10px] text-industrial-600 font-mono">--</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const padding = 2;

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const MetricOverviewCards: React.FC<MetricOverviewCardsProps> = ({
  latestReading,
  previousReading,
  history,
  activeDevice,
  thresholds,
  backendConnected,
  secondsSinceLastPacket,
  activeAlertCount,
}) => {
  const temp = latestReading ? latestReading.temperature_c : null;
  const humidity = latestReading ? latestReading.humidity_pct : null;

  // Temperature delta
  const tempDelta =
    temp !== null && previousReading !== null
      ? temp - previousReading.temperature_c
      : null;

  // Humidity delta
  const humDelta =
    humidity !== null && previousReading !== null
      ? humidity - previousReading.humidity_pct
      : null;

  // Status assessments
  let tempStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
  let tempStatusText = 'Brood Safe';
  if (temp !== null) {
    if (temp < thresholds.minTemp) {
      tempStatus = 'critical';
      tempStatusText = 'Chilled Brood Risk';
    } else if (temp > thresholds.maxTemp) {
      tempStatus = 'critical';
      tempStatusText = 'Overheating Risk';
    } else if (temp >= 33.5 && temp <= 35.5) {
      tempStatus = 'optimal';
      tempStatusText = 'Optimal Incubation';
    }
  }

  let humStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
  let humStatusText = 'Optimal Range';
  if (humidity !== null) {
    if (humidity < thresholds.minHumidity) {
      humStatus = 'warning';
      humStatusText = 'Low Moisture';
    } else if (humidity > thresholds.maxHumidity) {
      humStatus = 'critical';
      humStatusText = 'Condensation Risk';
    }
  }

  // Connectivity status
  const isStale = secondsSinceLastPacket !== null && secondsSinceLastPacket > 30 && secondsSinceLastPacket <= 120;
  const isOffline = !backendConnected || (secondsSinceLastPacket !== null && secondsSinceLastPacket > 120) || latestReading === null;

  const formatRelative = (seconds: number | null) => {
    if (seconds === null) return 'No packets';
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  // Sparkline data slices
  const tempHistorySlice = history.slice(-15).map((r) => r.temperature_c);
  const humHistorySlice = history.slice(-15).map((r) => r.humidity_pct);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      
      {/* 1. Hive Temperature (°C) */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-industrial-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Thermometer className="w-3.5 h-3.5 text-honey-500" />
              <span>Hive Temperature</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-industrial-850 text-industrial-400 border border-industrial-800">
              {thresholds.minTemp}–{thresholds.maxTemp}°C
            </span>
          </div>

          <div className="flex items-baseline space-x-1.5 my-1">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">
              {temp !== null ? temp.toFixed(1) : '--'}
            </span>
            <span className="text-sm font-semibold text-industrial-400">°C</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-industrial-800 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {tempDelta !== null && Math.abs(tempDelta) >= 0.05 ? (
              <span
                className={`text-[11px] font-mono flex items-center ${
                  tempDelta > 0 ? 'text-honey-400' : 'text-sky-400'
                }`}
              >
                {tempDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(tempDelta).toFixed(1)}°
              </span>
            ) : (
              <span className="text-[10px] font-mono text-industrial-500 flex items-center">
                <Minus className="w-2.5 h-2.5 mr-0.5" /> Stable
              </span>
            )}
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                tempStatus === 'optimal'
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
              }`}
            >
              {temp !== null ? tempStatusText : 'No Data'}
            </span>
          </div>

          <Sparkline data={tempHistorySlice} color="#F59E0B" />
        </div>
      </div>

      {/* 2. Relative Humidity (%) */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-industrial-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>Relative Humidity</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-industrial-850 text-industrial-400 border border-industrial-800">
              {thresholds.minHumidity}–{thresholds.maxHumidity}%
            </span>
          </div>

          <div className="flex items-baseline space-x-1.5 my-1">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">
              {humidity !== null ? humidity.toFixed(1) : '--'}
            </span>
            <span className="text-sm font-semibold text-industrial-400">% RH</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-industrial-800 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {humDelta !== null && Math.abs(humDelta) >= 0.1 ? (
              <span
                className={`text-[11px] font-mono flex items-center ${
                  humDelta > 0 ? 'text-sky-400' : 'text-industrial-400'
                }`}
              >
                {humDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(humDelta).toFixed(1)}%
              </span>
            ) : (
              <span className="text-[10px] font-mono text-industrial-500 flex items-center">
                <Minus className="w-2.5 h-2.5 mr-0.5" /> Stable
              </span>
            )}
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                humStatus === 'optimal'
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
              }`}
            >
              {humidity !== null ? humStatusText : 'No Data'}
            </span>
          </div>

          <Sparkline data={humHistorySlice} color="#38BDF8" />
        </div>
      </div>

      {/* 3. Device Connectivity */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-industrial-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transmitter Link</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-industrial-850 text-industrial-400 border border-industrial-800">
              ESP32 Wi-Fi
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-1">
            <span
              className={`text-2xl font-bold font-mono tracking-tight ${
                isOffline ? 'text-rose-400' : isStale ? 'text-honey-400' : 'text-emerald-400'
              }`}
            >
              {isOffline ? 'OFFLINE' : isStale ? 'STALE' : 'ONLINE'}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-industrial-800 flex items-center justify-between text-[11px]">
          <span className="text-industrial-400">Node:</span>
          <span className="font-mono text-white">
            {activeDevice?.device_id || latestReading?.device_id || 'beehive-001'}
          </span>
        </div>
      </div>

      {/* 4. Last Sensor Reading */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-industrial-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-industrial-400" />
              <span>Last Packet</span>
            </span>
            <span className="text-[10px] font-mono text-industrial-500">
              UTC / Local
            </span>
          </div>

          <div className="my-1">
            <div className="text-xl font-bold font-mono text-white truncate">
              {formatRelative(secondsSinceLastPacket)}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-industrial-800 flex items-center justify-between text-[11px]">
          <span className="text-industrial-400">Recorded:</span>
          <span className="font-mono text-industrial-300 text-[10px]">
            {latestReading
              ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '--:--:--'}
          </span>
        </div>
      </div>

      {/* 5. Active Alerts */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-industrial-400 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${activeAlertCount > 0 ? 'text-rose-400' : 'text-industrial-400'}`} />
              <span>Active Alerts</span>
            </span>
            <span className="text-[10px] font-mono text-industrial-500">Real-time</span>
          </div>

          <div className="flex items-baseline space-x-2 my-1">
            <span
              className={`text-3xl font-bold font-mono tracking-tight ${
                activeAlertCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {activeAlertCount}
            </span>
            <span className="text-xs text-industrial-400">
              {activeAlertCount === 0 ? 'Conditions Normal' : 'Action Required'}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-industrial-800 flex items-center justify-between text-[11px]">
          <span className="text-industrial-400">Severity:</span>
          <span className="font-medium text-industrial-300">
            {activeAlertCount > 0 ? 'Warning / Critical' : 'All Clear'}
          </span>
        </div>
      </div>

      {/* 6. Current Monitoring Status */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-industrial-400 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-honey-500" />
              <span>Brood Health</span>
            </span>
            <span className="text-[10px] font-mono text-industrial-500">Evaluation</span>
          </div>

          <div className="my-1">
            <div
              className={`text-base font-bold tracking-tight truncate ${
                tempStatus === 'optimal' && humStatus === 'optimal'
                  ? 'text-emerald-400'
                  : 'text-honey-400'
              }`}
            >
              {tempStatus === 'optimal' && humStatus === 'optimal'
                ? 'Optimal Colony Nest'
                : tempStatus === 'critical'
                ? 'Thermal Disturbance'
                : 'Moisture Imbalance'}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-industrial-800 flex items-center justify-between text-[11px]">
          <span className="text-industrial-400">Incubation:</span>
          <span className="font-mono text-emerald-400">
            {temp !== null && temp >= 32 && temp <= 36 ? 'Safe Band' : 'Threshold Breached'}
          </span>
        </div>
      </div>

    </div>
  );
};

