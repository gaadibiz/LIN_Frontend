import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ChevronRight,
  Headset,
  Laptop,
  Mail,
  MailOpen,
  PhoneCall,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import FootCTA from "@/components/FootCTA";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Grievance Redressal - LoanInNeed",
  description:
    "Raise a query, complaint or request with LoanInNeed. Follow our grievance redressal and escalation mechanism as per RBI guidelines.",
};

const RBI_CMS_URL = "https://cms.rbi.org.in/cms/indexpage.html#eng";

const flowLevels = [
  {
    level: 1,
    title: "Customer Service",
    channels: "Email | Call",
    tone: "bg-sky-50 border-sky-200 border-l-sky-500",
    badge: "bg-sky-600",
  },
  {
    level: 2,
    title: "Grievance Redressal Officer",
    channels: "Call | Email",
    tone: "bg-amber-50 border-amber-200 border-l-amber-500",
    badge: "bg-amber-600",
  },
  {
    level: 3,
    title: "Nodal Officer",
    channels: "Call | Email",
    tone: "bg-emerald-50 border-emerald-200 border-l-emerald-500",
    badge: "bg-emerald-600",
  },
];

const officers = [
  {
    value: "level-2",
    level: 2,
    title: "Grievance Redressal Officer",
    intro:
      "If your issue is unresolved at Level 1, contact the officer below. It will take up to 10 working days for resolution.",
    name: "Ms. Himani Singh",
    phone: "+91 9266328731",
    email: "grievance@loaninneed.in",
    badge: "bg-amber-600",
    accent: "border-l-amber-500",
    icon: "text-amber-600",
  },
  {
    value: "level-3",
    level: 3,
    title: "Nodal Officer",
    intro:
      "If your issue is unresolved at Level 2, contact the officer below. It will take up to 10 working days for resolution.",
    name: "Mr. Harsh Singhal",
    phone: "+91-9230192718",
    email: "nodalofficer@naveenfinance.com",
    badge: "bg-emerald-600",
    accent: "border-l-emerald-500",
    icon: "text-emerald-600",
  },
];

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

function ContactCard({
  title,
  description,
  icon: Icon,
  cta,
  href,
  external,
  tone = "brand",
}: {
  title: string;
  description: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
  href: string;
  external?: boolean;
  tone?: "sky" | "brand";
}) {
  const toneClass =
    tone === "sky"
      ? { card: "border-t-sky-500", icon: "bg-sky-50 text-sky-600" }
      : { card: "border-t-red-500", icon: "bg-red-50 text-red-500" };

  return (
    <div
      className={`flex gap-4 rounded-2xl border border-gray-200 border-t-4 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow ${toneClass.card}`}
    >
      <div className="flex flex-1 flex-col">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
          {title}
        </h3>
        <div className="mt-2 flex-1 text-sm text-gray-600 break-words">
          {description}
        </div>
        <a
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="mt-4 inline-flex w-fit items-center gap-1 rounded-full border border-red-500 px-4 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors"
        >
          {cta}
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
      <div
        className={`hidden sm:flex h-24 w-24 shrink-0 items-center justify-center rounded-xl ${toneClass.icon}`}
      >
        <Icon className="h-10 w-10" />
      </div>
    </div>
  );
}

