import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FullcareOS",
  description: "Gestão para oficinas e autocentros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-ice-white text-primary">
        {children}
      </body>
    </html>
  );
}
