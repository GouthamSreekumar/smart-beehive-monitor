import { SensorReading, Device, HealthResponse, AlertThresholds } from './types';

/**
 * Normalized API Base URL from process.env.NEXT_PUBLIC_API_URL.
 * Supports:
 * - Full URLs: 'https://beehive-backend-zau6.onrender.com'
 * - Hostnames from Render: 'beehive-backend-zau6' or 'beehive-backend-zau6.onrender.com'
 * - Custom domain: 'https://beehive.gouthamsreekumar.dev' or '/api'
 * - Local development: 'http://localhost:8000'
 */
function getApiBaseUrl(): string {
  let envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  envUrl = envUrl.trim().replace(/\/+$/, '');

  // If running in browser and using same-origin /api path
  if (envUrl === '/api' || envUrl === '') {
    return '';
  }

  // If Render passed raw hostname or slug without protocol, ensure protocol
  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    if (envUrl.includes('.onrender.com')) {
      envUrl = `https://${envUrl}`;
    } else if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      envUrl = `http://${envUrl}`;
    } else if (envUrl.includes('.')) {
      envUrl = `https://${envUrl}`;
    } else {
      // It's a Render internal service name (e.g. 'beehive-backend-zau6')
      envUrl = `https://${envUrl}.onrender.com`;
    }
  }

  // If the user provided URL ends with '/api', strip it so endpoint appending is uniform
  return envUrl.endsWith('/api') ? envUrl.slice(0, -4) : envUrl;
}

const BASE_URL = getApiBaseUrl();

/**
 * Check backend API and PostgreSQL database health.
 * Backend provides both GET /health and GET /api/health.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/api/health`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch the latest reading, optionally filtered by deviceId.
 * Calls GET /api/readings/latest
 */
export async function fetchLatestReading(deviceId?: string): Promise<SensorReading | null> {
  const url = deviceId 
    ? `${BASE_URL}/api/readings/latest?device_id=${encodeURIComponent(deviceId)}`
    : `${BASE_URL}/api/readings/latest`;

  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch latest reading (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch readings history for time-series charts.
 * Calls GET /api/readings/history
 */
export async function fetchReadingsHistory(deviceId?: string, hours: number = 1): Promise<SensorReading[]> {
  let url = `${BASE_URL}/api/readings/history?hours=${hours}&limit=2000`;
  if (deviceId) {
    url += `&device_id=${encodeURIComponent(deviceId)}`;
  }

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch history (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch all registered or observed devices and their status.
 * Calls GET /api/devices
 */
export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(`${BASE_URL}/api/devices`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch devices (${res.status})`);
  }
  return res.json();
}

/**
 * Post a new sensor reading (ESP32 ingestion or manual test).
 * Calls POST /api/readings
 */
export async function postReading(data: {
  device_id: string;
  temperature_c: number;
  humidity_pct: number;
}): Promise<SensorReading> {
  const res = await fetch(`${BASE_URL}/api/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Ingestion failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch persisted alert thresholds from the backend.
 * Calls GET /api/settings/thresholds
 */
export async function fetchThresholdSettings(): Promise<AlertThresholds> {
  const res = await fetch(`${BASE_URL}/api/settings/thresholds`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch threshold settings (${res.status})`);
  }
  return res.json();
}

/**
 * Update and persist alert thresholds to the backend.
 * Calls PUT /api/settings/thresholds
 */
export async function updateThresholdSettings(thresholds: AlertThresholds): Promise<AlertThresholds> {
  const res = await fetch(`${BASE_URL}/api/settings/thresholds`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(thresholds),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update threshold settings (${res.status})`);
  }
  return res.json();
}
