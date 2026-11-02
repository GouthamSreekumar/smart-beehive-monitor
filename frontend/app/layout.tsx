import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Beehive Monitor',
  description: 'Agricultural IoT telemetry platform for real-time apiary microclimate monitoring, brood nest thermoregulation, and telemetry analytics with ESP32 and DHT22.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F8F5] text-[#18261C] antialiased selection:bg-[#EDF5EF] selection:text-[#2D5A3C]">
        {children}
      </body>
    </html>
  );
}
