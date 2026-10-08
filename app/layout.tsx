/* eslint-disable @next/next/next-script-for-ga */
import type { Metadata, Viewport } from "next";
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
  // The LoanINNeed mark, on every device. The files themselves live at the App Router's
  // conventional paths — app/favicon.ico, app/icon.png, app/apple-icon.png — and Next.js
  // would link them on its own; they are named here as well so an older browser that only
  // looks for shortcut icon, and iOS, both get an explicit tag.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// Colours the browser chrome on Android, and the status bar of an installed PWA, in the
// brand red the dashboard and buttons already use.
export const viewport: Viewport = {
  themeColor: "#EF4444",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NGZJ6DKC');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={`${outfit.className} antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NGZJ6DKC"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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

