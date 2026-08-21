import { sanityClient } from "@/sanity/client";
import { careerBySlugQuery, activeCareersQuery } from "@/sanity/queries";
import { PortableText } from "next-sanity";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface Career {
  title: string;
  location: string;
  employmentType: string;
  shortDescription?: string;
  description?: any;
  responsibilities?: string[];
  requirements?: string[];
  qualifications?: string[];
}

export const revalidate = 60;

// Careers section is hidden for now — see app/(cms)/careers/page.tsx
const CAREERS_ENABLED = false;

export async function generateStaticParams() {
  if (!CAREERS_ENABLED) {
    return [];
  }

  try {
    const jobs = await sanityClient.fetch<{ slug: string }[]>(
      activeCareersQuery
    );
    return jobs.map((job) => ({ slug: job.slug }));
  } catch (error) {
    console.error("Error fetching careers for static params:", error);
    return [];
  }
}

export default async function CareerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!CAREERS_ENABLED) {
    notFound();
  }

  const { slug } = await params;
  const job = await sanityClient.fetch<Career>(careerBySlugQuery, {
    slug,
  });

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center md:mt-12 mt-24 max-w-7xl mx-auto py-4 p-4 md:p-12 lg:p-20">
        <h1 className="text-2xl font-bold">Job not found</h1>
        <p className="mt-2 text-muted-foreground">
          This position may have been filled or is no longer available.
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8 md:mt-12 mt-24 max-w-7xl mx-auto py-4 p-4 md:p-12 lg:p-20">
      {/* Header Section */}
      <header className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">{job.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.employmentType}
              </span>
            </div>
          </div>
        </div>
        {job.shortDescription && (
          <p className="text-lg text-muted-foreground">
            {job.shortDescription}
          </p>
        )}
      </header>

      {/* Job Description */}
      {job.description && (
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-semibold">About the Role</h2>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <PortableText value={job.description} />
          </div>
        </Card>
      )}

      {/* Responsibilities */}
      {job.responsibilities && job.responsibilities.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-semibold">Responsibilities</h2>
          <ul className="space-y-2 list-disc list-inside">
            {job.responsibilities.map((item: string, idx: number) => (
              <li key={idx} className="text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Requirements */}
      {job.requirements && job.requirements.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-semibold">Requirements</h2>
          <ul className="space-y-2 list-disc list-inside">
            {job.requirements.map((item: string, idx: number) => (
              <li key={idx} className="text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Qualifications */}
      {job.qualifications && job.qualifications.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-semibold">Qualifications</h2>
          <ul className="space-y-2 list-disc list-inside">
            {job.qualifications.map((item: string, idx: number) => (
              <li key={idx} className="text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Application CTA */}
      <Card className="p-6 bg-primary/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Interested in this role?</h3>
            <p className="text-sm text-muted-foreground">
              Apply now and join our team
            </p>
          </div>
          <Button size="lg" className="w-full md:w-auto">
            Apply for this Position
          </Button>
        </div>
      </Card>
    </main>
  );
}
