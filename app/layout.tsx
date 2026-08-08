import type { Metadata } from "next";
import "./globals.css";
import { outfit } from "@/lib/fonts";
import { Toaster } from "sonner";
import ReferralTracker from "@/components/ReferralTracker";
import ScrollToTop from "@/components/ScrollToTop";
import DevToolsGuard from "@/components/DevToolsGuard";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Get low rate personal loans within minutes | LoanINNeed",
  description:
    "Get ₹5000 - ₹1L personal payday loans at a low rate of interest. Have a CIBIL less than 700, no issue we offer loans at CIBIL starting from 650+. Apply now!",
  keywords: [
    "low rate loan",
    "personal loan with low interest",
    "Insta personal loan",
    "payday loan with low interest",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`}>
        {/* Google Ads Conversion Tracking */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-10980985072"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-10980985072');
          `}
        </Script>
        <DevToolsGuard />
        <ScrollToTop />
        <ReferralTracker />
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}

