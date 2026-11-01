export interface SensorReading {
  id: number;
  device_id: string;
  temperature_c: number;
  humidity_pct: number;
  timestamp: string;
}

export interface Device {
  device_id: string;
  name?: string | null;
  description?: string | null;
  last_seen?: string | null;
  last_temperature_c?: number | null;
  last_humidity_pct?: number | null;
  status: 'online' | 'stale' | 'offline';
}

export interface AlertThresholds {
  minTemp: number;       // Default: 32.0 °C
  maxTemp: number;       // Default: 36.0 °C
  minHumidity: number;   // Default: 50.0 %
  maxHumidity: number;   // Default: 70.0 %
}

export interface Alert {
  id: string;
  severity: 'normal' | 'warning' | 'critical';
  title: string;
  message: string;
  time: string;
  metric: 'temperature' | 'humidity' | 'connection';
}

export interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
  version: string;
}

export type TimeRange = '15m' | '1h' | '6h' | '24h' | 'all';
