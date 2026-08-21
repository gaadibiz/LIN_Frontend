import React from "react";
import FAQSection from "@/components/FAQSection";
import HowItWorks from "@/components/HowItWorks";
import EligibilityMandatoryGrid from "@/components/personal-insta/EligibilityMandatoryGrid";
import LoanQuestionCard from "@/components/use-cases/LoanQuestionCard";
import {
  eligibilityCriteria,
  locationUseCaseData,
  mandatoryDocuments,
  medicalLoanFAQ,
} from "@/lib/data";
import CitiesHero from "@/components/cities/CitiesHero";
import CitiesUseCases from "@/components/cities/CitiesUseCases";
import LoanCalculator from "@/components/LoanCalculator";

export const dynamic = "force-dynamic";

export default function PaydayLoanAhmedabad() {
  return (
    <>
      <CitiesHero
        location="Ahmedabad"
        isCity={true}
        loanDesc={
          <>
            Need urgent cash for emergency needs,like medical bills, marriage
            expenses, short trips, or home renovations? Our insta personal loans
            have you covered, and you don&apos;t need to wait for your next
            payday.
          </>
        }
        heroImg="/cities/ahmedabad.png"
      />
      <LoanQuestionCard
        heading="What makes LoanInNeed the best Insta Loan provider in Ahmedabad?"
        imageUrl="/use-cases/loan-docs.png"
        ticks={[
          "No collateral required",
          "Low Interest Rate",
          "Early repayment allowed",
          "Simple online process",
        ]}
      />
      <CitiesUseCases
        location="Ahmedabad"
        locationUseCaseData={locationUseCaseData}
      />
      <HowItWorks loanType="personal" />
      <EligibilityMandatoryGrid
        spanTitle={eligibilityCriteria.spanTitle}
        title={eligibilityCriteria.title}
        titleColoured={eligibilityCriteria.titleColoured}
        desc={eligibilityCriteria.desc}
        elimangridData={eligibilityCriteria.criteria}
      />
      <LoanCalculator />
      <EligibilityMandatoryGrid
        spanTitle={mandatoryDocuments.spanTitle}
        title={mandatoryDocuments.title}
        titleColoured={mandatoryDocuments.titleColoured}
        desc={mandatoryDocuments.desc}
        elimangridData={mandatoryDocuments.criteria}
      />
      <FAQSection faqData={medicalLoanFAQ} />
    </>
  );
}
