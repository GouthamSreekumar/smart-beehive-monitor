'use client';

import React from 'react';
import { Thermometer, Droplets, Clock, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SensorReading, AlertThresholds, Device } from '../lib/types';

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
  activeDevice,
  thresholds,
  isStale,
  isOffline,
  secondsSinceLastReading,
}) => {
  // Temperature evaluation
  const temp = latestReading ? latestReading.temperature_c : null;
  let tempStatus: 'normal' | 'low' | 'high' | 'none' = 'none';
  if (temp !== null) {
    if (temp < thresholds.minTemp) tempStatus = 'low';
    else if (temp > thresholds.maxTemp) tempStatus = 'high';
    else tempStatus = 'normal';
  }

  // Humidity evaluation
  const humidity = latestReading ? latestReading.humidity_pct : null;
  let humidityStatus: 'normal' | 'low' | 'high' | 'none' = 'none';
  if (humidity !== null) {
    if (humidity < thresholds.minHumidity) humidityStatus = 'low';
    else if (humidity > thresholds.maxHumidity) humidityStatus = 'high';
    else humidityStatus = 'normal';
  }

  // Format relative time
  const formatTimeAgo = (seconds: number | null) => {
    if (seconds === null) return 'No data yet';
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Temperature Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hive Temperature</span>
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {temp !== null ? `${temp.toFixed(1)}` : '--'}
          </span>
          <span className="text-lg font-medium text-slate-500">°C</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Target: <span className="font-medium text-slate-700">{thresholds.minTemp}–{thresholds.maxTemp}°C</span>
          </div>
          {tempStatus === 'normal' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              Optimal Brood
            </span>
          )}
          {tempStatus === 'low' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              Below Target
            </span>
          )}
          {tempStatus === 'high' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
              Above Target
            </span>
          )}
        </div>
      </div>

      {/* 2. Humidity Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Relative Humidity</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {humidity !== null ? `${humidity.toFixed(1)}` : '--'}
          </span>
          <span className="text-lg font-medium text-slate-500">%</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Target: <span className="font-medium text-slate-700">{thresholds.minHumidity}–{thresholds.maxHumidity}%</span>
          </div>
          {humidityStatus === 'normal' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              Normal
            </span>
          )}
          {humidityStatus === 'low' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              Dry Air
            </span>
          )}
          {humidityStatus === 'high' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
              Excess Moisture
            </span>
          )}
        </div>
      </div>

      {/* 3. Last Reading Timestamp */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Reading Time</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            {latestReading
              ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '--:--:--'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {formatTimeAgo(secondsSinceLastReading)}
          </span>
          <span className="text-slate-400">
            {latestReading ? new Date(latestReading.timestamp).toLocaleDateString() : 'Awaiting sensor'}
          </span>
        </div>
      </div>

      {/* 4. Connectivity / Freshness Status */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Device Status</span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              !isOffline && !isStale && latestReading
                ? 'bg-emerald-50 text-emerald-600'
                : isStale
                ? 'bg-amber-50 text-amber-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span
            className={`text-2xl font-bold tracking-tight capitalize ${
              !isOffline && !isStale && latestReading
                ? 'text-emerald-700'
                : isStale
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            {!latestReading ? 'No Device' : isOffline ? 'Offline' : isStale ? 'Stale Data' : 'Online'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Device: <span className="font-semibold text-slate-700">{latestReading?.device_id || 'None'}</span>
          </span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              !isOffline && !isStale && latestReading
                ? 'bg-emerald-500 animate-pulse'
                : isStale
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

