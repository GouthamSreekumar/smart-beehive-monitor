'use client';

import React, { useState } from 'react';
import { X, Send, Beaker, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { postReading } from '../lib/api';

interface TestIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDeviceId: string;
  onSuccess: (message: string) => void;
}

export const TestIngestModal: React.FC<TestIngestModalProps> = ({
  isOpen,
  onClose,
  selectedDeviceId,
  onSuccess,
}) => {
  const [temperature, setTemperature] = useState<number>(34.4);
  const [humidity, setHumidity] = useState<number>(62.0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const targetDevice = selectedDeviceId || 'beehive-001';

    try {
      await postReading({
        device_id: targetDevice,
        temperature_c: Number(temperature),
        humidity_pct: Number(humidity),
      });

      onSuccess(`Diagnostic test reading posted: ${temperature}°C, ${humidity}% RH to ${targetDevice}`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post test reading to backend API');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/20 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="agri-card bg-surface max-w-md w-full p-6 shadow-dropdown animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-honey-50 border border-honey-200 flex items-center justify-center text-honey-600">
              <Beaker className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-primary">
                Send Diagnostic Test Reading
              </h3>
              <p className="text-[11px] text-ink-muted">Pipeline & Telemetry Verification</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink-primary rounded-md hover:bg-canvas transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative notice */}
        <div className="my-4 p-3 bg-canvas rounded-lg border border-border-light text-xs text-ink-secondary leading-relaxed">
          <span className="font-semibold text-ink-primary">Diagnostic Mode: </span>
          This transmits an explicit test payload directly to the FastAPI <code className="font-mono text-primary-700 bg-primary-50 px-1 py-0.5 rounded">POST /api/readings</code> endpoint. Useful to verify database writes and live charts while the physical ESP32 is offline.
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-critical/10 border border-status-critical/20 text-xs text-status-critical flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Test Reading Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="10"
                max="50"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                className="w-full bg-canvas border border-border-light rounded-lg px-3 py-2 text-ink-primary text-xs focus:outline-none focus:border-primary-500 font-medium"
                required
              />
              <span className="text-[10px] text-ink-muted mt-0.5 block">Brood nominal ~34.5°C</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Humidity (% RH)
              </label>
              <input
                type="number"
                step="0.1"
                min="10"
                max="95"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
                className="w-full bg-canvas border border-border-light rounded-lg px-3 py-2 text-ink-primary text-xs focus:outline-none focus:border-primary-500 font-medium"
                required
              />
              <span className="text-[10px] text-ink-muted mt-0.5 block">Optimal ~60.0%</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-ink-secondary hover:text-ink-primary rounded-lg hover:bg-canvas transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-surface bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Transmitting...' : 'Send Test Packet'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

