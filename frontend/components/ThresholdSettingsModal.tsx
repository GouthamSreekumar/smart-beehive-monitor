'use client';

import React, { useState } from 'react';
import { X, Sliders, Info, RotateCcw, Check } from 'lucide-react';
import { AlertThresholds } from '../lib/types';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThresholds: AlertThresholds;
  onSave: (newThresholds: AlertThresholds) => void;
  onReset: () => void;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  minTemp: 32.0,
  maxTemp: 36.0,
  minHumidity: 50.0,
  maxHumidity: 70.0,
};

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  currentThresholds,
  onSave,
  onReset,
}) => {
  const [minTemp, setMinTemp] = useState(currentThresholds.minTemp);
  const [maxTemp, setMaxTemp] = useState(currentThresholds.maxTemp);
  const [minHumidity, setMinHumidity] = useState(currentThresholds.minHumidity);
  const [maxHumidity, setMaxHumidity] = useState(currentThresholds.maxHumidity);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      minTemp: Number(minTemp),
      maxTemp: Number(maxTemp),
      minHumidity: Number(minHumidity),
      maxHumidity: Number(maxHumidity),
    });
    onClose();
  };

  const handleReset = () => {
    setMinTemp(DEFAULT_THRESHOLDS.minTemp);
    setMaxTemp(DEFAULT_THRESHOLDS.maxTemp);
    setMinHumidity(DEFAULT_THRESHOLDS.minHumidity);
    setMaxHumidity(DEFAULT_THRESHOLDS.maxHumidity);
    onReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Alert Threshold Configuration</h3>
              <p className="text-xs text-slate-500">Fine-tune microclimate anomaly detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Beekeeping Scientific Guidance Callout */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Beekeeping Note:</span> A healthy honey bee (<i>Apis mellifera</i>)
              brood nest is tightly thermoregulated between <b>32.0°C and 36.0°C</b> (optimum ~34.5°C) and
              <b> 50% to 70% RH</b>. Sub-brood zones or honey supers experience wider ambient swings.
              Adjust these limits according to sensor placement and local seasonal targets.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Temperature Min */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Min Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={minTemp}
                onChange={(e) => setMinTemp(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 32.0°C (Chilling alert)</span>
            </div>

            {/* Temperature Max */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Max Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={maxTemp}
                onChange={(e) => setMaxTemp(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 36.0°C (Overheating alert)</span>
            </div>

            {/* Humidity Min */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Min Humidity (% RH)
              </label>
              <input
                type="number"
                step="1"
                min="10"
                max="100"
                value={minHumidity}
                onChange={(e) => setMinHumidity(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 50.0% (Dry brood alert)</span>
            </div>

            {/* Humidity Max */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Max Humidity (% RH)
              </label>
              <input
                type="number"
                step="1"
                min="10"
                max="100"
                value={maxHumidity}
                onChange={(e) => setMaxHumidity(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 70.0% (Mold/condensation)</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Thresholds</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

