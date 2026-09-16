import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:
    'KBX Spatial Atelier | Interior Design, Interior Architecture & Spatial Design in Accra',

  description:
    'KBX Spatial Atelier is an Accra, Ghana-based interior design and spatial design studio specializing in interior architecture, bespoke joinery, kitchen design, wardrobes, TV units, space planning, and 3D visualization.',

  keywords: [
    'KBX Spatial Atelier',
    'interior design Accra',
    'interior designer Accra',
    'interior design Ghana',
    'interior designers Ghana',
    'interior architecture Accra',
    'interior architecture Ghana',
    'spatial design Accra',
    'spatial design Ghana',
    'bespoke joinery Ghana',
    'custom furniture Ghana',
    'kitchen design Accra',
    'kitchen designers Ghana',
    'wardrobe design Accra',
    'custom wardrobes Ghana',
    'TV unit design Accra',
    'TV unit Ghana',
    'space planning Accra',
    '3D interior visualization Ghana',
    '3D interior design Accra',
  ],

  verification: {
    google:
      'WebjbNL29lWKlUx9KMcOYgiCoYLOrJnbir2z-LSzTCE',
  },

  openGraph: {
    title:
      'KBX Spatial Atelier | Interior Design & Spatial Design in Accra',
    description:
      'Interior design, interior architecture, spatial design, bespoke joinery, kitchen and wardrobe design, and 3D visualization in Accra, Ghana.',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title:
      'KBX Spatial Atelier | Interior Design & Spatial Design in Accra',
    description:
      'Interior design, spatial design, bespoke joinery, and 3D visualization in Accra, Ghana.',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}