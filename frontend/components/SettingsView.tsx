'use client';

import React, { useState, useEffect } from 'react';
import { AlertThresholds } from '../lib/types';
import { updateThresholdSettings } from '../lib/api';
import { Settings, Save, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsViewProps {
  currentThresholds: AlertThresholds;
  onThresholdsUpdated: (newThresholds: AlertThresholds) => void;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  minTemp: 32.0,
  maxTemp: 36.0,
  minHumidity: 50.0,
  maxHumidity: 70.0,
};

export const SettingsView: React.FC<SettingsViewProps> = ({
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

    // Form validation
    if (minTemp >= maxTemp) {
      setErrorMessage('Minimum temperature must be strictly lower than maximum temperature.');
      return;
    }
    if (minHumidity >= maxHumidity) {
      setErrorMessage('Minimum humidity must be strictly lower than maximum humidity.');
      return;
    }
    if (minTemp < 10 || maxTemp > 50) {
      setErrorMessage('Temperature thresholds must be within realistic brood range (10°C to 50°C).');
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
      const updated = await updateThresholdSettings(payload);
      onThresholdsUpdated(updated);
      setSuccessMessage('Threshold configuration saved and persisted to database successfully.');
    } catch (err: any) {
      console.warn('Backend update failed, saving locally:', err);
      onThresholdsUpdated(payload);
      setSuccessMessage('Threshold settings saved locally.');
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
      setSuccessMessage('Thresholds reset to scientific apicultural standards (32.0–36.0°C, 50–70% RH).');
    } catch {
      onThresholdsUpdated(DEFAULT_THRESHOLDS);
      setSuccessMessage('Thresholds reset to standards locally.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Header notice */}
      <div className="agri-card p-5">
        <h3 className="text-sm font-semibold text-ink-primary">
          Safe Microclimate Operating Boundaries
        </h3>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          Configure the physiological safe ranges for the brood nest. Violations of these bounds automatically trigger alerts and monitoring flags in the dashboard.
        </p>
      </div>

      {/* Success / Error Feedback Banners */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-primary-50 border border-primary-200 text-xs text-primary-800 flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-status-critical/10 border border-status-critical/20 text-xs text-status-critical flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-status-critical flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Temperature Settings Card */}
        <div className="agri-card p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-ink-primary">
                Brood Temperature Limits
              </h4>
              <p className="text-xs text-ink-muted">
                Worker bee brood nest thermoregulation triggers
              </p>
            </div>
            <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
              Target: {minTemp}°C – {maxTemp}°C
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                Minimum Temperature (°C)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="15"
                  max="40"
                  value={minTemp}
                  onChange={(e) => setMinTemp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-canvas border border-border-light rounded-lg px-3 py-2 text-ink-primary text-sm focus:outline-none focus:border-primary-500 focus:bg-surface transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-ink-muted">°C</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Hypothermia floor. Below 32°C causes pupae chilling.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                Maximum Temperature (°C)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="48"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-canvas border border-border-light rounded-lg px-3 py-2 text-ink-primary text-sm focus:outline-none focus:border-primary-500 focus:bg-surface transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-ink-muted">°C</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Hyperthermia ceiling. Above 36°C induces fanning.
              </p>
            </div>
          </div>
        </div>

        {/* Humidity Settings Card */}
        <div className="agri-card p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-ink-primary">
                Relative Humidity Limits
              </h4>
              <p className="text-xs text-ink-muted">
                Moisture control to suppress mold while preventing egg desiccation
              </p>
            </div>
            <span className="text-xs font-medium text-honey-700 bg-honey-50 px-2.5 py-1 rounded-full border border-honey-200">
              Target: {minHumidity}% – {maxHumidity}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1.5">
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
                  className="w-full bg-canvas border border-border-light rounded-lg px-3 py-2 text-ink-primary text-sm focus:outline-none focus:border-primary-500 focus:bg-surface transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-ink-muted">%</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Minimum moisture level required for egg hatching.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1.5">
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
                  className="w-full bg-canvas border border-border-light rounded-lg px-3 py-2 text-ink-primary text-sm focus:outline-none focus:border-primary-500 focus:bg-surface transition-colors"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-ink-muted">%</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Condensation limit to prevent chalkbrood fungal spore growth.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons strip */}
        <div className="agri-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink-primary rounded-lg hover:bg-canvas transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Apicultural Defaults</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-surface bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving to Database...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

