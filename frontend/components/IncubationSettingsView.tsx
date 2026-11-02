'use client';

import React, { useState, useEffect } from 'react';
import { AlertThresholds } from '../lib/types';
import { updateThresholdSettings } from '../lib/api';
import { Sliders, Save, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface IncubationSettingsViewProps {
  currentThresholds: AlertThresholds;
  onThresholdsUpdated: (newThresholds: AlertThresholds) => void;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  minTemp: 32.0,
  maxTemp: 36.0,
  minHumidity: 50.0,
  maxHumidity: 70.0,
};

export const IncubationSettingsView: React.FC<IncubationSettingsViewProps> = ({
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

    if (minTemp >= maxTemp) {
      setErrorMessage('Minimum temperature must be strictly less than maximum temperature.');
      return;
    }
    if (minHumidity >= maxHumidity) {
      setErrorMessage('Minimum humidity must be strictly less than maximum humidity.');
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
      setSuccessMessage('Safe incubation boundaries persisted to backend server successfully.');
    } catch (err: any) {
      onThresholdsUpdated(payload);
      setSuccessMessage('Settings updated locally (backend endpoint fallback).');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleReset = async () => {
    setMinTemp(DEFAULT_THRESHOLDS.minTemp);
    setMaxTemp(DEFAULT_THRESHOLDS.maxTemp);
    setMinHumidity(DEFAULT_THRESHOLDS.minHumidity);
    setMaxHumidity(DEFAULT_THRESHOLDS.maxHumidity);

    setIsSaving(true);
    try {
      const updated = await updateThresholdSettings(DEFAULT_THRESHOLDS);
      onThresholdsUpdated(updated);
      setSuccessMessage('Reset to scientific apicultural standards (32.0–36.0°C, 50.0–70.0% RH).');
    } catch {
      onThresholdsUpdated(DEFAULT_THRESHOLDS);
      setSuccessMessage('Reset to standards locally.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-stage-enter">
      
      <div className="studio-stage p-6">
        <h2 className="text-base font-bold text-[#18261C]">
          Brood Incubation Physiological Boundaries
        </h2>
        <p className="text-xs text-[#6E7F72] mt-1 leading-relaxed">
          Define the operating corridor for brood nest environmental thresholds. Readings outside these bounds automatically trigger alerts and update threshold markers across the monitoring overview.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#EDF5EF] border border-[#C6DACB] text-xs font-semibold text-[#2D5A3C] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#2D5A3C] flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Temperature Card */}
        <div className="studio-stage p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DFE5DC]">
            <div>
              <h3 className="text-sm font-bold text-[#18261C]">Thermal Boundaries</h3>
              <p className="text-xs text-[#6E7F72]">Incubation floor and ceiling</p>
            </div>
            <span className="text-xs font-semibold text-[#2D5A3C] bg-[#EDF5EF] px-2.5 py-1 rounded-md">
              Target: {minTemp}°C to {maxTemp}°C
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#18261C] mb-1.5">
                Minimum Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="15"
                max="40"
                value={minTemp}
                onChange={(e) => setMinTemp(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#F6F8F5] border border-[#DFE5DC] rounded-lg px-3 py-2 text-sm text-[#18261C] font-semibold focus:outline-none focus:border-[#2D5A3C] focus:bg-white transition-colors"
                required
              />
              <span className="text-[11px] text-[#6E7F72] mt-1 block">Chilled brood hypothermia threshold.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#18261C] mb-1.5">
                Maximum Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="48"
                value={maxTemp}
                onChange={(e) => setMaxTemp(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#F6F8F5] border border-[#DFE5DC] rounded-lg px-3 py-2 text-sm text-[#18261C] font-semibold focus:outline-none focus:border-[#2D5A3C] focus:bg-white transition-colors"
                required
              />
              <span className="text-[11px] text-[#6E7F72] mt-1 block">Wing fanning and comb softening threshold.</span>
            </div>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="studio-stage p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DFE5DC]">
            <div>
              <h3 className="text-sm font-bold text-[#18261C]">Moisture Boundaries</h3>
              <p className="text-xs text-[#6E7F72]">Fungal suppression and desiccation control</p>
            </div>
            <span className="text-xs font-semibold text-[#8C6420] bg-[#F9F5EC] px-2.5 py-1 rounded-md">
              Target: {minHumidity}% to {maxHumidity}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#18261C] mb-1.5">
                Minimum Relative Humidity (%)
              </label>
              <input
                type="number"
                step="1"
                min="20"
                max="65"
                value={minHumidity}
                onChange={(e) => setMinHumidity(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#F6F8F5] border border-[#DFE5DC] rounded-lg px-3 py-2 text-sm text-[#18261C] font-semibold focus:outline-none focus:border-[#2D5A3C] focus:bg-white transition-colors"
                required
              />
              <span className="text-[11px] text-[#6E7F72] mt-1 block">Egg hatching moisture limit.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#18261C] mb-1.5">
                Maximum Relative Humidity (%)
              </label>
              <input
                type="number"
                step="1"
                min="55"
                max="90"
                value={maxHumidity}
                onChange={(e) => setMaxHumidity(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#F6F8F5] border border-[#DFE5DC] rounded-lg px-3 py-2 text-sm text-[#18261C] font-semibold focus:outline-none focus:border-[#2D5A3C] focus:bg-white transition-colors"
                required
              />
              <span className="text-[11px] text-[#6E7F72] mt-1 block">Condensation chalkbrood ceiling.</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="studio-stage p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-[#6E7F72] hover:text-[#18261C] rounded-lg hover:bg-[#F6F8F5] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standards</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-[#2D5A3C] hover:bg-[#23472F] rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Persisting...' : 'Save Incubation Limits'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

