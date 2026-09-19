import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  // One canonical host: www.loaninneed.in is sent to loaninneed.in, permanently.
  //
  // This is not only about tidy urls. The DigiLocker hand-off talks between two tabs
  // through a BroadcastChannel and a localStorage write, and both are scoped to the
  // ORIGIN. A customer who starts the form on www and is sent back by the backend's
  // fixed callback url on the bare domain lands on a different origin: the form tab
  // never hears the result, and the "back to my application" url is not there either.
  // Collapsing the two hosts into one removes that whole class of failure.
  //
  // 301 rather than Next's `permanent: true`, which issues a 308. Both are permanent;
  // 301 is what was asked for and what search engines and older clients handle best.
  //
  // The path and query survive: `/:path*` is carried into the destination, and Next
  // appends the original query string on top.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.loaninneed.in" }],
        destination: "https://loaninneed.in/:path*",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
