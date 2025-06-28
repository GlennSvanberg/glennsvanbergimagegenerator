import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glenn Svanberg - Alla heter inte Glenn",
  description: "Skapa roliga AI-bilder av Glenn Svanberg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
