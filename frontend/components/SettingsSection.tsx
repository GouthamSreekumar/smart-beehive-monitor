'use client';

import React, { useState, useEffect } from 'react';
import { AlertThresholds } from '../lib/types';
import { updateThresholdSettings, fetchThresholdSettings } from '../lib/api';
import { Settings, Save, RotateCcw, CheckCircle2, AlertCircle, Info, Sliders } from 'lucide-react';

interface SettingsSectionProps {
  currentThresholds: AlertThresholds;
  onThresholdsUpdated: (newThresholds: AlertThresholds) => void;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  minTemp: 32.0,
  maxTemp: 36.0,
  minHumidity: 50.0,
  maxHumidity: 70.0,
};

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  currentThresholds,
  onThresholdsUpdated,
}) => {
  const [minTemp, setMinTemp] = useState<number>(currentThresholds.minTemp);
  const [maxTemp, setMaxTemp] = useState<number>(currentThresholds.maxTemp);
  const [minHumidity, setMinHumidity] = useState<number>(currentThresholds.minHumidity);
  const [maxHumidity, setMaxHumidity] = useState<number>(currentThresholds.maxHumidity);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    setMinTemp(currentThresholds.minTemp);
    setMaxTemp(currentThresholds.maxTemp);
    setMinHumidity(currentThresholds.minHumidity);
    setMaxHumidity(currentThresholds.maxHumidity);
  }, [currentThresholds]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validation
    if (minTemp >= maxTemp) {
      setErrorMessage('Minimum temperature must be strictly less than maximum temperature.');
      return;
    }
    if (minHumidity >= maxHumidity) {
      setErrorMessage('Minimum humidity must be strictly less than maximum humidity.');
      return;
    }
    if (minTemp < 10 || maxTemp > 50) {
      setErrorMessage('Temperature thresholds must be within realistic bee brood range (10°C to 50°C).');
      return;
    }
    if (minHumidity < 10 || maxHumidity > 95) {
      setErrorMessage('Humidity thresholds must be within 10% to 95% RH.');
      return;
    }

    const payload: AlertThresholds = {
      minTemp: Number(minTemp),
      maxTemp: Number(maxTemp),
      minHumidity: Number(minHumidity),
      maxHumidity: Number(maxHumidity),
    };

    setIsSaving(true);
    try {
      // 1. Try persisting directly to backend API
      const updated = await updateThresholdSettings(payload);
      onThresholdsUpdated(updated);
      setSuccessMessage('Threshold configuration successfully persisted to backend server and database storage.');
    } catch (err: any) {
      console.warn('Backend threshold update fallback to local:', err);
      // Fallback update
      onThresholdsUpdated(payload);
      setSuccessMessage('Settings saved locally. Note: Backend threshold endpoint was unreachable.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleResetDefaults = async () => {
    setMinTemp(DEFAULT_THRESHOLDS.minTemp);
    setMaxTemp(DEFAULT_THRESHOLDS.maxTemp);
    setMinHumidity(DEFAULT_THRESHOLDS.minHumidity);
    setMaxHumidity(DEFAULT_THRESHOLDS.maxHumidity);

    setIsSaving(true);
    try {
      const updated = await updateThresholdSettings(DEFAULT_THRESHOLDS);
      onThresholdsUpdated(updated);
      setSuccessMessage('Thresholds reset to scientific apicultural defaults (32.0–36.0°C, 50.0–70.0% RH).');
    } catch (err) {
      onThresholdsUpdated(DEFAULT_THRESHOLDS);
      setSuccessMessage('Thresholds reset to defaults locally.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-honey-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Brood Nest Safe Operating Thresholds
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-industrial-850 text-industrial-400 border border-industrial-800">
          FastAPI / PostgreSQL Persisted
        </span>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 flex items-center space-x-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Temperature Thresholds Card */}
        <div className="panel-card rounded-lg p-5 bg-industrial-900 border-industrial-800 space-y-4">
          <div className="flex items-center justify-between border-b border-industrial-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Temperature Threshold Bounds</h3>
              <p className="text-xs text-industrial-400">
                Brood nest thermoregulation triggers for worker bees (Apis mellifera)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-honey-400 bg-honey-500/10 px-2.5 py-1 rounded border border-honey-500/30">
              Safe: {minTemp}°C to {maxTemp}°C
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-industrial-300 mb-1.5 font-mono">
                Minimum Brood Temperature (°C)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="15"
                  max="40"
                  value={minTemp}
                  onChange={(e) => setMinTemp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-honey-500 transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-industrial-500 font-mono">°C</span>
              </div>
              <p className="text-[11px] text-industrial-500 mt-1">
                Hypothermia alert threshold. Below 32°C chilled brood mortality occurs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-industrial-300 mb-1.5 font-mono">
                Maximum Brood Temperature (°C)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="48"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-honey-500 transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-industrial-500 font-mono">°C</span>
              </div>
              <p className="text-[11px] text-industrial-500 mt-1">
                Hyperthermia alert threshold. Above 36°C bees perform wing fanning.
              </p>
            </div>
          </div>
        </div>

        {/* Humidity Thresholds Card */}
        <div className="panel-card rounded-lg p-5 bg-industrial-900 border-industrial-800 space-y-4">
          <div className="flex items-center justify-between border-b border-industrial-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Relative Humidity Threshold Bounds</h3>
              <p className="text-xs text-industrial-400">
                Moisture ranges to prevent fungal pathogen proliferation and egg desiccation
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded border border-sky-500/30">
              Safe: {minHumidity}% to {maxHumidity}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-industrial-300 mb-1.5 font-mono">
                Minimum Relative Humidity (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="65"
                  value={minHumidity}
                  onChange={(e) => setMinHumidity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-industrial-500 font-mono">% RH</span>
              </div>
              <p className="text-[11px] text-industrial-500 mt-1">
                Minimum moisture for egg incubation. Below 50% causes egg hatching failure.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-industrial-300 mb-1.5 font-mono">
                Maximum Relative Humidity (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="55"
                  max="90"
                  value={maxHumidity}
                  onChange={(e) => setMaxHumidity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-industrial-500 font-mono">% RH</span>
              </div>
              <p className="text-[11px] text-industrial-500 mt-1">
                Upper moisture ceiling. Above 70% condensation triggers fungal chalkbrood.
              </p>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3 py-2 rounded text-xs font-mono font-medium text-industrial-400 hover:text-white bg-industrial-850 hover:bg-industrial-800 border border-industrial-800 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Apicultural Defaults</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-5 py-2 rounded text-xs font-mono font-bold bg-honey-500 hover:bg-honey-600 text-industrial-950 shadow-glow-amber transition-all disabled:opacity-50 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Persisting to Database...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};

