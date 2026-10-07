"use client";

import React from "react";
import { AlertTriangle, MessageCircle } from "lucide-react";

export function InternalIssueNotice() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full py-12 flex flex-col items-center text-center fade-in">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border border-amber-200/60 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-amber-600" strokeWidth={1.8} />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 mb-4">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Technical Issue Detected
      </span>

      <h3 className="text-2xl font-extrabold text-[#1c2b4f] mb-3">
        Temporary Service Interruption
      </h3>

      <p className="text-[#6b7280] mb-6 text-sm font-medium px-4 max-w-md leading-relaxed">
        We are experiencing a temporary internal issue while processing application details. Please try again after some time.
      </p>

      <a
        href="https://api.whatsapp.com/send/?phone=919217364584&text=Hi%20I%20am%20facing%20an%20issue%20with%20my%20loan%20application.%20Please%20assist&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-bold text-[#c81e1e] hover:text-red-700 hover:underline text-sm transition-colors mt-2"
      >
        <MessageCircle className="w-4 h-4" />
        Chat with Support
      </a>
    </div>
  );
}
