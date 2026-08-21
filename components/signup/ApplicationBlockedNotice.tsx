"use client"

import { CalendarClock, FileClock, FileX2 } from "lucide-react"
import { formatAppNumber } from "@/lib/utils"
import { IN_PROCESS_LABEL, type ApplicationBlock } from "@/lib/application-gate"
import { REAPPLY_COOLDOWN_DAYS, formatCooldownDate } from "@/lib/reapply-cooldown"

interface ApplicationBlockedNoticeProps {
  block: ApplicationBlock;
  // Used to render the reference number of the application already in process.
  aadhaarNumber?: string;
}

// Shown in place of the eligibility form when the user may not file a new application:
// either one is still in process, or their last one was rejected inside the cooldown.
export function ApplicationBlockedNotice({ block, aadhaarNumber }: ApplicationBlockedNoticeProps) {
  if (block.kind === "in-process") {
    const { application, appliedOn } = block;

    return (
      <div className="w-full py-8 flex flex-col items-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 border border-red-600/30 shadow-sm">
          <FileClock className="w-10 h-10 text-[#c81e1e]" strokeWidth={1.5} />
        </div>

        <span className="inline-flex px-4 py-1.5 rounded-lg text-[13px] font-bold tracking-tight bg-red-50 text-[#c81e1e] mb-4">
          {IN_PROCESS_LABEL}
        </span>

        <h3 className="text-2xl font-extrabold text-[#1c2b4f] mb-3 text-center">
          Your application is already in process
        </h3>
        <p className="text-[#6b7280] mb-8 text-center text-sm font-medium px-4 max-w-[380px] leading-relaxed">
          Our team is currently reviewing the loan application you have already submitted.
          Only one application can be processed at a time, so a new one can be submitted
          once this one is completed.
        </p>

        <div className="bg-[#fdf6f6] border border-red-100 w-full max-w-[380px] py-5 px-6 rounded-2xl space-y-3 mb-6">
          {application.id !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-[13px] font-bold text-gray-500">Application</span>
              <span className="text-[13px] font-bold text-[#1e293b] text-right">
                {formatAppNumber(application.id, aadhaarNumber)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center gap-4">
            <span className="text-[13px] font-bold text-gray-500">Status</span>
            <span className="text-[13px] font-bold text-[#c81e1e] text-right">{IN_PROCESS_LABEL}</span>
          </div>
          {appliedOn && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-[13px] font-bold text-gray-500">Submitted on</span>
              <span className="text-[13px] font-bold text-[#1e293b] text-right">
                {formatCooldownDate(appliedOn)}
              </span>
            </div>
          )}
        </div>

        <a
          href="https://api.whatsapp.com/send/?phone=919217364584&text=Hi%20I%20have%20applied%20for%20a%20loan.%20I%20have%20a%20query.%20Please%20assist&type=phone_number&app_absent=0"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#c81e1e] hover:text-red-700 hover:underline text-sm transition-colors mt-2 pb-6"
        >
          Chat with us
        </a>
      </div>
    )
  }

  const { cooldown } = block;

  return (
    <div className="w-full py-8 flex flex-col items-center">
      <div className="w-40 h-40 bg-red-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-sm">
        <FileX2 className="w-20 h-20 text-[#c81e1e]" strokeWidth={1.5} />
      </div>

      <h3 className="text-2xl font-extrabold text-[#1c2b4f] mb-3 text-center">
        You can apply again after {REAPPLY_COOLDOWN_DAYS} days
      </h3>
      <p className="text-[#6b7280] mb-8 text-center text-sm font-medium px-4 max-w-[360px] leading-relaxed">
        Your previous loan application was rejected on{" "}
        <span className="font-bold text-[#1c2b4f]">{formatCooldownDate(cooldown.rejectedOn)}</span>.
        As per our credit policy a new application can only be submitted after{" "}
        {REAPPLY_COOLDOWN_DAYS} days from the rejection date.
      </p>

      <div className="bg-[#fdf6f6] border border-red-100 w-full max-w-[360px] py-5 px-6 rounded-2xl flex items-center gap-4 mb-6">
        <div className="flex-shrink-0 bg-red-100 p-3 rounded-xl">
          <CalendarClock className="w-6 h-6 text-[#c81e1e]" />
        </div>
        <div className="text-[13px] font-medium text-gray-600 leading-relaxed">
          You may reapply from{" "}
          <span className="font-bold text-[#1c2b4f]">{formatCooldownDate(cooldown.reapplyFrom)}</span>
          <br />
          {cooldown.daysRemaining === 1 ? "1 day" : `${cooldown.daysRemaining} days`} to go.
        </div>
      </div>

      <a
        href="https://api.whatsapp.com/send/?phone=919217364584&text=Hi%20I%20have%20applied%20for%20a%20loan.%20I%20have%20a%20query.%20Please%20assist&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-[#c81e1e] hover:text-red-700 hover:underline text-sm transition-colors mt-2 pb-6"
      >
        Chat with us
      </a>
    </div>
  )
}
