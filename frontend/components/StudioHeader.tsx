'use client';

import React from 'react';
import { NavTab, Device } from '../lib/types';
import {
  Compass,
  LineChart,
  Bell,
  Cpu,
  Sliders,
  RefreshCw,
  Send,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StudioHeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  backendConnected: boolean;
  nodeConnected: boolean;
  secondsSinceLastPacket: number | null;
  latestReadingTimestamp?: string | null;
  activeAlertCount: number;
  onRefresh: () => void;
  onOpenTestModal: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  currentTab,
  onSelectTab,
  devices,
  selectedDeviceId,
  onSelectDevice,
  backendConnected,
  nodeConnected,
  secondsSinceLastPacket,
  latestReadingTimestamp,
  activeAlertCount,
  onRefresh,
  onOpenTestModal,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'studio', label: 'Biome Studio', icon: Compass },
    { id: 'stream', label: 'Telemetry Stream', icon: LineChart },
    { id: 'alerts', label: 'Alerts Log', icon: Bell },
    { id: 'device', label: 'Hardware Fleet', icon: Cpu },
    { id: 'settings', label: 'Incubation Limits', icon: Sliders },
  ];

  const formatPacketAge = (sec: number | null, ts?: string | null) => {
    if (sec === null || !ts) return 'No packets';
    if (sec < 60) return `${Math.floor(sec)}s ago`;
    const mins = Math.floor(sec / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <header className="border-b border-[#DFE5DC] bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand & Identity */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => onSelectTab('studio')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EDF5EF] border border-[#C6DACB] flex items-center justify-center text-[#2D5A3C] transition-transform group-hover:scale-105">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9A9 9 0 0 1 3 11a9 9 0 0 1 9-9Z" />
                <path d="M12 7v10" />
                <path d="M8 10c1.5 1.5 4 1.5 5.5 0" />
                <path d="M10.5 14c1.5 1.5 4 1.5 5.5 0" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-[#18261C]">
                  Smart Beehive
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EDF5EF] text-[#2D5A3C] border border-[#C6DACB]">
                  Biome Studio
                </span>
              </div>
              <p className="text-[11px] text-[#6E7F72]">
                Brood Microclimate Observability
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = currentTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTab(t.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#EDF5EF] text-[#2D5A3C] shadow-xs'
                      : 'text-[#5C6C5E] hover:text-[#18261C] hover:bg-[#F6F8F5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {t.id === 'alerts' && activeAlertCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {activeAlertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Status Hub: Device State, API State, Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Node Connection Pill (Accurate Data State) */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              nodeConnected
                ? 'bg-[#EDF5EF] border-[#C6DACB] text-[#2D5A3C]'
                : 'bg-[#F9F5EC] border-[#E8DCBF] text-[#8C6420]'
            }`}
            title={`Node: ${selectedDeviceId || 'beehive-001'} · Last packet: ${formatPacketAge(secondsSinceLastPacket, latestReadingTimestamp)}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                nodeConnected ? 'bg-[#2D5A3C] animate-beacon' : 'bg-[#D98A26]'
              }`}
            />
            <span className="font-semibold">
              {nodeConnected ? 'Transmitter Live' : `Idle (${formatPacketAge(secondsSinceLastPacket, latestReadingTimestamp)})`}
            </span>
          </div>

          {/* Test Ingestion Button */}
          <button
            onClick={onOpenTestModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#8C6420] bg-[#F9F5EC] hover:bg-[#F2EAD2] border border-[#E8DCBF] rounded-lg transition-colors active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Diagnostic Ingest</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Refresh API Data"
            className="p-1.5 text-[#5C6C5E] hover:text-[#18261C] rounded-lg hover:bg-[#F6F8F5] border border-[#DFE5DC] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Strip */}
      <div className="md:hidden flex items-center justify-around border-t border-[#DFE5DC] px-2 py-2 overflow-x-auto bg-[#FAFCF9]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                isActive ? 'bg-[#EDF5EF] text-[#2D5A3C] font-bold' : 'text-[#5C6C5E]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

