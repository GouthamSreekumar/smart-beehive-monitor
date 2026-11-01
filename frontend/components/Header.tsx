'use client';

import React from 'react';
import { Activity, Settings, RefreshCw, Radio, PlayCircle, AlertCircle } from 'lucide-react';

interface HeaderProps {
  backendConnected: boolean;
  isPolling: boolean;
  togglePolling: () => void;
  onOpenSettings: () => void;
  onSimulateData: () => void;
  isSimulating: boolean;
  lastSyncTime: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  backendConnected,
  isPolling,
  togglePolling,
  onOpenSettings,
  onSimulateData,
  isSimulating,
  lastSyncTime,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-200">
            <span className="text-xl">🐝</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Smart Beehive Monitor</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200">
                ESP32 + DHT22
              </span>
            </div>
            <p className="text-xs text-slate-500">Real-time Brood Nest Telemetry & Anomaly Alerts</p>
          </div>
        </div>

        {/* Status and Controls */}
        <div className="flex items-center space-x-3">
          {/* Backend Health Badge */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              backendConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{backendConnected ? 'API Connected' : 'API Unreachable'}</span>
          </div>

          {/* Polling Toggle */}
          <button
            onClick={togglePolling}
            title={isPolling ? 'Live auto-refresh enabled (3s)' : 'Auto-refresh paused'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isPolling
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isPolling ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{isPolling ? 'Live 3s' : 'Paused'}</span>
          </button>

          {/* Demo Simulator Button */}
          <button
            onClick={onSimulateData}
            disabled={isSimulating}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSimulating
                ? 'bg-amber-100 text-amber-900 border-amber-300 opacity-75'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:shadow-sm'
            }`}
            title="Inject a test reading to test dashboard without hardware"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Demo Ingest</span>
          </button>

          {/* Threshold Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Thresholds</span>
          </button>
        </div>
      </div>
    </header>
  );
};

