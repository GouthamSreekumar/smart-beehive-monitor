'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import { OverviewView } from '../components/OverviewView';
import { LiveMonitoringView } from '../components/LiveMonitoringView';
import { AnalyticsView } from '../components/AnalyticsView';
import { AlertsView } from '../components/AlertsView';
import { DeviceView } from '../components/DeviceView';
import { SettingsView, DEFAULT_THRESHOLDS } from '../components/SettingsView';
import {
  fetchHealth,
  fetchLatestReading,
  fetchReadingsHistory,
  fetchDevices,
  fetchThresholdSettings,
  postReading,
} from '../lib/api';
import {
  SensorReading,
  Device,
  AlertThresholds,
  TimeRange,
  NavTab,
} from '../lib/types';
import { CheckCircle2, X } from 'lucide-react';

export default function DashboardPage() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Telemetry & Device State
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [previousReading, setPreviousReading] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  // Connection & Ingestion State
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [isTestIngesting, setIsTestIngesting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [secondsSinceLastPacket, setSecondsSinceLastPacket] = useState<number | null>(null);

  const latestReadingRef = useRef<SensorReading | null>(null);

  // 1. Fetch Thresholds from FastAPI Backend (with fallback)
  useEffect(() => {
    async function loadThresholds() {
      try {
        const backendThresholds = await fetchThresholdSettings();
        setThresholds(backendThresholds);
      } catch (err) {
        console.warn('Backend settings endpoint unreachable, falling back to local storage:', err);
        try {
          const saved = localStorage.getItem('beehive_thresholds');
          if (saved) setThresholds(JSON.parse(saved));
        } catch {
          // Defaults remain
        }
      }
    }
    loadThresholds();
  }, []);

  const handleThresholdsUpdated = (newThresholds: AlertThresholds) => {
    setThresholds(newThresholds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('beehive_thresholds', JSON.stringify(newThresholds));
    }
  };

  // Convert TimeRange to Hours query parameter
  const getHoursForTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '15m': return 0.25;
      case '1h': return 1.0;
      case '6h': return 6.0;
      case '24h': return 24.0;
      case 'all': return 720.0;
    }
  };

  // 2. Central Telemetry Refresh Function
  const refreshTelemetry = useCallback(async () => {
    try {
      await fetchHealth();
      setBackendConnected(true);

      const latest = await fetchLatestReading(selectedDeviceId || undefined);
      if (latest) {
        if (latestReadingRef.current && latestReadingRef.current.id !== latest.id) {
          setPreviousReading(latestReadingRef.current);
        }
        latestReadingRef.current = latest;
        setLatestReading(latest);
      } else {
        setLatestReading(null);
      }

      const hours = getHoursForTimeRange(timeRange);
      const hist = await fetchReadingsHistory(selectedDeviceId || undefined, hours);
      setHistory(hist);

      const devs = await fetchDevices();
      setDevices(devs);

      setLastSyncDate(new Date());
    } catch (err) {
      console.warn('Telemetry sync error:', err);
      setBackendConnected(false);
    }
  }, [selectedDeviceId, timeRange]);

  // 3. Polling Lifecycle with automatic cleanup on unmount
  useEffect(() => {
    refreshTelemetry();
    if (!isPolling) return;
    const interval = setInterval(refreshTelemetry, 3000);
    return () => clearInterval(interval);
  }, [isPolling, refreshTelemetry]);

  // 4. Packet freshness timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (latestReading?.timestamp) {
        const lastPacketMs = new Date(latestReading.timestamp).getTime();
        const diffSeconds = Math.max(0, (Date.now() - lastPacketMs) / 1000);
        setSecondsSinceLastPacket(diffSeconds);
      } else {
        setSecondsSinceLastPacket(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [latestReading]);

  // 5. Test Ingestion Trigger (Hardware Pipeline Verification)
  const handleTriggerTestIngest = async () => {
    setIsTestIngesting(true);
    try {
      const simulatedTemp = +(34.4 + (Math.random() * 0.6 - 0.3)).toFixed(1);
      const simulatedHum = +(62.0 + (Math.random() * 2.0 - 1.0)).toFixed(1);
      const deviceId = selectedDeviceId || 'beehive-001';

      await postReading({
        device_id: deviceId,
        temperature_c: simulatedTemp,
        humidity_pct: simulatedHum,
      });

      setToastMessage(`Sample reading posted: ${simulatedTemp}°C, ${simulatedHum}% RH for ${deviceId}`);
      await refreshTelemetry();
    } catch (err: any) {
      setToastMessage(`Ingestion failed: ${err.message}`);
    } finally {
      setIsTestIngesting(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Active Alerts count calculation
  const activeAlertCount = React.useMemo(() => {
    let count = 0;
    if (!backendConnected) count++;
    if (secondsSinceLastPacket !== null && secondsSinceLastPacket > 120) count++;
    if (latestReading) {
      if (latestReading.temperature_c < thresholds.minTemp || latestReading.temperature_c > thresholds.maxTemp) count++;
      if (latestReading.humidity_pct < thresholds.minHumidity || latestReading.humidity_pct > thresholds.maxHumidity) count++;
    }
    return count;
  }, [backendConnected, secondsSinceLastPacket, latestReading, thresholds]);

  const activeDevice = devices.find((d) => d.device_id === selectedDeviceId) || null;

  return (
    <div className="min-h-screen bg-canvas text-ink-primary flex">
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        backendConnected={backendConnected}
        activeAlertCount={activeAlertCount}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        
        {/* 2. Clean Top Header */}
        <TopHeader
          currentTab={currentTab}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          backendConnected={backendConnected}
          lastSyncSecondsAgo={
            lastSyncDate ? Math.floor((Date.now() - lastSyncDate.getTime()) / 1000) : null
          }
          onRefresh={refreshTelemetry}
          onTriggerTestIngest={handleTriggerTestIngest}
          isTestIngesting={isTestIngesting}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* 3. Main Workspace Container */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Subtle Toast Feedback */}
          {toastMessage && (
            <div className="p-3.5 rounded-lg bg-surface border border-primary-200 text-primary-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-ink-muted hover:text-ink-primary p-0.5 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Tab 1: Overview */}
          {currentTab === 'overview' && (
            <OverviewView
              latestReading={latestReading}
              previousReading={previousReading}
              history={history}
              thresholds={thresholds}
              activeDevice={activeDevice}
              backendConnected={backendConnected}
              secondsSinceLastPacket={secondsSinceLastPacket}
              activeAlertCount={activeAlertCount}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {/* Tab 2: Live Monitoring */}
          {currentTab === 'live' && (
            <LiveMonitoringView
              latestReading={latestReading}
              history={history}
              thresholds={thresholds}
              backendConnected={backendConnected}
              secondsSinceLastReading={secondsSinceLastPacket}
              isPolling={isPolling}
              onRefresh={refreshTelemetry}
            />
          )}

          {/* Tab 3: Historical Analytics */}
          {currentTab === 'analytics' && (
            <AnalyticsView
              history={history}
              thresholds={thresholds}
              timeRange={timeRange}
              onSelectTimeRange={setTimeRange}
            />
          )}

          {/* Tab 4: Alerts */}
          {currentTab === 'alerts' && (
            <AlertsView
              latestReading={latestReading}
              thresholds={thresholds}
              backendConnected={backendConnected}
              secondsSinceLastReading={secondsSinceLastPacket}
            />
          )}

          {/* Tab 5: Device Management */}
          {currentTab === 'devices' && (
            <DeviceView
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
              latestReading={latestReading}
              secondsSinceLastPacket={secondsSinceLastPacket}
              backendConnected={backendConnected}
            />
          )}

          {/* Tab 6: Settings */}
          {currentTab === 'settings' && (
            <SettingsView
              currentThresholds={thresholds}
              onThresholdsUpdated={handleThresholdsUpdated}
            />
          )}

        </main>

        {/* Clean Footer */}
        <footer className="border-t border-border-light bg-surface py-4 px-5 sm:px-8 text-xs text-ink-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Beehive Monitor · Agricultural IoT Telemetry</span>
          <span>ESP32 + DHT22 · FastAPI · PostgreSQL · Next.js 14</span>
        </footer>

      </div>

    </div>
  );
}
