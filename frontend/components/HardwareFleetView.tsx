'use client';

import React from 'react';
import { Device, SensorReading } from '../lib/types';
import { Radio, Thermometer, Droplets, Clock, Cpu, Wifi } from 'lucide-react';

interface HardwareFleetViewProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  latestReading: SensorReading | null;
  secondsSinceLastPacket: number | null;
  backendConnected: boolean;
  nodeConnected: boolean;
}

export const HardwareFleetView: React.FC<HardwareFleetViewProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  latestReading,
  secondsSinceLastPacket,
  backendConnected,
  nodeConnected,
}) => {
  const displayDevices = devices.length > 0 ? devices : [
    {
      device_id: latestReading?.device_id || 'beehive-001',
      name: 'Brood Chamber Telemetry Node',
      description: 'ESP32 controller with digital DHT22 environmental sensor',
      last_seen: latestReading?.timestamp || null,
      last_temperature_c: latestReading?.temperature_c || null,
      last_humidity_pct: latestReading?.humidity_pct || null,
      status: nodeConnected ? 'online' : 'offline',
    }
  ];

  return (
    <div className="space-y-6 animate-stage-enter">
      
      {/* Header */}
      <div className="studio-stage p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#18261C]">
            Connected Telemetry Node Fleet
          </h2>
          <p className="text-xs text-[#6E7F72]">
            Hardware diagnostics, transmitter state, and sensor probe health
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EDF5EF] text-[#2D5A3C] border border-[#C6DACB]">
          {displayDevices.length} Node Registered
        </span>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayDevices.map((dev) => {
          const isSelected = selectedDeviceId === dev.device_id || (selectedDeviceId === '' && displayDevices.length === 1);
          const isLive = nodeConnected && backendConnected;

          return (
            <div
              key={dev.device_id}
              onClick={() => onSelectDevice(dev.device_id)}
              className={`studio-stage p-6 cursor-pointer transition-all ${
                isSelected ? 'border-[#2D5A3C] ring-1 ring-[#2D5A3C]/30' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#DFE5DC]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDF5EF] border border-[#C6DACB] flex items-center justify-center text-[#2D5A3C]">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#18261C]">
                      {dev.device_id}
                    </h3>
                    <p className="text-xs text-[#6E7F72]">
                      {dev.name || 'Brood Microclimate Transmitter'}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-600 animate-beacon' : 'bg-amber-600'}`} />
                  <span>{isLive ? 'Transmitting' : 'Idle / Offline'}</span>
                </span>
              </div>

              {/* Hardware Spec */}
              <div className="space-y-2 py-4 text-xs border-b border-[#DFE5DC]">
                <div className="flex justify-between text-[#6E7F72]">
                  <span>SoC / Radio:</span>
                  <span className="font-semibold text-[#18261C]">ESP32-WROOM-32 (2.4 GHz)</span>
                </div>
                <div className="flex justify-between text-[#6E7F72]">
                  <span>Sensor Module:</span>
                  <span className="font-semibold text-[#18261C]">DHT22 (GPIO 4)</span>
                </div>
                <div className="flex justify-between text-[#6E7F72]">
                  <span>Transmission:</span>
                  <span className="font-semibold text-[#18261C]">HTTP POST REST JSON</span>
                </div>
              </div>

              {/* Readouts */}
              <div className="grid grid-cols-2 gap-3 py-3">
                <div className="p-2.5 bg-[#F6F8F5] rounded-lg border border-[#DFE5DC]">
                  <span className="text-[10px] text-[#6E7F72] block">Temperature</span>
                  <span className="text-sm font-bold text-[#18261C]">
                    {dev.last_temperature_c !== null && dev.last_temperature_c !== undefined
                      ? `${dev.last_temperature_c.toFixed(1)} °C`
                      : '--'}
                  </span>
                </div>
                <div className="p-2.5 bg-[#F6F8F5] rounded-lg border border-[#DFE5DC]">
                  <span className="text-[10px] text-[#6E7F72] block">Humidity</span>
                  <span className="text-sm font-bold text-[#18261C]">
                    {dev.last_humidity_pct !== null && dev.last_humidity_pct !== undefined
                      ? `${dev.last_humidity_pct.toFixed(1)} %`
                      : '--'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#DFE5DC] flex items-center justify-between text-xs text-[#6E7F72]">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last Packet:</span>
                </span>
                <span className="font-medium text-[#18261C]">
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

