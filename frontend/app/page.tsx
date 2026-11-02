'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { MetricOverviewCards } from '../components/MetricOverviewCards';
import { LiveTelemetrySection } from '../components/LiveTelemetrySection';
import { HistoricalAnalyticsSection } from '../components/HistoricalAnalyticsSection';
import { AlertsManagementSection } from '../components/AlertsManagementSection';
import { DeviceManagementSection } from '../components/DeviceManagementSection';
import { SettingsSection, DEFAULT_THRESHOLDS } from '../components/SettingsSection';
import {
  fetchHealth,
  fetchLatestReading,
  fetchReadingsHistory,
  fetchDevices,
  fetchThresholdSettings,
  updateThresholdSettings,
  postReading,
} from '../lib/api';
import {
  SensorReading,
  Device,
  AlertThresholds,
  TimeRange,
  NavTab,
  ThemeMode,
} from '../lib/types';
import {
  Activity,
  Layers,
  Thermometer,
  Droplets,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  // Navigation & Theme State
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Telemetry State
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [previousReading, setPreviousReading] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  // Connection & Polling State
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [isTestIngesting, setIsTestIngesting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [secondsSinceLastPacket, setSecondsSinceLastPacket] = useState<number | null>(null);

  // Keep ref of latest reading to detect changes and calculate deltas
  const latestReadingRef = useRef<SensorReading | null>(null);

  // 1. Theme Initialization & Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('beehive_theme') as ThemeMode;
      const initialTheme = savedTheme || 'dark';
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('beehive_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // 2. Load Persisted Thresholds from FastAPI Backend (with fallback)
  useEffect(() => {
    async function loadThresholds() {
      try {
        const backendThresholds = await fetchThresholdSettings();
        setThresholds(backendThresholds);
      } catch (err) {
        console.warn('Backend settings endpoint unreachable, checking local storage:', err);
        try {
          const saved = localStorage.getItem('beehive_thresholds');
          if (saved) setThresholds(JSON.parse(saved));
        } catch {
          // Keep defaults
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

  // 3. Central Telemetry Refresh Function
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

  // 4. Polling Lifecycle with clean unmount
  useEffect(() => {
    refreshTelemetry();
    if (!isPolling) return;
    const interval = setInterval(refreshTelemetry, 3000);
    return () => clearInterval(interval);
  }, [isPolling, refreshTelemetry]);

  // 5. High-precision packet freshness timer
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

  // 6. Test Ingestion Trigger (Hardware Pipeline Verification)
  const handleTriggerTestIngest = async () => {
    setIsTestIngesting(true);
    try {
      // Realistic simulated reading within optimal brood range with slight variation
      const simulatedTemp = +(34.2 + (Math.random() * 0.8 - 0.4)).toFixed(1);
      const simulatedHum = +(62.5 + (Math.random() * 2.0 - 1.0)).toFixed(1);
      const deviceId = selectedDeviceId || 'beehive-001';

      await postReading({
        device_id: deviceId,
        temperature_c: simulatedTemp,
        humidity_pct: simulatedHum,
      });

      setToastMessage(`Test packet ingested: ${simulatedTemp}°C, ${simulatedHum}% RH for ${deviceId}`);
      await refreshTelemetry();
    } catch (err: any) {
      setToastMessage(`Test ingest failed: ${err.message}`);
    } finally {
      setIsTestIngesting(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Active Alert Counter
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
    <div className="min-h-screen flex flex-col bg-industrial-950 text-industrial-300 dark:bg-industrial-950 dark:text-industrial-300 industrial-grid">
      
      {/* 1. Industrial Header & Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={setSelectedDeviceId}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        backendConnected={backendConnected}
        isPolling={isPolling}
        onTogglePolling={() => setIsPolling(!isPolling)}
        onTriggerTestIngest={handleTriggerTestIngest}
        isTestIngesting={isTestIngesting}
        activeAlertCount={activeAlertCount}
        lastSyncSecondsAgo={
          lastSyncDate ? Math.floor((Date.now() - lastSyncDate.getTime()) / 1000) : null
        }
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        
        {/* Toast Feedback Notification */}
        {toastMessage && (
          <div className="p-3 rounded-lg bg-honey-500/10 border border-honey-500/40 text-honey-300 text-xs font-mono flex items-center justify-between shadow-glow-amber animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-honey-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-honey-400 hover:text-white font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Tab View 1: Overview / Key Metrics Dashboard */}
        {currentTab === 'overview' && (
          <div className="space-y-5">
            {/* 6 Key Metric Industrial Cards */}
            <MetricOverviewCards
              latestReading={latestReading}
              previousReading={previousReading}
              history={history}
              activeDevice={activeDevice}
              thresholds={thresholds}
              backendConnected={backendConnected}
              secondsSinceLastPacket={secondsSinceLastPacket}
              activeAlertCount={activeAlertCount}
            />

            {/* Live Stream Section */}
            <LiveTelemetrySection
              latestReading={latestReading}
              history={history}
              thresholds={thresholds}
              backendConnected={backendConnected}
              secondsSinceLastReading={secondsSinceLastPacket}
              isPolling={isPolling}
              theme={theme}
              onRefresh={refreshTelemetry}
            />

            {/* Quick Historical Snapshot Section */}
            <HistoricalAnalyticsSection
              history={history}
              thresholds={thresholds}
              timeRange={timeRange}
              onSelectTimeRange={setTimeRange}
              theme={theme}
            />
          </div>
        )}

        {/* Tab View 2: Dedicated Live Telemetry Stream */}
        {currentTab === 'live' && (
          <LiveTelemetrySection
            latestReading={latestReading}
            history={history}
            thresholds={thresholds}
            backendConnected={backendConnected}
            secondsSinceLastReading={secondsSinceLastPacket}
            isPolling={isPolling}
            theme={theme}
            onRefresh={refreshTelemetry}
          />
        )}

        {/* Tab View 3: Dedicated Historical Analytics */}
        {currentTab === 'analytics' && (
          <HistoricalAnalyticsSection
            history={history}
            thresholds={thresholds}
            timeRange={timeRange}
            onSelectTimeRange={setTimeRange}
            theme={theme}
          />
        )}

        {/* Tab View 4: Alerts and Anomaly Monitoring */}
        {currentTab === 'alerts' && (
          <AlertsManagementSection
            latestReading={latestReading}
            thresholds={thresholds}
            backendConnected={backendConnected}
            secondsSinceLastReading={secondsSinceLastPacket}
          />
        )}

        {/* Tab View 5: Device Management */}
        {currentTab === 'devices' && (
          <DeviceManagementSection
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={setSelectedDeviceId}
            latestReading={latestReading}
            secondsSinceLastPacket={secondsSinceLastPacket}
            backendConnected={backendConnected}
          />
        )}

        {/* Tab View 6: Threshold Configuration Settings */}
        {currentTab === 'settings' && (
          <SettingsSection
            currentThresholds={thresholds}
            onThresholdsUpdated={handleThresholdsUpdated}
          />
        )}

      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-industrial-800 bg-industrial-950 py-4 text-center text-xs text-industrial-500 font-mono transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-honey-500/80" />
            <span>Smart Beehive Monitor v2.4</span>
            <span>·</span>
            <span>ESP32 + DHT22 Microclimate Sensing</span>
          </div>

          <div className="flex items-center space-x-3 text-industrial-400">
            <span>FastAPI Backend</span>
            <span>·</span>
            <span>PostgreSQL Database</span>
            <span>·</span>
            <span>Next.js 14 Dashboard</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
