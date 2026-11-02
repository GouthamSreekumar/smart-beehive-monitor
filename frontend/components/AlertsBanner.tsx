'use client';

import React from 'react';
import { SensorReading, AlertThresholds } from '../lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AlertsBannerProps {
  latestReading: SensorReading | null;
  thresholds: AlertThresholds;
  isStale: boolean;
  isOffline: boolean;
  secondsSinceLastReading: number | null;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  latestReading,
  thresholds,
  isStale,
  isOffline,
  secondsSinceLastReading,
}) => {
  if (!latestReading) {
    return (
      <div className="bg-[#fcfaf5] border border-[#e8dfcf] rounded-lg p-3.5 flex items-center space-x-3 text-xs text-[#735520]">
        <AlertCircle className="w-4 h-4 text-[#a67926] flex-shrink-0" />
        <span>
          Awaiting telemetry: Connect your ESP32 or click <b>Test Reading</b> above to stream sample data.
        </span>
      </div>
    );
  }

  const issues: string[] = [];

  if (isOffline) {
    issues.push(`Device signal absent for ${Math.round(secondsSinceLastReading || 0)}s (>120s limit). Check ESP32 power.`);
  } else if (isStale) {
    issues.push(`Telemetry delayed (${Math.round(secondsSinceLastReading || 0)}s since last packet). Possible Wi-Fi congestion.`);
  }

  if (latestReading.temperature_c > thresholds.maxTemp) {
    issues.push(`Brood temperature (${latestReading.temperature_c}°C) exceeds ceiling (${thresholds.maxTemp}°C). Risk of hive hyperthermia.`);
  } else if (latestReading.temperature_c < thresholds.minTemp) {
    issues.push(`Brood temperature (${latestReading.temperature_c}°C) below threshold (${thresholds.minTemp}°C). Risk of chilled brood.`);
  }

  if (latestReading.humidity_pct > thresholds.maxHumidity) {
    issues.push(`Humidity (${latestReading.humidity_pct}%) high (> ${thresholds.maxHumidity}%). Excess moisture favors chalkbrood.`);
  } else if (latestReading.humidity_pct < thresholds.minHumidity) {
    issues.push(`Humidity (${latestReading.humidity_pct}%) low (< ${thresholds.minHumidity}%). Risk of larval desiccation.`);
  }

  if (issues.length === 0) {
    return (
      <div className="bg-[#f7f9f7] border border-[#dce5dc] rounded-lg p-3 flex items-center justify-between text-xs text-[#2e4732]">
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#4a6b4f]" />
          <span><b>Microclimate Stable:</b> Brood temperature and humidity are within healthy physiological range.</span>
        </div>
        <span className="text-[11px] font-mono text-[#5f8266]">Optimal Homeostasis</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((msg, idx) => (
        <div
          key={idx}
          className="bg-[#fcfbf9] border border-[#e8e4db] rounded-lg p-3 flex items-start space-x-2.5 text-xs text-[#5c492d]"
        >
          <AlertCircle className="w-4 h-4 text-[#a67c38] flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{msg}</div>
        </div>
      ))}
    </div>
  );
};
