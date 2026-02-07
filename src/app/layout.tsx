import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toaster";
import { ThemeProvider } from "@/components/theme";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://clawbrain.app"),
  title: {
    default: "ClawBrain | AI Task Workspace",
    template: "%s | ClawBrain",
  },
  description: "A unified chat and task management interface for OpenClaw. Organize tasks, chat with AI, and stay productive.",
  keywords: ["AI", "task management", "OpenClaw", "productivity", "kanban", "chat"],
  authors: [{ name: "ClawBrain" }],
  creator: "ClawBrain",
  publisher: "ClawBrain",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clawbrain.app",
    siteName: "ClawBrain",
    title: "ClawBrain | AI Task Workspace",
    description: "A unified chat and task management interface for OpenClaw.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClawBrain - AI Task Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClawBrain | AI Task Workspace",
    description: "A unified chat and task management interface for OpenClaw.",
    images: ["/og-image.png"],
    creator: "@clawbrain",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
      >
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
