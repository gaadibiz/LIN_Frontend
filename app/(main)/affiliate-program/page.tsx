import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate program - Coming soon | LoanINNeed",
  description:
    "The LoanInNeed affiliate program is coming soon. Get in touch with us to know more about partnering with LoanInNeed.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function AffiliateProgramPage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-40">
      <div className="max-w-2xl mx-auto text-center">
        <span className="inline-block rounded-full bg-red-50 text-primary text-sm font-medium px-4 py-1.5 mb-6">
          Coming soon
        </span>

        <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
          Our <span className="text-primary">affiliate program</span> is on its
          way
        </h1>

        <p className="text-gray-600 text-lg leading-relaxed mb-10">
          We are putting the finishing touches on the LoanInNeed affiliate
          program. Please check back shortly - in the meantime, our team is
          happy to answer any questions about partnering with us.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact-us"
            className="w-full sm:w-auto rounded-full bg-primary px-8 py-3 font-medium text-white transition-colors hover:opacity-90"
          >
            Contact us
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto rounded-full border border-gray-300 px-8 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
