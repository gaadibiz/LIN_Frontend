"use client"

import { CalendarClock, FileClock, FileX2, Clock3 } from "lucide-react"
import { formatAppNumber } from "@/lib/utils"
import {
  IN_PROCESS_LABEL,
  formatApplicationDate,
  formatApplicationStatus,
  getApplicationDate,
  isInProcessApplication,
  type EligibilityBlock,
} from "@/lib/application-gate"

interface EligibilityNoticeProps {
  block: EligibilityBlock;
  // Reference numbers are built from the Aadhaar, the same way Loan History builds them.
  aadhaarNumber?: string;
}

// Shown in the dashboard's right-hand pane, in place of the Reapply / Reloan form, when the
// customer is not yet eligible. Deliberately a page rather than a toast: the reason depends
// on when each application was filed and where it has got to, which is more than a
// disappearing one-line alert can carry — and the customer needs to be able to read it,
// scroll it, and come back to it.
export function EligibilityNotice({ block, aadhaarNumber }: EligibilityNoticeProps) {
  const isWait = block.availableFrom !== undefined;
  const Icon = block.kind === "cooldown" ? FileX2 : block.kind === "in-process" ? FileClock : Clock3;

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-8 md:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-600/20">
            <Icon className="w-9 h-9 text-[#c81e1e]" strokeWidth={1.5} />
          </div>

          <h3 className="text-[22px] md:text-[26px] font-extrabold text-[#1c2b4f] mb-3 tracking-tight">
            {block.title}
          </h3>
          <p className="text-[#6b7280] text-sm font-medium leading-relaxed max-w-[520px]">
            {block.message}
          </p>
        </div>

        {/* When they become eligible. Only the two waits have a date; an in-process block
            has no date to give, because it depends on the review finishing. */}
        {isWait && block.availableFrom && (
          <div className="mt-8 bg-[#fdf6f6] border border-red-100 rounded-2xl py-5 px-6 flex items-center gap-4">
            <div className="flex-shrink-0 bg-red-100 p-3 rounded-xl">
              <CalendarClock className="w-6 h-6 text-[#c81e1e]" />
            </div>
            <div className="text-[13px] font-medium text-gray-600 leading-relaxed">
              You may apply again from{" "}
              <span className="font-bold text-[#1c2b4f]">
                {formatApplicationDate(block.availableFrom)}
              </span>
              <br />
              {block.daysRemaining === 1 ? "1 day" : `${block.daysRemaining} days`} to go.
            </div>
          </div>
        )}

        {/* The applications the decision rests on — when each was filed and where it is.
            This is the "application time and process" the customer is being held up by. */}
        {block.applications.length > 0 && (
          <div className="mt-8">
            <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-4">
              {block.applications.length > 1 ? "Your applications" : "Your application"}
            </h4>

            <div className="space-y-3">
              {block.applications.map((application, index) => {
                const appliedOn = getApplicationDate(application);
                const pending = isInProcessApplication(application);

                return (
                  <div
                    key={application.id ?? index}
                    className="border border-gray-100 rounded-2xl p-5 bg-[#fafafa] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-gray-500 mb-1">
                        Application
                      </div>
                      <div className="text-[15px] font-extrabold text-[#1e293b] break-words">
                        {application.id !== undefined
                          ? formatAppNumber(application.id, aadhaarNumber)
                          : "—"}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-[13px] font-bold text-gray-500 mb-1">
                        Applied on
                      </div>
                      <div className="text-[15px] font-bold text-[#1e293b]">
                        {appliedOn ? formatApplicationDate(appliedOn) : "—"}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-[13px] font-bold text-gray-500 mb-1">Status</div>
                      <span
                        className={`inline-block text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                          pending
                            ? "bg-red-50 text-[#c81e1e]"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {pending ? IN_PROCESS_LABEL : formatApplicationStatus(application.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="https://api.whatsapp.com/send/?phone=919217364584&text=Hi%20I%20have%20applied%20for%20a%20loan.%20I%20have%20a%20query.%20Please%20assist&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#c81e1e] hover:text-red-700 hover:underline text-sm transition-colors"
          >
            Chat with us
          </a>
        </div>
      </div>
    </div>
  )
}
