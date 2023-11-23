import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "./PretendardVariable.ttf",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "STAT NFT REFUND",
  description: "STAT NFT REFUND",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={pretendard.variable}>{children}</body>
    </html>
  );
}
