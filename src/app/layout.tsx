import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

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
      <head>
        <Script 
          src="https://www.trackaton.com/track.js"
          data-website-id="jd72a9yne97bbmxexdenc74s517yqb9g"
          data-endpoint="https://resolute-orca-949.convex.site/api/e"
          async
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
