'use client';

import React from 'react';
import { SlidersHorizontal, Play, Pause, Activity, RefreshCw } from 'lucide-react';

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
}) => {
  return (
    <header className="border-b border-[#eadeca]/80 bg-white/75 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Animated Brand Identity */}
        <div className="flex items-center space-x-3.5 group cursor-pointer">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbf2dd] to-[#f4dfb4] border border-[#dfca9f] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            {/* Animated SVG Bee Artwork */}
            <div className="animate-bee-hover">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                {/* Wings */}
                <ellipse cx="14" cy="11" rx="5" ry="7" transform="rotate(-30 14 11)" fill="#c9e8fa" fillOpacity="0.75" stroke="#7ebce6" strokeWidth="1.2" />
                <ellipse cx="22" cy="11" rx="5" ry="7" transform="rotate(30 22 11)" fill="#c9e8fa" fillOpacity="0.75" stroke="#7ebce6" strokeWidth="1.2" />
                {/* Body */}
                <ellipse cx="18" cy="21" rx="9" ry="11" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
                {/* Stripes */}
                <path d="M11 18 Q18 20 25 18" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M11.5 23 Q18 25 24.5 23" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
                {/* Head */}
                <circle cx="18" cy="11" r="5" fill="#78350f" />
                <circle cx="16" cy="10" r="1.2" fill="#ffffff" />
                <circle cx="20" cy="10" r="1.2" fill="#ffffff" />
                {/* Stinger */}
                <polygon points="18,33 16,30 20,30" fill="#451a03" />
              </svg>
            </div>
            {/* Soft glow indicator behind bee */}
            <div className="absolute -inset-0.5 rounded-xl bg-amber-400/20 blur-[3px] -z-10 group-hover:bg-amber-400/40 transition-colors" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-[#292524] group-hover:text-amber-800 transition-colors">
                Smart Beehive
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                ESP32 + DHT22
              </span>
            </div>
            <p className="text-xs text-[#78716c] font-medium flex items-center space-x-1.5">
              <span>Brood Nest Microclimate</span>
              <span className="w-1 h-1 rounded-full bg-[#d6d3d1]" />
              <span className="text-amber-700">Live Hive 01</span>
            </p>
          </div>
        </div>

        {/* Action Controls with interactive feedback */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Live Ping status badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#e7e5e4] bg-white/90 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${backendConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </span>
            <span className={backendConnected ? 'text-emerald-800' : 'text-rose-700'}>
              {backendConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Polling toggle */}
          <button
            onClick={togglePolling}
            title={isPolling ? 'Streaming telemetry every 3s' : 'Stream paused'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e7e5e4] bg-white/90 hover:bg-amber-50 hover:border-amber-300 text-[#44403c] transition-all active:scale-95 shadow-xs"
          >
            {isPolling ? (
              <>
                <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="hidden sm:inline">Stream 3s</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Resume</span>
              </>
            )}
          </button>

          {/* Test Reading button with spring bounce animation */}
          <button
            onClick={onSimulateData}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 bg-gradient-to-b from-[#fef7e8] to-[#fbf0d3] hover:from-[#fdf1d4] hover:to-[#f9e7bd] text-[#78350f] shadow-xs active:scale-95 transition-all"
            title="Inject simulated sensor reading"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Sampling...' : 'Test Ingest'}</span>
          </button>

          {/* Threshold settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#292524] text-white hover:bg-amber-950 transition-all active:scale-95 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Alert Bounds</span>
          </button>

        </div>

      </div>
    </header>
  );
};
