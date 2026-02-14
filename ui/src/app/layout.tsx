import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenHedgeFund",
  description: "Open-source hedge fund infrastructure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
