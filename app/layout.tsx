import type { Metadata, Viewport } from "next";
import "@fontsource/kantumruy-pro/400.css";
import "@fontsource/kantumruy-pro/500.css";
import "@fontsource/kantumruy-pro/600.css";
import "@fontsource/kantumruy-pro/700.css";
import "@fontsource/noto-sans-khmer/400.css";
import "@fontsource/noto-sans-khmer/700.css";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "KhmerPayroll — ប្រព័ន្ធគ្រប់គ្រងបៀវត្សរ៍",
  description:
    "ប្រព័ន្ធគ្រប់គ្រងបៀវត្សរ៍ពេញលេញ ស្របតាមច្បាប់កម្ពុជា — គណនា ប.ស.ស, ពន្ធលើបៀវត្សរ៍, ប័ណ្ណបៀវត្សរ៍ និងនាំចេញ PDF តាមទម្រង់ស្តង់ដារ។",
  applicationName: "KhmerPayroll",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b2038",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="km">
      <body className="bg-ink-50 text-ink-900 antialiased">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