export default function GrievanceRedressalPage() {
  return (
    <div className="min-h-screen w-full md:mt-12 mt-24">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="py-16 px-4 md:p-12 lg:p-20 max-w-7xl w-full mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-4 w-full">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-red-500 font-medium">
                      Grievance Redressal
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl sm:text-5xl font-bold text-red-500 mb-2">
                Grievance redressal
              </h1>
              <p className="text-gray-600 max-w-xl">
                Raise a query, complaint or request. We follow a transparent
                grievance redressal and escalation mechanism in line with RBI
                guidelines.
              </p>
            </div>
            <Image
              src="/contact.png"
              alt="Grievance Redressal"
              width={300}
              height={300}
              className="h-full object-contain w-[30%] sm:w-[42%]"
            />
          </div>
        </div>
      </div>

      {/* Flow chart */}
      <section className="max-w-7xl mx-auto px-4 pt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
          Grievance Redressal &amp; Escalation Mechanism
        </h2>
        <p className="mt-2 text-center text-gray-600">
          Follow the levels in order for the fastest resolution.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto_1fr] items-stretch">
          {/* Internal escalation */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <p className="mb-4 text-center font-semibold text-gray-800">
              LoanInNeed Escalation Mechanism
            </p>
            <div className="flex flex-col items-center">
              {flowLevels.map((l, i) => (
                <div
                  key={l.level}
                  className="w-full flex flex-col items-center"
                >
                  <div
                    className={`w-full flex items-center gap-4 rounded-xl border border-l-4 px-4 py-4 ${l.tone}`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold ${l.badge}`}
                    >
                      {l.level}
                    </span>
                    <div className="flex-1 text-center pr-9">
                      <p className="font-semibold text-gray-900">
                        Level {l.level} – {l.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{l.channels}</p>
                    </div>
                  </div>
                  {i < flowLevels.length - 1 && (
                    <ArrowDown className="my-2 h-5 w-5 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className="flex items-center justify-center">
            <ArrowRight className="hidden lg:block h-8 w-8 text-gray-400" />
            <ArrowDown className="lg:hidden h-8 w-8 text-gray-400" />
          </div>

          {/* RBI */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col">
            <p className="mb-4 text-center font-semibold text-gray-800">
              Ombudsman Scheme
            </p>
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-red-500 px-4 py-8 text-center text-white">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/10">
                <ShieldCheck className="h-7 w-7 text-white" />
              </span>
              <p className="font-semibold">Level 4 – RBI Ombudsman</p>
              <p className="text-sm text-white/80 mt-1">
                Portal | Call | Email | Post a letter
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Level 1 */}
      <section className="max-w-7xl mx-auto px-4 pt-16">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 align-middle text-sm font-bold text-white">
            1
          </span>
          Level 1 – Raise a service request{" "}
          <span className="block sm:inline text-base font-medium text-gray-500">
            (Please allow up to 10 working days for resolution)
          </span>
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ContactCard
            title="Write to us"
            description={
              <>
                Email your query to{" "}
                <span className="font-medium text-gray-800">
                  customerservice@loaninneed.in
                </span>
              </>
            }
            icon={Mail}
            tone="sky"
            cta="Send Email"
            href="mailto:customerservice@loaninneed.in"
          />
          <ContactCard
            title="Talk to us"
            description={
              <>
                Speak to our customer care executive at{" "}
                <span className="font-medium text-gray-800">
                  +91 9266328731
                </span>
              </>
            }
            icon={Headset}
            tone="sky"
            cta="Call Now"
            href={telHref("+91 9266328731")}
          />
        </div>
      </section>

      {/* Level 2 & 3 */}
      <section className="max-w-7xl mx-auto px-4 pt-12">
        <Accordion
          type="multiple"
          defaultValue={officers.map((o) => o.value)}
          className="rounded-2xl border border-gray-200 bg-white px-4 sm:px-6"
        >
          {officers.map((o) => (
            <AccordionItem
              key={o.value}
              value={o.value}
              className={`border-l-4 pl-4 my-4 ${o.accent}`}
            >
              <AccordionTrigger className="text-lg sm:text-xl font-semibold text-gray-900 hover:no-underline">
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${o.badge}`}
                  >
                    {o.level}
                  </span>
                  Level {o.level} – {o.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-gray-700 text-base">
                <p>{o.intro}</p>
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <UserRound className={`h-5 w-5 ${o.icon}`} />
                  {o.name}
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <PhoneCall className={`h-4 w-4 shrink-0 ${o.icon}`} />
                    Phone:{" "}
                    <a
                      href={telHref(o.phone)}
                      className="text-red-500 hover:underline"
                    >
                      {o.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-2 break-all">
                    <Mail className={`h-4 w-4 shrink-0 ${o.icon}`} />
                    Email:{" "}
                    <a
                      href={`mailto:${o.email}`}
                      className="text-red-500 hover:underline"
                    >
                      {o.email}
                    </a>
                  </li>
                </ul>
                <p className="text-sm text-gray-500">
                  Please mention your previous service request number when
                  contacting the officer.
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Note */}
      <section className="max-w-7xl mx-auto px-4 pt-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-gray-800">
          <span className="font-semibold">Note: </span>
          If the service request raised through Level 1, 2 and 3 remains
          unresolved or you do not get a satisfactory response within 30 days of
          lodging an issue/complaint, you may contact the RBI Ombudsman on the
          details given below.
        </div>
      </section>

      {/* Level 4 */}
      <section className="max-w-7xl mx-auto px-4 pt-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 align-middle text-sm font-bold text-white">
            4
          </span>
          Level 4 – RBI Ombudsman
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <ContactCard
            title="File a complaint on RBI portal"
            description="Lodge your complaint online on the RBI Complaint Management System."
            icon={Laptop}
            cta="Visit Website"
            href={RBI_CMS_URL}
            external
          />
          <ContactCard
            title="Call on toll-free number 14448"
            description="Contact the RBI Contact Centre for assistance."
            icon={PhoneCall}
            cta="Call Now"
            href="tel:14448"
          />
          <ContactCard
            title="Email to RBI Ombudsman"
            description={
              <>
                You can send an email to:{" "}
                <span className="font-medium text-gray-800">
                  crpc@rbi.org.in
                </span>
              </>
            }
            icon={MailOpen}
            cta="Know More"
            href={RBI_CMS_URL}
            external
          />
        </div>

        <Accordion
          type="single"
          collapsible
          defaultValue="post"
          className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 sm:px-6"
        >
          <AccordionItem value="post">
            <AccordionTrigger className="text-lg sm:text-xl font-semibold text-gray-900 hover:no-underline">
              Post a letter to Ombudsman
            </AccordionTrigger>
            <AccordionContent>
              <address className="not-italic rounded-xl bg-gray-50 p-4 text-base text-gray-700">
                Centralised Receipt and Processing Centre (CRPC),
                <br />
                4th Floor, Reserve Bank of India,
                <br />
                Sector-17, Central Vista,
                <br />
                Chandigarh – 160017
              </address>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <div className="pb-16" />
      <FootCTA />
    </div>
  );
}
