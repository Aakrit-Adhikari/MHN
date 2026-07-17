import type { Metadata } from "next";
import "jodit/es2021/jodit.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mountain Helicopters Nepal Admin",
  description: "Mountain Helicopters Nepal dashboard",
  icons: {
    icon: [{ url: "/mountain-helicopters-nepal-logo.jpeg", type: "image/jpeg" }],
    shortcut: "/mountain-helicopters-nepal-logo.jpeg",
    apple: "/mountain-helicopters-nepal-logo.jpeg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
