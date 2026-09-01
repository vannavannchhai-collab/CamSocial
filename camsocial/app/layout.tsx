import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "CamSocial - បណ្តាញសង្គមខ្មែរ",
  description: "កម្មវិធីស្រដៀង Facebook សម្រាប់ប្រជាជនខ្មែរ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased transition-colors">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
