import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MHN Admin",
  description: "Mountain Helicopters Nepal custom admin panel"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
