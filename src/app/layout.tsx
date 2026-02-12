import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Inter } from 'next/font/google';
import { Libre_Baskerville, Cinzel_Decorative } from 'next/font/google';

const cinzelDecorative = Cinzel_Decorative({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-cinzel-decorative',
});

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-libre-baskerville',
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quest Weaver',
  description: 'An AI-powered text adventure game',
  icons: {
    icon: '/witch-favicon.svg',
    shortcut: '/witch-favicon.svg',
    apple: '/witch-favicon.svg',
    other: {
      rel: 'mask-icon',
      url: '/witch-favicon.svg',
      color: '#9333ea'
    }
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: linear-gradient(to bottom, #111, #222);
          }
          /* Hide Next.js logo */
          .fixed[data-testid="template-banner"],
          .fixed[data-testid="template-logo"],
          .fixed[data-testid="template-container"],
          .fixed[data-testid="nextjs-banner"],
          .fixed[data-testid="nextjs-logo"],
          .fixed[data-testid="nextjs-container"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
      </head>
      <body className={`${cinzelDecorative.variable} ${libreBaskerville.variable} ${geistSans.variable} ${geistMono.variable} antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
