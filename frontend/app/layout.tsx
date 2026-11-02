import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Beehive Monitor | Agricultural Telemetry',
  description: 'Clean, real-time microclimate monitoring platform for apiary brood nest temperature and relative humidity with ESP32 and DHT22.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-ink-primary antialiased selection:bg-primary-100 selection:text-primary-800">
        {children}
      </body>
    </html>
  );
}
