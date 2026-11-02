'use client';

import React from 'react';
import {
  LayoutDashboard,
  Activity,
  LineChart,
  Bell,
  Cpu,
  Settings,
  Radio,
  X,
  ChevronRight,
} from 'lucide-react';
import { NavTab, Device } from '../lib/types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  devices: Device[];
  selectedDeviceId: string;
  backendConnected: boolean;
  activeAlertCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  devices,
  selectedDeviceId,
  backendConnected,
  activeAlertCount,
  isOpen,
  onClose,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Activity },
    { id: 'analytics', label: 'Historical Analytics', icon: LineChart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'devices', label: 'Device Management', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeDevice = devices.find((d) => d.device_id === selectedDeviceId) || devices[0];
  const isOnline = backendConnected && (activeDevice ? activeDevice.status === 'online' : true);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-primary/20 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-border-light flex flex-col justify-between transition-transform duration-250 ease-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Navigation */}
        <div className="p-5">
          {/* Brand Logo & Title with subtle bee wing animation */}
          <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
            <button
              onClick={() => onSelectTab('overview')}
              className="flex items-center space-x-3 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 transition-transform group-hover:scale-105">
                {/* Botanical Bee Emblem with subtle flutter */}
                <div className="animate-wing-flutter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9A9 9 0 0 1 3 11a9 9 0 0 1 9-9Z" />
                    <path d="M12 7v10" />
                    <path d="M8 10c1.5 1.5 4 1.5 5.5 0" />
                    <path d="M10.5 14c1.5 1.5 4 1.5 5.5 0" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-tight text-ink-primary leading-tight group-hover:text-primary-700 transition-colors">
                  Smart Beehive
                </h1>
                <p className="text-[11px] text-ink-muted">Apiary Monitoring</p>
              </div>
            </button>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-canvas transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-primary-50 text-primary-800 font-semibold shadow-xs'
                      : 'text-ink-secondary hover:text-ink-primary hover:bg-canvas'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-primary-600' : 'text-ink-muted'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.id === 'alerts' && activeAlertCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-critical/10 text-status-critical">
                      {activeAlertCount}
                    </span>
                  ) : isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Apiary Node Status Card */}
        <div className="p-4 border-t border-border-light bg-canvas/60">
          <div
            onClick={() => onSelectTab('devices')}
            className="p-3 bg-surface rounded-lg border border-border-light hover:border-primary-200 cursor-pointer transition-all hover:shadow-xs group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-ink-primary flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-primary-600 group-hover:scale-110 transition-transform" />
                <span>{selectedDeviceId || 'beehive-001'}</span>
              </span>
              <span
                className={`flex items-center space-x-1 text-[11px] font-medium ${
                  isOnline ? 'text-primary-600' : 'text-status-critical'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-primary-500 animate-signal-pulse' : 'bg-status-critical'
                  }`}
                />
                <span>{isOnline ? 'Connected' : 'Offline'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>ESP32 + DHT22 Probe</span>
              <ChevronRight className="w-3 h-3 text-ink-faint group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
