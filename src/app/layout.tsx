import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RavenGPT - Frontend-Only OpenRouter Client",
  description: "A beautiful frontend-only RavenGPT that uses your OpenRouter API key to chat with free AI models. No backend required!",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('ravengpt-settings-v2');
                  if (saved) {
                    var settings = JSON.parse(saved);
                    if (settings.isDarkMode) {
                      document.documentElement.classList.add('dark');
                    }
                  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-dark-950 text-gray-900 dark:text-dark-100`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
