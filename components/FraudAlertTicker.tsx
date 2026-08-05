"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { cn } from "../lib/utils";

export default function FraudAlertTicker() {
  const [isOpen, setIsOpen] = useState(false);

  const tickerText =
    "⚠️ Fraud Alert: Never pay your loan EMI by scanning a QR code received via WhatsApp, SMS, or from any individual claiming to represent us. | We never send personal QR codes or ask for payments to personal UPI IDs or bank accounts. | Make payments only through our official website/app or authorized payment channels. If in doubt, contact our Customer Support before making any payment.";

  return (
    <>
      {/* Ticker Bar */}
      <div
        onClick={() => setIsOpen(true)}
        className={cn('bg-red-700', 'hover:bg-red-800', 'text-white', 'text-[11px]', 'sm:text-sm', 'font-medium', 'py-1.5', 'sm:py-2', 'px-2', 'sm:px-3', 'cursor-pointer', 'overflow-hidden', 'relative', 'shadow-inner', 'z-50', 'flex', 'items-center', 'transition-colors', 'group', 'select-none', 'active:opacity-90')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(true);
          }
        }}
        title="Click to view full Fraud Alert details"
      >
        <div className={cn('shrink-0', 'bg-red-950/90', 'text-amber-300', 'px-1', 'sm:px-2', 'py-0.5', 'rounded', 'font-bold', 'text-[8.5px]', 'sm:text-xs', 'uppercase', 'tracking-normal', 'sm:tracking-wider', 'flex', 'items-center', 'gap-0.5', 'sm:gap-1.5', 'mr-1.5', 'sm:mr-3', 'z-10', 'shadow-sm', 'border', 'border-red-500/40')}>
          <ShieldAlert className={cn('w-2.5', 'h-2.5', 'sm:w-3.5', 'sm:h-3.5', 'text-amber-300', 'animate-pulse')} />
          <span>Fraud Alert</span>
        </div>

        <div className={cn('overflow-hidden', 'whitespace-nowrap', 'w-full', 'relative', 'flex', 'items-center')}>
          <div className={cn('animate-marquee', 'inline-flex', 'whitespace-nowrap', 'group-hover:[animation-play-state:paused]')}>
            <span className={cn('inline-block', 'px-2', 'sm:px-4')}>{tickerText}</span>
            <span className={cn('inline-block', 'px-2', 'sm:px-4')}>{tickerText}</span>
          </div>
        </div>

        <div className={cn('shrink-0', 'hidden', 'md:flex', 'items-center', 'text-xs', 'bg-white/20', 'hover:bg-white/30', 'text-white', 'px-2.5', 'py-0.5', 'rounded-full', 'ml-3', 'z-10', 'font-semibold', 'border', 'border-white/30', 'whitespace-nowrap')}>
          Read Details &rarr;
        </div>
      </div>

      {/* Fraud Alert Modal Popup */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent showCloseButton={false} className={cn('sm:max-w-4xl', 'max-w-[92vw]', 'w-full', 'max-h-[85vh]', 'sm:max-h-[90vh]', 'overflow-y-auto', 'p-0', 'gap-0', 'border-red-200', 'rounded-xl', 'sm:rounded-2xl')}>
          <DialogHeader className={cn('bg-gradient-to-r', 'from-red-700', 'via-red-600', 'to-rose-700', 'text-white', 'p-4', 'sm:p-6', 'rounded-t-xl', 'sm:rounded-t-2xl', 'sticky', 'top-0', 'z-10', 'shadow-md', 'flex-row', 'justify-between', 'items-start')}>
            <div className={cn('flex', 'items-center', 'gap-2.5', 'sm:gap-3', 'pr-8')}>
              <div className={cn('p-2', 'sm:p-2.5', 'bg-white/10', 'rounded-full', 'border', 'border-white/20', 'shrink-0')}>
                <ShieldAlert className={cn('w-5', 'h-5', 'sm:w-7', 'sm:h-7', 'text-amber-300')} />
              </div>
              <DialogTitle className={cn('text-sm', 'sm:text-xl', 'font-bold', 'leading-tight', 'sm:leading-snug', 'text-white')}>
                ⚠️ Fraud Alert – Stay Safe from Online Payment Scams
              </DialogTitle>
            </div>
            <DialogClose className={cn('absolute', 'top-3', 'right-3', 'sm:top-4', 'sm:right-4', 'p-1.5', 'sm:p-2', 'rounded-full', 'text-white/80', 'hover:text-white', 'bg-black/20', 'hover:bg-black/40', 'transition-colors', 'focus:outline-none', 'z-20')}>
              <X className={cn('w-4', 'h-4', 'sm:w-5', 'sm:h-5')} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <div className={cn('p-4', 'sm:p-6', 'space-y-4', 'sm:space-y-6', 'text-gray-800', 'text-xs', 'sm:text-base', 'leading-relaxed', 'bg-white')}>
            {/* Greeting & Priority note */}
            <div className={cn('bg-red-50/90', 'border-l-4', 'border-red-600', 'p-3', 'sm:p-4', 'rounded-r-md', 'space-y-1', 'sm:space-y-2')}>
              <p className={cn('font-bold', 'text-red-950', 'text-sm', 'sm:text-base')}>Dear Customer,</p>
              <p className={cn('font-semibold', 'text-red-900', 'text-xs', 'sm:text-base')}>Your safety is our priority.</p>
              <p className={cn('text-gray-700', 'text-xs', 'sm:text-base')}>
                Please do not make any loan repayment or EMI payment by scanning a QR Code received through WhatsApp, SMS, email, or any other messaging platform from an individual claiming to represent our company.
              </p>
            </div>

            {/* Please be aware */}
            <div className={cn('space-y-2', 'sm:space-y-3')}>
              <h3 className={cn('font-bold', 'text-xs', 'sm:text-lg', 'text-red-700', 'flex', 'items-center', 'gap-1.5', 'sm:gap-2', 'border-b', 'border-red-100', 'pb-1.5', 'sm:pb-2')}>
                <AlertTriangle className={cn('w-4', 'h-4', 'sm:w-5', 'sm:h-5', 'text-red-600', 'shrink-0')} />
                Please be aware:
              </h3>
              <ul className={cn('space-y-2', 'sm:space-y-2.5', 'pl-0.5')}>
                <li className={cn('flex', 'items-start', 'gap-2', 'text-gray-700', 'text-xs', 'sm:text-sm')}>
                  <span className={cn('h-1.5', 'w-1.5', 'sm:h-2', 'sm:w-2', 'rounded-full', 'bg-red-600', 'mt-1.5', 'shrink-0')} />
                  <span>We never ask customers to pay pending EMIs by scanning a QR code shared through personal WhatsApp numbers.</span>
                </li>
                <li className={cn('flex', 'items-start', 'gap-2', 'text-gray-700', 'text-xs', 'sm:text-sm')}>
                  <span className={cn('h-1.5', 'w-1.5', 'sm:h-2', 'sm:w-2', 'rounded-full', 'bg-red-600', 'mt-1.5', 'shrink-0')} />
                  <span>Do not transfer money to any personal bank account or UPI ID provided over phone calls, WhatsApp, or social media.</span>
                </li>
                <li className={cn('flex', 'items-start', 'gap-2', 'text-gray-700', 'text-xs', 'sm:text-sm')}>
                  <span className={cn('h-1.5', 'w-1.5', 'sm:h-2', 'sm:w-2', 'rounded-full', 'bg-red-600', 'mt-1.5', 'shrink-0')} />
                  <span>Fraudsters may impersonate our employees and send fake payment requests or QR codes.</span>
                </li>
                <li className={cn('flex', 'items-start', 'gap-2', 'text-gray-700', 'text-xs', 'sm:text-sm')}>
                  <span className={cn('h-1.5', 'w-1.5', 'sm:h-2', 'sm:w-2', 'rounded-full', 'bg-red-600', 'mt-1.5', 'shrink-0')} />
                  <span>Always verify payment instructions through our official customer support channels before making any payment.</span>
                </li>
              </ul>
            </div>

            {/* Safe Payment Practices */}
            <div className={cn('space-y-2', 'sm:space-y-3')}>
              <h3 className={cn('font-bold', 'text-xs', 'sm:text-lg', 'text-emerald-700', 'flex', 'items-center', 'gap-1.5', 'sm:gap-2', 'border-b', 'border-emerald-100', 'pb-1.5', 'sm:pb-2')}>
                <CheckCircle2 className={cn('w-4', 'h-4', 'sm:w-5', 'sm:h-5', 'text-emerald-600', 'shrink-0')} />
                Safe Payment Practices
              </h3>
              <ul className={cn('space-y-2', 'sm:space-y-2.5', 'pl-0.5')}>
                <li className={cn('flex', 'items-start', 'gap-2', 'text-gray-700', 'text-xs', 'sm:text-sm')}>
                  <span className={cn('h-1.5', 'w-1.5', 'sm:h-2', 'sm:w-2', 'rounded-full', 'bg-emerald-600', 'mt-1.5', 'shrink-0')} />
                  <span>Make payments only through our official website, mobile application, or authorized payment channels.</span>
                </li>
                <li className={cn('flex', 'items-start', 'gap-2', 'text-gray-700', 'text-xs', 'sm:text-sm')}>
                  <span className={cn('h-1.5', 'w-1.5', 'sm:h-2', 'sm:w-2', 'rounded-full', 'bg-emerald-600', 'mt-1.5', 'shrink-0')} />
                  <span>Verify that you are communicating with our official customer care before making any transaction.</span>
                </li>
                <li className={cn('flex', 'items-start', 'gap-2', 'text-gray-700', 'text-xs', 'sm:text-sm')}>
                  <span className={cn('h-1.5', 'w-1.5', 'sm:h-2', 'sm:w-2', 'rounded-full', 'bg-emerald-600', 'mt-1.5', 'shrink-0')} />
                  <span>If you receive any suspicious QR code or payment request, do not scan or pay.</span>
                </li>
                <li className={cn('flex', 'items-start', 'gap-2', 'text-gray-700', 'text-xs', 'sm:text-sm')}>
                  <span className={cn('h-1.5', 'w-1.5', 'sm:h-2', 'sm:w-2', 'rounded-full', 'bg-emerald-600', 'mt-1.5', 'shrink-0')} />
                  <span>If you suspect fraud, immediately contact our Customer Support and report the incident.</span>
                </li>
              </ul>
            </div>

            {/* Final Warning Footer Box */}
            <div className={cn('bg-amber-50', 'border', 'border-amber-200', 'p-3', 'sm:p-4', 'rounded-lg', 'flex', 'items-start', 'gap-2.5', 'sm:gap-3', 'text-amber-950')}>
              <ShieldCheck className={cn('w-4', 'h-4', 'sm:w-5', 'sm:h-5', 'text-amber-700', 'shrink-0', 'mt-0.5')} />
              <p className={cn('font-medium', 'text-[11px]', 'sm:text-sm', 'leading-snug')}>
                Remember: Scanning an unknown QR code can result in the loss of your money. Stay vigilant and protect yourself from online fraud.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
