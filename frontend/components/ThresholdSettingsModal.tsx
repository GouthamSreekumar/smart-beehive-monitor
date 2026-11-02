'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-white rounded-lg max-w-md w-full border border-[#e5e5e0] shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#ecece8] flex items-center justify-between bg-[#fafaf8]">
          <div>
            <h3 className="text-sm font-semibold text-[#1c1d1a]">Target Threshold Limits</h3>
            <p className="text-[11px] text-[#78756c]">Brood nest physiological parameters</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8c887b] hover:text-[#1c1d1a] hover:bg-[#f1f1ec] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-[#78756c] leading-relaxed">
            Healthy <i>Apis mellifera</i> brood is actively maintained between 32.0°C and 36.0°C.
            Deviations outside these ranges trigger automatic warning indicators.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4a4944] mb-1">
                Min Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={minTemp}
                onChange={(e) => setMinTemp(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#deded8] rounded bg-[#fdfdfb] focus:border-[#1c1d1a] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a4944] mb-1">
                Max Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={maxTemp}
                onChange={(e) => setMaxTemp(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#deded8] rounded bg-[#fdfdfb] focus:border-[#1c1d1a] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a4944] mb-1">
                Min Humidity (% RH)
              </label>
              <input
                type="number"
                step="1"
                value={minHumidity}
                onChange={(e) => setMinHumidity(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#deded8] rounded bg-[#fdfdfb] focus:border-[#1c1d1a] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a4944] mb-1">
                Max Humidity (% RH)
              </label>
              <input
                type="number"
                step="1"
                value={maxHumidity}
                onChange={(e) => setMaxHumidity(parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#deded8] rounded bg-[#fdfdfb] focus:border-[#1c1d1a] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#ecece8] flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#78756c] hover:text-[#1c1d1a] underline underline-offset-2"
            >
              Reset to Defaults
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-[#4a4944] hover:bg-[#f4f4f0] rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium bg-[#1c1d1a] text-white rounded hover:bg-[#2e2f2b]"
              >
                Apply Limits
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
