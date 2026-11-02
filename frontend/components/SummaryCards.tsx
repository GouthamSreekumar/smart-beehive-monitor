'use client';

import React from 'react';
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
  thresholds,
  isStale,
  isOffline,
  secondsSinceLastReading,
}) => {
  const temp = latestReading ? latestReading.temperature_c : null;
  const humidity = latestReading ? latestReading.humidity_pct : null;

  // Scientific condition calculation
  let tempLabel = 'Normal';
  let tempColor = 'text-[#3e5843]';
  if (temp !== null) {
    if (temp < thresholds.minTemp) {
      tempLabel = 'Chilled Brood';
      tempColor = 'text-blue-700';
    } else if (temp > thresholds.maxTemp) {
      tempLabel = 'High Heat';
      tempColor = 'text-amber-800';
    }
  }

  let humLabel = 'Balanced';
  let humColor = 'text-[#3e5843]';
  if (humidity !== null) {
    if (humidity < thresholds.minHumidity) {
      humLabel = 'Dry';
      humColor = 'text-amber-800';
    } else if (humidity > thresholds.maxHumidity) {
      humLabel = 'Moist / Condensation';
      humColor = 'text-blue-700';
    }
  }

  const formatRelative = (seconds: number | null) => {
    if (seconds === null) return 'No readings yet';
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    const mins = Math.floor(seconds / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      
      {/* 1. Brood Nest Temperature */}
      <div className="bg-white rounded-lg p-4 border border-[#e8e8e3] transition-all hover:border-[#deded8]">
        <div className="flex items-center justify-between text-xs text-[#78756c] font-medium mb-2.5">
          <span>Brood Temperature</span>
          <span className="font-mono text-[11px] text-[#9c9990]">{thresholds.minTemp}–{thresholds.maxTemp}°C</span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-semibold tracking-tight text-[#1c1d1a] font-mono">
            {temp !== null ? temp.toFixed(1) : '--'}
          </span>
          <span className="text-sm font-normal text-[#8c887b]">°C</span>
        </div>
        <div className="mt-3 text-[11px] font-medium flex items-center justify-between border-t border-[#f4f4f0] pt-2.5">
          <span className={tempColor}>{temp !== null ? tempLabel : 'Awaiting data'}</span>
          <span className="text-[#a19d93] text-[10px] font-mono">Optimum ~34.5°C</span>
        </div>
      </div>

      {/* 2. Relative Humidity */}
      <div className="bg-white rounded-lg p-4 border border-[#e8e8e3] transition-all hover:border-[#deded8]">
        <div className="flex items-center justify-between text-xs text-[#78756c] font-medium mb-2.5">
          <span>Relative Humidity</span>
          <span className="font-mono text-[11px] text-[#9c9990]">{thresholds.minHumidity}–{thresholds.maxHumidity}%</span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-semibold tracking-tight text-[#1c1d1a] font-mono">
            {humidity !== null ? humidity.toFixed(1) : '--'}
          </span>
          <span className="text-sm font-normal text-[#8c887b]">% RH</span>
        </div>
        <div className="mt-3 text-[11px] font-medium flex items-center justify-between border-t border-[#f4f4f0] pt-2.5">
          <span className={humColor}>{humidity !== null ? humLabel : 'Awaiting data'}</span>
          <span className="text-[#a19d93] text-[10px] font-mono">50–70% Target</span>
        </div>
      </div>

      {/* 3. Freshness / Last Observed */}
      <div className="bg-white rounded-lg p-4 border border-[#e8e8e3] transition-all hover:border-[#deded8]">
        <div className="flex items-center justify-between text-xs text-[#78756c] font-medium mb-2.5">
          <span>Last Transmission</span>
          <span className="text-[11px] font-mono text-[#9c9990]">UTC / Local</span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-medium tracking-tight text-[#1c1d1a] font-mono">
            {latestReading
              ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '--:--:--'}
          </span>
        </div>
        <div className="mt-3 text-[11px] font-medium flex items-center justify-between border-t border-[#f4f4f0] pt-2.5">
          <span className="text-[#68655c]">{formatRelative(secondsSinceLastReading)}</span>
          <span className="text-[#a19d93] text-[10px] font-mono">2s sync</span>
        </div>
      </div>

      {/* 4. Telemetry State */}
      <div className="bg-white rounded-lg p-4 border border-[#e8e8e3] transition-all hover:border-[#deded8]">
        <div className="flex items-center justify-between text-xs text-[#78756c] font-medium mb-2.5">
          <span>Transmitter State</span>
          <span className="font-mono text-[11px] text-[#9c9990]">{latestReading?.device_id || 'beehive-001'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              !isOffline && !isStale && latestReading
                ? 'bg-emerald-600'
                : isStale
                ? 'bg-amber-500'
                : 'bg-[#a19d93]'
            }`}
          />
          <span className="text-lg font-medium tracking-tight text-[#1c1d1a]">
            {!latestReading ? 'Awaiting Device' : isOffline ? 'Offline' : isStale ? 'Stale Signal' : 'Active Stream'}
          </span>
        </div>
        <div className="mt-3 text-[11px] font-medium flex items-center justify-between border-t border-[#f4f4f0] pt-2.5 text-[#78756c]">
          <span>ESP32 Wi-Fi</span>
          <span className="font-mono text-[10px] text-[#a19d93]">GPIO 4 (DHT22)</span>
        </div>
      </div>

    </div>
  );
};
