import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: { default: "NewsWatch", template: "%s · NewsWatch" },
  description: "Independent, mobile-first journalism. Breaking news, analysis and video.",
  openGraph: { siteName: "NewsWatch", type: "website" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
