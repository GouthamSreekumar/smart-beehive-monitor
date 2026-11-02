'use client';

import React from 'react';
import { SensorReading, AlertThresholds } from '../lib/types';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

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
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-center space-x-3 text-xs text-amber-900 shadow-xs">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
        <div className="leading-relaxed">
          <span className="font-bold">Awaiting Sensor Telemetry:</span> Connect your ESP32 or click <b>Test Ingest</b> in the top bar to stream simulated microclimate data.
        </div>
      </div>
    );
  }

  const issues: {
    title: string;
    desc: string;
    severity: 'warning' | 'critical';
  }[] = [];

  if (isOffline) {
    issues.push({
      title: 'Transmitter Offline',
      desc: `No sensor packets received for ${Math.round(secondsSinceLastReading || 0)}s (>120s limit). Check ESP32 power and Wi-Fi.`,
      severity: 'critical',
    });
  } else if (isStale) {
    issues.push({
      title: 'Stale Signal Detected',
      desc: `Last packet arrived ${Math.round(secondsSinceLastReading || 0)}s ago (>30s expected). Wi-Fi may be lagging.`,
      severity: 'warning',
    });
  }

  if (latestReading.temperature_c > thresholds.maxTemp) {
    issues.push({
      title: 'Brood Overheating Alert',
      desc: `Temperature is ${latestReading.temperature_c}°C (exceeds ${thresholds.maxTemp}°C). Bees are fanning wings; risk of wax comb softening.`,
      severity: 'critical',
    });
  } else if (latestReading.temperature_c < thresholds.minTemp) {
    issues.push({
      title: 'Chilled Brood Alert',
      desc: `Temperature is ${latestReading.temperature_c}°C (below ${thresholds.minTemp}°C). Cluster thermoregulation may be failing.`,
      severity: 'warning',
    });
  }

  if (latestReading.humidity_pct > thresholds.maxHumidity) {
    issues.push({
      title: 'High Moisture Warning',
      desc: `Humidity is ${latestReading.humidity_pct}% (> ${thresholds.maxHumidity}%). Excess moisture favors chalkbrood fungal spores.`,
      severity: 'warning',
    });
  } else if (latestReading.humidity_pct < thresholds.minHumidity) {
    issues.push({
      title: 'Low Relative Humidity',
      desc: `Humidity is ${latestReading.humidity_pct}% (< ${thresholds.minHumidity}%). Uncapped larvae risk dehydration.`,
      severity: 'warning',
    });
  }

  if (issues.length === 0) {
    return (
      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-900 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">Colony Thermal Homeostasis Maintained</span>
            <p className="text-[11px] text-emerald-700">Brood nest temperature and humidity are inside healthy biological limits.</p>
          </div>
        </div>
        <span className="hidden sm:inline-block font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Optimal State
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue, idx) => (
        <div
          key={idx}
          className={`rounded-xl p-3.5 border flex items-start space-x-3 text-xs shadow-xs transition-all ${
            issue.severity === 'critical'
              ? 'bg-rose-50/90 border-rose-200 text-rose-900'
              : 'bg-amber-50/90 border-amber-200 text-amber-900'
          }`}
        >
          {issue.severity === 'critical' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5 animate-bounce" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold">{issue.title}</span>
              <span
                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-mono ${
                  issue.severity === 'critical' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                }`}
              >
                {issue.severity}
              </span>
            </div>
            <p className="mt-0.5 text-stone-600 leading-relaxed">{issue.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
