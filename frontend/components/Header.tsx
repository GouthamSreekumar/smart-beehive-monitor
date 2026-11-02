'use client';

import React from 'react';
import { SlidersHorizontal, Play, Pause } from 'lucide-react';

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
    <header className="border-b border-[#ecece8] bg-[#fbfbfa]/80 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand identity: Clean, artisanal & understated */}
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#f4efe4] border border-[#e5dcce] flex items-center justify-center text-[#946a2f]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z"/>
              <path d="M12 12l8-4.5"/>
              <path d="M12 12v10"/>
              <path d="M12 12L4 7.5"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-[#1c1d1a]">Beehive Telemetry</span>
              <span className="text-[11px] font-mono text-[#8c887b] tracking-normal">v1.0</span>
            </div>
            <p className="text-[11px] text-[#78756c]">Apis mellifera brood nest microclimate</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Connection status pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#e5e5e0] bg-white text-[#4a4944]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendConnected ? 'bg-emerald-600' : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span>{backendConnected ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Polling toggle */}
          <button
            onClick={togglePolling}
            title={isPolling ? 'Auto-refresh active (3s)' : 'Stream paused'}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#e5e5e0] bg-white text-[#4a4944] hover:bg-[#f6f6f2] transition-colors"
          >
            {isPolling ? <Pause className="w-3 h-3 text-[#78756c]" /> : <Play className="w-3 h-3 text-emerald-600" />}
            <span className="hidden sm:inline">{isPolling ? 'Live 3s' : 'Paused'}</span>
          </button>

          {/* Demo simulate button */}
          <button
            onClick={onSimulateData}
            disabled={isSimulating}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#ded9cc] bg-[#fbf8f0] text-[#7c5a24] hover:bg-[#f4efe0] transition-colors"
            title="Inject test telemetry point"
          >
            {isSimulating ? 'Sending...' : 'Test Reading'}
          </button>

          {/* Thresholds settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#1c1d1a] text-white hover:bg-[#2d2e2a] transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden sm:inline">Thresholds</span>
          </button>
        </div>

      </div>
    </header>
  );
};
