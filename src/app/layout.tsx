import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const excalifont = localFont({
  src: "./Excalifont-Regular.woff2",
  variable: "--font-excalifont",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://organote.vercel.app"),
  title: "Organote",
  description: "Noting, visualized.",
  openGraph: {
    images: "/og.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      </head> */}
      <body className={`${excalifont.variable} ${geist.variable} font-(family-name:--font-geist) antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
