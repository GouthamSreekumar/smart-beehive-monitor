'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { SummaryCards } from '../components/SummaryCards';
import { AlertsBanner } from '../components/AlertsBanner';
import { ChartsSection } from '../components/ChartsSection';
import { DeviceSelector } from '../components/DeviceSelector';
import { ThresholdSettingsModal, DEFAULT_THRESHOLDS } from '../components/ThresholdSettingsModal';
import {
  fetchHealth,
  fetchLatestReading,
  fetchReadingsHistory,
  fetchDevices,
  postReading,
} from '../lib/api';
import { SensorReading, Device, AlertThresholds, TimeRange } from '../lib/types';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  // State
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  // Network & Status
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [secondsSinceLastReading, setSecondsSinceLastReading] = useState<number | null>(null);

  // Load custom thresholds from localStorage if saved
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('beehive_thresholds');
        if (saved) {
          setThresholds(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to parse saved thresholds:', e);
      }
    }
  }, []);

  const saveThresholds = (newThresholds: AlertThresholds) => {
    setThresholds(newThresholds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('beehive_thresholds', JSON.stringify(newThresholds));
    }
  };

  const resetThresholds = () => {
    setThresholds(DEFAULT_THRESHOLDS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('beehive_thresholds');
    }
  };

  // Map TimeRange to hours for API query
  const getHoursForTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '15m': return 0.25;
      case '1h': return 1.0;
      case '6h': return 6.0;
      case '24h': return 24.0;
      case 'all': return 720.0;
    }
  };

  // Main fetch telemetry callback
  const refreshTelemetry = useCallback(async () => {
    try {
      // 1. Check Backend Health
      await fetchHealth();
      setBackendConnected(true);

      // 2. Fetch Latest Reading
      const latest = await fetchLatestReading(selectedDeviceId || undefined);
      setLatestReading(latest);

      // 3. Fetch History for Charts
      const hours = getHoursForTimeRange(timeRange);
      const hist = await fetchReadingsHistory(selectedDeviceId || undefined, hours);
      setHistory(hist);

      // 4. Fetch Devices
      const devs = await fetchDevices();
      setDevices(devs);

      setLastSyncTime(new Date());
    } catch (err) {
      console.warn('Backend sync error:', err);
      setBackendConnected(false);
    }
  }, [selectedDeviceId, timeRange]);

  // Polling loop
  useEffect(() => {
    refreshTelemetry();
    if (!isPolling) return;

    const interval = setInterval(() => {
      refreshTelemetry();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [isPolling, refreshTelemetry]);

  // Calculate elapsed seconds since last reading every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (latestReading?.timestamp) {
        const readingDate = new Date(latestReading.timestamp).getTime();
        const now = Date.now();
        setSecondsSinceLastReading(Math.max(0, (now - readingDate) / 1000));
      } else {
        setSecondsSinceLastReading(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [latestReading]);

  // Derived freshness statuses
  const isStale = (secondsSinceLastReading !== null && secondsSinceLastReading > 30 && secondsSinceLastReading <= 120);
  const isOffline = (secondsSinceLastReading !== null && secondsSinceLastReading > 120);

  // Active Device object
  const activeDevice = devices.find((d) => d.device_id === selectedDeviceId) || devices[0] || null;

  // Demo Simulation Ingest
  const handleSimulateData = async () => {
    setIsSimulating(true);
    try {
      // Generate realistic honey bee brood telemetry: 34.5°C +/- small jitter, 58% RH +/- jitter
      const simTemp = parseFloat((34.0 + (Math.random() * 1.6)).toFixed(1));
      const simHum = parseFloat((55.0 + (Math.random() * 8.0)).toFixed(1));
      const devId = selectedDeviceId || 'beehive-001';

      await postReading({
        device_id: devId,
        temperature_c: simTemp,
        humidity_pct: simHum,
      });

      setSimulationNotice(
        `[SIMULATED DATA DEMO] Injected reading: ${simTemp}°C, ${simHum}% for device "${devId}". Real hardware ESP32 readings will automatically supersede this.`
      );
      setTimeout(() => setSimulationNotice(null), 8000);
      await refreshTelemetry();
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <Header
        backendConnected={backendConnected}
        isPolling={isPolling}
        togglePolling={() => setIsPolling(!isPolling)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSimulateData={handleSimulateData}
        isSimulating={isSimulating}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Backend Warning Banner if Unreachable */}
        {!backendConnected && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-center space-x-3 text-rose-900 shadow-sm animate-pulse">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div className="text-sm">
              <span className="font-bold">Backend Connection Error:</span> Unable to communicate with the FastAPI server at{' '}
              <code className="bg-rose-100 px-1.5 py-0.5 rounded text-xs font-mono">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </code>
              . Ensure the Docker container or local Uvicorn process is running.
            </div>
          </div>
        )}

        {/* Demo Simulation Notice Banner */}
        {simulationNotice && (
          <div className="bg-amber-100 border border-amber-300 rounded-xl p-3 flex items-center justify-between text-amber-900 text-xs shadow-sm">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{simulationNotice}</span>
            </div>
            <button
              onClick={() => setSimulationNotice(null)}
              className="font-bold text-amber-700 hover:text-amber-900 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Monitored Hive Device Selector */}
        <DeviceSelector
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
        />

        {/* Summary Metric Cards */}
        <SummaryCards
          latestReading={latestReading}
          activeDevice={activeDevice}
          thresholds={thresholds}
          isStale={isStale}
          isOffline={isOffline}
          secondsSinceLastReading={secondsSinceLastReading}
        />

        {/* Alert Notifications Banner */}
        <AlertsBanner
          latestReading={latestReading}
          thresholds={thresholds}
          isStale={isStale}
          isOffline={isOffline}
          secondsSinceLastReading={secondsSinceLastReading}
        />

        {/* Historical Charts with Apache ECharts */}
        <ChartsSection
          history={history}
          thresholds={thresholds}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isLoading={false}
        />
      </main>

      {/* Threshold Configuration Modal */}
      <ThresholdSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentThresholds={thresholds}
        onSave={saveThresholds}
        onReset={resetThresholds}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Smart Beehive Monitor — ESP32 + DHT22 + FastAPI + PostgreSQL + Next.js</span>
          <span>Target Brood Nest: 32°C–36°C | 50%–70% RH</span>
        </div>
      </footer>
    </div>
  );
}

