'use client';

import React from 'react';
import { Device } from '../lib/types';

interface DeviceSelectorProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
}) => {
  if (devices.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 border-b border-[#ecece8] pb-2 text-xs">
      <span className="text-[#8c887b] mr-2">Hives:</span>
      <button
        onClick={() => onSelectDevice('')}
        className={`px-2.5 py-1 rounded text-xs transition-colors ${
          selectedDeviceId === ''
            ? 'bg-[#1c1d1a] text-white font-medium'
            : 'text-[#68655c] hover:bg-[#f1f1ec]'
        }`}
      >
        All Hives
      </button>

      {devices.map((d) => (
        <button
          key={d.device_id}
          onClick={() => onSelectDevice(d.device_id)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            selectedDeviceId === d.device_id
              ? 'bg-[#1c1d1a] text-white font-medium'
              : 'text-[#68655c] hover:bg-[#f1f1ec]'
          }`}
        >
          <span>{d.device_id}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              d.status === 'online' ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          />
        </button>
      ))}
    </div>
  );
};
