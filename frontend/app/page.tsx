'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Sparkles, Shield, Cpu, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [secondsSinceLastReading, setSecondsSinceLastReading] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('beehive_thresholds');
        if (saved) setThresholds(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse thresholds:', e);
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

  const getHoursForTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '15m': return 0.25;
      case '1h': return 1.0;
      case '6h': return 6.0;
      case '24h': return 24.0;
      case 'all': return 720.0;
    }
  };

  const refreshTelemetry = useCallback(async () => {
    try {
      await fetchHealth();
      setBackendConnected(true);

      const latest = await fetchLatestReading(selectedDeviceId || undefined);
      setLatestReading(latest);

      const hours = getHoursForTimeRange(timeRange);
      const hist = await fetchReadingsHistory(selectedDeviceId || undefined, hours);
      setHistory(hist);

      const devs = await fetchDevices();
      setDevices(devs);

      setLastSyncTime(new Date());
    } catch (err) {
      console.warn('Backend sync:', err);
      setBackendConnected(false);
    }
  }, [selectedDeviceId, timeRange]);

  useEffect(() => {
    refreshTelemetry();
    if (!isPolling) return;
    const interval = setInterval(refreshTelemetry, 3000);
    return () => clearInterval(interval);
  }, [isPolling, refreshTelemetry]);

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

  const isStale = (secondsSinceLastReading !== null && secondsSinceLastReading > 30 && secondsSinceLastReading <= 120);
  const isOffline = (secondsSinceLastReading !== null && secondsSinceLastReading > 120);
  const activeDevice = devices.find((d) => d.device_id === selectedDeviceId) || devices[0] || null;

  const handleSimulateData = async () => {
    setIsSimulating(true);
    try {
      const simTemp = parseFloat((34.2 + (Math.random() * 1.2)).toFixed(1));
      const simHum = parseFloat((56.0 + (Math.random() * 6.0)).toFixed(1));
      const devId = selectedDeviceId || 'beehive-001';

      await postReading({
        device_id: devId,
        temperature_c: simTemp,
        humidity_pct: simHum,
      });

      setSimulationNotice(`Simulated packet dispatched: ${simTemp}°C | ${simHum}% RH`);
      setTimeout(() => setSimulationNotice(null), 5000);
      await refreshTelemetry();
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col honeycomb-bg text-[#1c1917] selection:bg-amber-100 selection:text-amber-900">
      
      {/* Sticky Top Navbar */}
      <Header
        backendConnected={backendConnected}
        isPolling={isPolling}
        togglePolling={() => setIsPolling(!isPolling)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSimulateData={handleSimulateData}
        isSimulating={isSimulating}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Interactive Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        
        {/* Simulation Feedback Alert */}
        {simulationNotice && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 shadow-sm">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span className="font-semibold">{simulationNotice}</span>
            </div>
            <button onClick={() => setSimulationNotice(null)} className="font-bold text-amber-700 hover:text-amber-900">
              Dismiss
            </button>
          </div>
        )}

        {/* Multi-hive Selector */}
        <DeviceSelector
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
        />

        {/* 4 Rich Metric Glass Cards */}
        <SummaryCards
          latestReading={latestReading}
          activeDevice={activeDevice}
          thresholds={thresholds}
          isStale={isStale}
          isOffline={isOffline}
          secondsSinceLastReading={secondsSinceLastReading}
        />

        {/* Anomaly Alerts Banner */}
        <AlertsBanner
          latestReading={latestReading}
          thresholds={thresholds}
          isStale={isStale}
          isOffline={isOffline}
          secondsSinceLastReading={secondsSinceLastReading}
        />

        {/* Interactive ECharts Visualizer */}
        <ChartsSection
          history={history}
          thresholds={thresholds}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isLoading={false}
        />

      </main>

      {/* Threshold Modal */}
      <ThresholdSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentThresholds={thresholds}
        onSave={saveThresholds}
        onReset={resetThresholds}
      />

      {/* Polish Footer */}
      <footer className="border-t border-[#eadeca]/80 py-5 bg-white/70 backdrop-blur-xs mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-stone-700">Smart Beehive Monitor</span>
            <span>•</span>
            <span>ESP32 (GPIO 4) + DHT22 Microclimate Sensing</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Target: 32.0–36.0°C | 50–70% RH
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
