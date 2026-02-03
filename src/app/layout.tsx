import "./globals.css";
import type { Metadata } from "next";
import Shell from "./components/Shell";

export const metadata: Metadata = {
  title: "Conference Site",
  description: "Scientific Conference",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
