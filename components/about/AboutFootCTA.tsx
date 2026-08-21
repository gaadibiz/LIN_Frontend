import Link from "next/link";
import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

const AboutFootCTA = () => {
  return (
    <section className="w-full max-w-7xl mx-auto py-4 px-6 md:p-12 lg:p-20 lg:-my-32">
      <div className="rounded-3xl py-10 px-6 w-full bg-primary bg-[url('/about/ellipse-group.png')] bg-cover bg-no-repeat">
        <div className="text-center flex flex-col justify-center items-center-safe space-y-5">
          <div className="flex flex-col space-y-3">
            <span className="text-white font-semibold leading-tight">
              Career
            </span>
            <h2 className="text-white lg:text-3xl text-2xl font-bold">
              Want to join us?
            </h2>
          </div>
          <p className="text-white text-base max-w-lg">
            We want passionate problem-solvers who believe in making finance
            simpler for everyone. Whether you&apos;re a developer, marketer,
            customer support hero, or financial expert, your role here makes a
            real difference.
          </p>
          <Link href="/contact-us">
            <Button
              size="lg"
              className="bg-white hover:bg-white/90 text-primary font-semibold"
            >
              Explore Opportunities <ArrowRight className="ml-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutFootCTA;
