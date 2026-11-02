'use client';

import React from 'react';
import { SensorReading, AlertThresholds, Device } from '../lib/types';
import { Thermometer, Droplets, Clock, Radio, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SummaryCardsProps {
  latestReading: SensorReading | null;
  activeDevice: Device | null;
  thresholds: AlertThresholds;
  isStale: boolean;
  isOffline: boolean;
  secondsSinceLastReading: number | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  latestReading,
  thresholds,
  isStale,
  isOffline,
  secondsSinceLastReading,
}) => {
  const temp = latestReading ? latestReading.temperature_c : null;
  const humidity = latestReading ? latestReading.humidity_pct : null;

  // Temperature status calculation
  let tempStatus: 'optimal' | 'chilled' | 'hot' = 'optimal';
  if (temp !== null) {
    if (temp < thresholds.minTemp) tempStatus = 'chilled';
    else if (temp > thresholds.maxTemp) tempStatus = 'hot';
  }

  // Humidity status calculation
  let humStatus: 'optimal' | 'dry' | 'moist' = 'optimal';
  if (humidity !== null) {
    if (humidity < thresholds.minHumidity) humStatus = 'dry';
    else if (humidity > thresholds.maxHumidity) humStatus = 'moist';
  }

  const formatRelative = (seconds: number | null) => {
    if (seconds === null) return 'No packets';
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    const mins = Math.floor(seconds / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Hive Temperature Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Thermometer className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs font-semibold text-[#57534e]">Brood Temperature</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-[#78716c]">
            {thresholds.minTemp}–{thresholds.maxTemp}°C
          </span>
        </div>

        <div className="flex items-baseline space-x-1.5 my-2">
          <span className="text-4xl font-extrabold tracking-tight text-[#1c1917] font-mono">
            {temp !== null ? temp.toFixed(1) : '--'}
          </span>
          <span className="text-base font-medium text-[#78716c]">°C</span>
        </div>

        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 font-medium">
            {tempStatus === 'optimal' ? (
              <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Optimal Brood
              </span>
            ) : tempStatus === 'chilled' ? (
              <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Chilled Brood
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overheating
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#a8a29e] font-mono">Target: 34.5°C</span>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-orange-400/5 blur-xl pointer-events-none" />
      </div>

      {/* 2. Relative Humidity Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100/80 text-cyan-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Droplets className="w-4 h-4 text-cyan-600" />
            </div>
            <span className="text-xs font-semibold text-[#57534e]">Relative Humidity</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-[#78716c]">
            {thresholds.minHumidity}–{thresholds.maxHumidity}%
          </span>
        </div>

        <div className="flex items-baseline space-x-1.5 my-2">
          <span className="text-4xl font-extrabold tracking-tight text-[#1c1917] font-mono">
            {humidity !== null ? humidity.toFixed(1) : '--'}
          </span>
          <span className="text-base font-medium text-[#78716c]">% RH</span>
        </div>

        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 font-medium">
            {humStatus === 'optimal' ? (
              <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Healthy Humidity
              </span>
            ) : humStatus === 'dry' ? (
              <span className="inline-flex items-center text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Dry Larvae
              </span>
            ) : (
              <span className="inline-flex items-center text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 text-[11px]">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Moisture Risk
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#a8a29e] font-mono">Target: 50–70%</span>
        </div>

        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-cyan-400/5 blur-xl pointer-events-none" />
      </div>

      {/* 3. Last Reading Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <span className="text-xs font-semibold text-[#57534e]">Last Observed</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-[#78716c]">
            {latestReading ? new Date(latestReading.timestamp).toLocaleDateString() : 'Awaiting'}
          </span>
        </div>

        <div className="flex items-baseline space-x-1.5 my-2">
          <span className="text-2xl font-bold tracking-tight text-[#1c1917] font-mono">
            {latestReading
              ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '--:--:--'}
          </span>
        </div>

        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
            {formatRelative(secondsSinceLastReading)}
          </span>
          <span className="text-[11px] text-[#a8a29e] font-mono">2s DHT22 loop</span>
        </div>

        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-amber-400/5 blur-xl pointer-events-none" />
      </div>

      {/* 4. Connectivity Freshness Card */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Radio className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-xs font-semibold text-[#57534e]">Hardware State</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-[#78716c]">
            {latestReading?.device_id || 'beehive-001'}
          </span>
        </div>

        <div className="flex items-center space-x-2.5 my-2">
          <span className="relative flex h-3 w-3">
            {!isOffline && !isStale && latestReading ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </>
            ) : isStale ? (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            )}
          </span>
          <span className={`text-2xl font-bold tracking-tight capitalize ${
            !isOffline && !isStale && latestReading
              ? 'text-emerald-700'
              : isStale
              ? 'text-amber-700'
              : 'text-rose-700'
          }`}>
            {!latestReading ? 'No Telemetry' : isOffline ? 'Offline' : isStale ? 'Stale Signal' : 'Online Stream'}
          </span>
        </div>

        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-[#78716c]">
          <span>ESP32 Wi-Fi</span>
          <span className="font-mono text-[11px] text-[#a8a29e]">GPIO 4 (D4)</span>
        </div>

        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-emerald-400/5 blur-xl pointer-events-none" />
      </div>

    </div>
  );
};
