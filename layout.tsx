import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Financial Calendar",
  description: "Track policies, FDs, RDs, and mutual funds in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-serif">{children}</body>
    </html>
  );
}
