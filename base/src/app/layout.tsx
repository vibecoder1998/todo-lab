import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: "600" });

export const metadata: Metadata = {
  title: "To-Do Dashboard",
  description: "Workshop to-do app built from the Figma Dashboard design",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-page font-sans text-ink">{children}</body>
    </html>
  );
}
