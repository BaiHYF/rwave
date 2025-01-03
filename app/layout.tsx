import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TrackProvider } from "@/components/context/trackcontext";
import { PlaylistProvider } from "@/components/context/playlistcontext";
import { PlayStateProvider } from "@/components/context/playstatecontext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PlayStateProvider>
          <PlaylistProvider>
            <TrackProvider>{children}</TrackProvider>
          </PlaylistProvider>
        </PlayStateProvider>
      </body>
    </html>
  );
}
