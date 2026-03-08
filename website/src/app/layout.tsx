import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dvirious — Your AI Assistant",
  description:
    "The all-in-one AI assistant with voice chat, CAD generation, web automation, smart home control, and more. Download for free.",
  keywords: ["AI assistant", "voice AI", "CAD generation", "smart home", "desktop app"],
  openGraph: {
    title: "Dvirious — Your AI Assistant",
    description: "Voice-powered AI assistant for creators, engineers, and makers.",
    type: "website",
    url: "https://dvirious.com",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
