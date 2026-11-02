'use client';

import React from 'react';
import { Menu, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Device, NavTab } from '../lib/types';

interface TopHeaderProps {
  currentTab: NavTab;
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  backendConnected: boolean;
  lastSyncSecondsAgo: number | null;
  onRefresh: () => void;
  onTriggerTestIngest: () => void;
  isTestIngesting: boolean;
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  devices,
  selectedDeviceId,
  onSelectDevice,
  backendConnected,
  lastSyncSecondsAgo,
  onRefresh,
  onTriggerTestIngest,
  isTestIngesting,
  onOpenMobileSidebar,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Apiary Overview',
      subtitle: 'Real-time brood nest microclimate conditions',
    },
    live: {
      title: 'Live Telemetry Stream',
      subtitle: 'Continuous temperature and humidity telemetry from ESP32',
    },
    analytics: {
      title: 'Historical Analytics',
      subtitle: 'Microclimate trends, ranges, and statistical averages',
    },
    alerts: {
      title: 'Alert Management',
      subtitle: 'Environmental threshold violations and sensor status',
    },
    devices: {
      title: 'Device Management',
      subtitle: 'Connected telemetry nodes and sensor hardware status',
    },
    settings: {
      title: 'Threshold Settings',
      subtitle: 'Configure safe biological ranges for brood incubation',
    },
  };

  const { title, subtitle } = titles[currentTab];

  return (
    <header className="h-18 px-5 sm:px-8 border-b border-border-light bg-surface/90 backdrop-blur-xs flex items-center justify-between sticky top-0 z-30 transition-colors">
      
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-canvas transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-semibold text-ink-primary tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-ink-muted hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Hive Selector, Connection Badge, Sync Timer, Actions */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5">
        
        {/* Device / Hive Selector (if multiple exist) */}
        {devices.length > 1 && (
          <select
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="text-xs bg-canvas border border-border-light text-ink-primary rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-400 font-medium"
          >
            <option value="">All Hives</option>
            {devices.map((d) => (
              <option key={d.device_id} value={d.device_id}>
                {d.device_id}
              </option>
            ))}
          </select>
        )}

        {/* Real-time Connection Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            backendConnected
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-status-critical/10 border-status-critical/20 text-status-critical'
          }`}
          title={backendConnected ? 'Backend API connection active' : 'Backend connection unavailable'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendConnected ? 'bg-primary-500' : 'bg-status-critical'
            }`}
          />
          <span className="hidden sm:inline">
            {backendConnected ? 'Online' : 'Disconnected'}
          </span>
        </div>

        {/* Last Updated Timestamp */}
        <span className="text-xs text-ink-muted hidden lg:inline">
          {lastSyncSecondsAgo !== null ? `Updated ${lastSyncSecondsAgo}s ago` : 'Connecting...'}
        </span>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          title="Refresh telemetry"
          className="p-1.5 text-ink-muted hover:text-ink-primary rounded-lg hover:bg-canvas border border-transparent hover:border-border-light transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Subtle Test Reading Button */}
        <button
          onClick={onTriggerTestIngest}
          disabled={isTestIngesting}
          title="Send test telemetry reading from browser"
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
        >
          <Send className={`w-3.5 h-3.5 ${isTestIngesting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Test Ingest</span>
        </button>
      </div>
    </header>
  );
};

