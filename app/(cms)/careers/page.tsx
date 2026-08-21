import { sanityClient } from "@/sanity/client";
import { activeCareersQuery } from "@/sanity/queries";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface CareerSummary {
  _id: string;
  title: string;
  slug: string;
  location: string;
  employmentType: string;
  shortDescription?: string;
}

export const revalidate = 60;

// Careers page is hidden for now — no open positions. Remove the notFound()
// below (and restore the links in Navbar.tsx / Footer.tsx / AboutFootCTA.tsx)
// to bring it back.
const CAREERS_ENABLED = false;

export default async function CareersPage() {
  if (!CAREERS_ENABLED) {
    notFound();
  }

  let jobs: CareerSummary[] = [];
  try {
    jobs = await sanityClient.fetch(activeCareersQuery);
  } catch (error) {
    console.error("Error fetching careers:", error);
  }

  return (
    <main className="min-h-screen md:mt-12 mt-24 max-w-7xl mx-auto py-4 p-4 md:p-12 lg:p-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20 px-4">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Join Our <span className="text-primary">Team</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build the future with us. Explore exciting opportunities and grow your career.
          </p>
        </div>
      </section>

      {/* Jobs Listing */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">No open positions</h2>
            <p className="text-muted-foreground">
              Check back later for new opportunities!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Open Positions</h2>
              <p className="text-muted-foreground">
                {jobs.length} {jobs.length === 1 ? "position" : "positions"} available
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/careers/${job.slug}`}
                  className="group block"
                >
                  <div className="h-full rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary" className="mb-2">
                          {job.employmentType}
                        </Badge>
                      </div>

                      <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>

                      {job.shortDescription && (
                        <p className="text-muted-foreground mb-4 line-clamp-2 flex-grow">
                          {job.shortDescription}
                        </p>
                      )}

                      <div className="flex items-center text-primary font-medium mt-auto">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
