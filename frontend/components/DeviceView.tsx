'use client';

import React from 'react';
import { Device, SensorReading } from '../lib/types';
import { Radio, Thermometer, Droplets, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DeviceViewProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  latestReading: SensorReading | null;
  secondsSinceLastPacket: number | null;
  backendConnected: boolean;
}

export const DeviceView: React.FC<DeviceViewProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  latestReading,
  secondsSinceLastPacket,
  backendConnected,
}) => {
  // If devices array is empty, provide fallback representation for current node
  const activeDevices: Device[] = devices.length > 0 ? devices : [
    {
      device_id: latestReading?.device_id || 'beehive-001',
      name: 'Brood Nest Node 1',
      description: 'ESP32 microcontroller with DHT22 temperature and humidity sensor',
      last_seen: latestReading?.timestamp || null,
      last_temperature_c: latestReading?.temperature_c || null,
      last_humidity_pct: latestReading?.humidity_pct || null,
      status: (secondsSinceLastPacket !== null && secondsSinceLastPacket <= 120 && backendConnected) ? 'online' : 'offline',
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header card */}
      <div className="agri-card p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-primary">
            Connected Telemetry Nodes
          </h3>
          <p className="text-xs text-ink-muted">
            Hardware status and live readings from active sensor transmitters
          </p>
        </div>
        <span className="text-xs text-ink-muted">
          {activeDevices.length} Monitored Node{activeDevices.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeDevices.map((dev) => {
          const isSelected = selectedDeviceId === dev.device_id || (selectedDeviceId === '' && activeDevices.length === 1);
          const isOnline = dev.status === 'online' && backendConnected;

          return (
            <div
              key={dev.device_id}
              onClick={() => onSelectDevice(dev.device_id)}
              className={`agri-card p-5 cursor-pointer transition-all ${
                isSelected ? 'border-primary-400 ring-1 ring-primary-300' : ''
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between pb-3 mb-3 border-b border-border-subtle">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-primary">
                      {dev.device_id}
                    </h4>
                    <p className="text-[11px] text-ink-muted">
                      {dev.name || 'Apiary Chamber Probe'}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    isOnline
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-status-critical/10 border-status-critical/20 text-status-critical'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? 'bg-primary-500' : 'bg-status-critical'
                    }`}
                  />
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </span>
              </div>

              {/* Latest Readings Strip */}
              <div className="grid grid-cols-2 gap-3 my-3">
                <div className="p-2.5 bg-canvas rounded-lg border border-border-light flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-primary-600" />
                  <div>
                    <span className="text-[10px] text-ink-muted block">Temperature</span>
                    <span className="text-xs font-bold text-ink-primary">
                      {dev.last_temperature_c !== null && dev.last_temperature_c !== undefined
                        ? `${dev.last_temperature_c.toFixed(1)} °C`
                        : '--'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-canvas rounded-lg border border-border-light flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-honey-600" />
                  <div>
                    <span className="text-[10px] text-ink-muted block">Humidity</span>
                    <span className="text-xs font-bold text-ink-primary">
                      {dev.last_humidity_pct !== null && dev.last_humidity_pct !== undefined
                        ? `${dev.last_humidity_pct.toFixed(1)} %`
                        : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware specifications */}
              <div className="text-xs space-y-1.5 text-ink-muted py-2">
                <div className="flex justify-between">
                  <span>Hardware Controller:</span>
                  <span className="text-ink-secondary font-medium">ESP32-WROOM-32</span>
                </div>
                <div className="flex justify-between">
                  <span>Sensor Module:</span>
                  <span className="text-ink-secondary font-medium">DHT22 Digital</span>
                </div>
                <div className="flex justify-between">
                  <span>Transmission Protocol:</span>
                  <span className="text-ink-secondary font-medium">HTTP REST POST</span>
                </div>
              </div>

              {/* Footer / Last seen */}
              <div className="pt-3 mt-2 border-t border-border-subtle flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last Seen:</span>
                </span>
                <span className="font-medium text-ink-secondary">
                  {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

