'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  LineChart,
  Bell,
  Cpu,
  Settings,
  Sun,
  Moon,
  RefreshCw,
  Play,
  Pause,
  Send,
  Menu,
  X,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { NavTab, ThemeMode, Device } from '../lib/types';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  backendConnected: boolean;
  isPolling: boolean;
  onTogglePolling: () => void;
  onTriggerTestIngest: () => void;
  isTestIngesting: boolean;
  activeAlertCount: number;
  lastSyncSecondsAgo: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  devices,
  selectedDeviceId,
  onSelectDevice,
  theme,
  onToggleTheme,
  backendConnected,
  isPolling,
  onTogglePolling,
  onTriggerTestIngest,
  isTestIngesting,
  activeAlertCount,
  lastSyncSecondsAgo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Activity },
    { id: 'analytics', label: 'Historical Analytics', icon: LineChart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'devices', label: 'Device Management', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="border-b border-industrial-800 bg-industrial-950/95 dark:bg-industrial-950/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onSelectTab('overview')}
              className="flex items-center space-x-3 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-honey-500/20 to-honey-600/10 border border-honey-500/40 flex items-center justify-center text-honey-500 group-hover:border-honey-500 transition-all shadow-glow-amber">
                {/* Honeycomb Hexagon Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
                  <circle cx="12" cy="11" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-white dark:text-white">
                    Smart Beehive
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-honey-500/15 border border-honey-500/30 text-honey-400 font-semibold uppercase tracking-wider">
                    IoT Telemetry
                  </span>
                </div>
                <p className="text-[11px] text-industrial-400 font-medium">
                  Brood Nest Microclimate Observability
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-industrial-850 text-honey-400 border border-honey-500/30 shadow-xs'
                      : 'text-industrial-400 hover:text-industrial-200 hover:bg-industrial-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-honey-400' : 'text-industrial-500'}`} />
                  <span>{item.label}</span>
                  {item.id === 'alerts' && activeAlertCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      {activeAlertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Device Selector, Live Status, Theme, Test */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Device Selector */}
            {devices.length > 0 && (
              <div className="hidden sm:flex items-center">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => onSelectDevice(e.target.value)}
                  className="bg-industrial-900 border border-industrial-800 text-industrial-300 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-honey-500/60 font-mono transition-colors"
                >
                  <option value="">All Colonies (Fleet)</option>
                  {devices.map((d) => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_id} ({d.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Connection Status Pill */}
            <div
              className={`flex items-center space-x-2 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
                backendConnected
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
              }`}
              title={
                backendConnected
                  ? `Backend API Online · Last sync ${lastSyncSecondsAgo ?? 0}s ago`
                  : 'Backend API Unreachable'
              }
            >
              <span className="relative flex h-2 w-2">
                {backendConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    backendConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="font-semibold hidden sm:inline">
                {backendConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Polling Stream Controller */}
            <button
              onClick={onTogglePolling}
              title={isPolling ? 'Stream active (3s polling)' : 'Stream paused'}
              className="p-1.5 rounded-md border border-industrial-800 bg-industrial-900 hover:bg-industrial-850 text-industrial-400 hover:text-industrial-200 transition-colors focus:outline-none"
            >
              {isPolling ? (
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <Play className="w-4 h-4 text-honey-500" />
              )}
            </button>

            {/* Quick Test Ingest Button */}
            <button
              onClick={onTriggerTestIngest}
              disabled={isTestIngesting}
              title="Post sample test reading to FastAPI"
              className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-honey-500/10 hover:bg-honey-500/20 text-honey-400 border border-honey-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className={`w-3 h-3 ${isTestIngesting ? 'animate-spin' : ''}`} />
              <span>Test Ingest</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-1.5 rounded-md border border-industrial-800 bg-industrial-900 hover:bg-industrial-850 text-industrial-400 hover:text-industrial-200 transition-colors focus:outline-none"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-honey-400" />
              ) : (
                <Moon className="w-4 h-4 text-industrial-300" />
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md border border-industrial-800 bg-industrial-900 text-industrial-400 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-industrial-800 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium ${
                    isActive
                      ? 'bg-industrial-850 text-honey-400 border border-honey-500/30'
                      : 'text-industrial-400 hover:bg-industrial-900 hover:text-industrial-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'alerts' && activeAlertCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      {activeAlertCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile Device Selector */}
            {devices.length > 0 && (
              <div className="pt-2">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    onSelectDevice(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-industrial-900 border border-industrial-800 text-industrial-300 text-xs rounded-md px-2.5 py-2 font-mono"
                >
                  <option value="">All Colonies (Fleet)</option>
                  {devices.map((d) => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_id} ({d.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

