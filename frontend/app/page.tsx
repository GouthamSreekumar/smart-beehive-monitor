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
      await refreshTelemetry();
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-[#1c1d1a]">
      {/* Editorial Navbar */}
      <Header
        backendConnected={backendConnected}
        isPolling={isPolling}
        togglePolling={() => setIsPolling(!isPolling)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSimulateData={handleSimulateData}
        isSimulating={isSimulating}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        
        {/* Device selector if multiple hives */}
        <DeviceSelector
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
        />

        {/* 4 Clean Metric Cards */}
        <SummaryCards
          latestReading={latestReading}
          activeDevice={activeDevice}
          thresholds={thresholds}
          isStale={isStale}
          isOffline={isOffline}
          secondsSinceLastReading={secondsSinceLastReading}
        />

        {/* Alerts / Condition Status */}
        <AlertsBanner
          latestReading={latestReading}
          thresholds={thresholds}
          isStale={isStale}
          isOffline={isOffline}
          secondsSinceLastReading={secondsSinceLastReading}
        />

        {/* ECharts Visualizers */}
        <ChartsSection
          history={history}
          thresholds={thresholds}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isLoading={false}
        />

      </main>

      {/* Modal */}
      <ThresholdSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentThresholds={thresholds}
        onSave={saveThresholds}
        onReset={resetThresholds}
      />

      {/* Subtle, understated footer */}
      <footer className="border-t border-[#ecece8] py-4 bg-[#fbfbfa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#9c9990] gap-2">
          <span>ESP32 + DHT22 Brood Telemetry System</span>
          <span>Target Brood Nest: 32.0–36.0°C | 50–70% RH</span>
        </div>
      </footer>
    </div>
  );
}
