import {
  BriefcaseMedical,
  CircleQuestionMarkIcon,
  GraduationCap,
  House,
  ScatterChartIcon,
} from "lucide-react";
import { FAQItem } from "./types";

export const benefitTabsData = [
  {
    tabName: "Medical Emergency Loan",
    value: "medical-emergency-loan",
    tabIcon: <BriefcaseMedical />,
    title:
      "Instant insta medical emergency loan - quick cash for urgent Healthcare Needs",
    description: (
      <>
        When sudden medical expenses arise, waiting for insurance claims or
        arranging money from friends can delay critical treatment.
        <br />
        <br />A insta medical emergency loan provides immediate funds so you can
        pay hospital bills, buy medicines, or handle surgery costs without
        stress. It&apos;s the fastest way to secure financial support during
        health emergencies.
      </>
    ),
    imageUrl: "/benefits-tab/medical-emergency-loan-doctor-tab-min.png",
    link: "/signup",
  },
  {
    tabName: "Utility Bill Loan",
    value: "utility-bill-loan",
    tabIcon: <ScatterChartIcon />,
    title:
      "Affordable travel loans for your dream vacation - flexible plans, low interest rates",
    description: (
      <>
        Don&apos;t let finances hold you back from exploring the world. Our
        travel loans offer competitive interest rates and flexible repayment
        options, making it easier than ever to fund your next adventure.
        <br />
        <br />
        Whether it&apos;s a family vacation, honeymoon, or solo trip, we provide
        the financial support you need to make your travel dreams a reality.
      </>
    ),
    imageUrl: "/utility.png",
    link: "/signup",
  },
  {
    tabName: "House Rent Loan",
    value: "house-rent-loan",
    tabIcon: <House />,
    title:
      "Make your special day unforgettable with our wedding loans - easy approvals, flexible terms",
    description: (
      <>
        Planning a wedding can be expensive, but our wedding loans help you
        cover costs without stress.
        <br />
        <br />
        From venue bookings to catering and decorations, we provide quick and
        easy financing options so you can focus on creating beautiful memories
        without worrying about the budget.
      </>
    ),
    imageUrl: "/rent.png",
    link: "/signup",
  },
  {
    tabName: "Education Purpose",
    value: "education-purpose",
    tabIcon: <GraduationCap />,
    title:
      "Transform your living space with our home renovation loans - low rates, flexible repayment",
    description: (
      <>
        Whether it&apos;s a kitchen upgrade, bathroom remodel, or adding a new
        room, our home renovation loans provide the funds you need to enhance
        your home&apos;s value and comfort.
        <br />
        <br />
        With competitive interest rates and customizable repayment plans, we
        make it easy to finance your home improvement projects.
      </>
    ),
    imageUrl: "/education.png",
    link: "/signup",
  },
  {
    tabName: "Daily Expenses Loan",
    value: "daily-expenses-loan",
    tabIcon: <BriefcaseMedical />,
    title:
      "Simplify your finances with our debt consolidation loans - lower interest, single payment",
    description: (
      <>
        Managing multiple debts can be overwhelming. Our debt consolidation
        loans help you combine all your debts into one manageable monthly
        payment, often at a lower interest rate.
        <br />
        <br />
        This not only simplifies your finances but can also save you money in
        the long run, making it easier to achieve financial freedom.
      </>
    ),
    imageUrl: "/expense.png",
    link: "/signup",
  },
  {
    tabName: "Debt Payment Loan",
    value: "debt-payment-loan",
    tabIcon: <CircleQuestionMarkIcon />,
    title:
      "Invest in your future with our education loans - flexible terms, low interest rates",
    description: (
      <>
        Pursuing higher education can be costly, but our education loans provide
        the financial support you need to achieve your academic goals.
        <br />
        <br />
        With competitive interest rates and flexible repayment options, we make
        it easier for you to focus on your studies without worrying about
        finances.
      </>
    ),
    imageUrl: "/debt.png",
    link: "/signup",
  },
];

export const homeFAQdata: FAQItem[] = [
  {
    question: "How fast will my loan be approved?",
    answer:
      "Most applications are approved within 2 minutes. Once approved, the money is usually in your account within 10 minutes.",
  },
  {
    question: "Do I need a high credit score to apply?",
    answer:
      "Not at all. We focus on your current income and repayment ability rather than your past credit score.",
  },
  {
    question: "What's the maximum loan amount I can get?",
    answer:
      "You can borrow from ₹5,000 up to ₹2,00,000, depending on your eligibility.",
  },
  {
    question: "Is collateral needed for this loan?",
    answer: "No, there's no need to provide any security or guarantor.",
  },
  {
    question: "Can I still apply if my CIBIL score is low?",
    answer:
      "Yes, you can. Even with a score below 600, we'll consider your application based on your present financial status.",
  },
  {
    question: "What documents are required?",
    answer:
      "Just the basics - identity proof, address proof, and income proof. No long forms or unnecessary paperwork.",
  },
  {
    question: "What interest rates do you charge?",
    answer:
      "Rates start at 24% per annum, and we keep everything transparent with no hidden fees.",
  },
  {
    question: "Can I repay the loan early?",
    answer:
      "Yes, you can close your loan anytime. Paying it off early helps reduce your interest costs.",
  },
];

export const cardBenefits = [
  {
    iconImg: "/icons/icon1.png",
    title: "100% Digital Process",
    description:
      "Our loan with less paperwork approach eliminates branch visits and document hassles.",
  },
  {
    iconImg: "/icons/icon2.png",
    title: "Transparent Loan Terms",
    description:
      "No hidden charges in our insta loans. What you see is what you pay.",
  },
  {
    iconImg: "/icons/icon3.png",
    title: "Instant Loan Approval",
    description:
      "You don't have to stand in long queues. Get instant loan approvals in less than 2 hours!",
  },
  {
    iconImg: "/icons/icon4.png",
    title: "Flexible Repayment",
    description:
      "Choose repayment terms from 30 to 45 days. Pay back your loan at your convenience.",
  },
  {
    iconImg: "/icons/icon5.png",

    title: "24/7 Customer Support",
    description:
      "Get help with your loan. Our team assists with instant loan approval queries round the clock",
  },
  {
    iconImg: "/icons/icon6.png",
    title: "Best Interest Rates",
    description:
      "We assure you the best of interest rates available in the market, with no hidden costs!",
  },
  {
    iconImg: "/icons/icon7.png",
    title: "Regulated & Trustworthy",
    description:
      "RBI-licensed personal loan provider with grievance support, and transparent terms.",
  },
  {
    iconImg: "/icons/icon8.png",
    title: "Secure transactions",
    description: "End-to-end encryption for all transactions.",
  },
];

export const missionVision = [
  {
    iconImg: "/icons/mission-vission.png",
    title: "Our Mission",
    description:
      "We want you to feel safe and supported when you need money the most. With fast approval, simple steps and fair repayment plans, we make borrowing easy.",
  },
  {
    iconImg: "/icons/mission-vission.png",
    title: "Our Vision",
    description:
      "We dream of a time when anyone in India can get personal loans fast and safely, without long waits or complicated paperworks. Just a few clicks, quick support, and money into your bank account",
  },
];

export const aboutFAQdata: FAQItem[] = [
  {
    question: "What is LoanInNeed?",
    answer:
      "LoanInNeed is a digital lending platform that provides quick salary-based loans to help you manage urgent financial needs and improve your financial health.",
  },
  {
    question: "What types of loans does LoanInNeed offer?",
    answer:
      "We offer instant salary loans and insta personal loans designed for emergencies, bills, or other quick financial requirements.",
  },
  {
    question: "What is a payday loan?",
    answer:
      "It's a insta loan given against your salary to meet urgent financial needs, disbursed quickly and repaid easily.",
  },
  {
    question: "What is the repayment tenure of a payday loan?",
    answer:
      "Our repayment terms are flexible and can be customized based on your needs, usually ranging from 30-40 days.",
  },
  {
    question: "Is a guarantor or collateral required for an Insta loan?",
    answer:
      "No, you don’t need any guarantor or collateral to apply for our loans.",
  },
  {
    question: "What are the interest rates for a payday loan?",
    answer:
      "Interest rates are transparent and depend on your profile and loan amount. You'll see all charges upfront before applying.",
  },
  {
    question: "What is a Credit Builder Loan?",
    answer:
      "It's a small loan designed to help you build or improve your credit score by repaying on time.",
  },
  {
    question: "Who can benefit from a Credit Builder Loan?",
    answer:
      "Anyone looking to start their credit journey or repair their credit score.",
  },
  {
    question: "How can I repay the Credit Builder Loan?",
    answer: "You can repay it through monthly auto-debit or online transfers.",
  },
  {
    question: "Can the Credit Builder Loan be closed early?",
    answer:
      "Yes! You can close it early with minimal or no extra charges, depending on the terms.",
  },
  {
    question: "Can multiple loans be applied for at the same time?",
    answer:
      "No, you can only have one active loan at a time to ensure easy repayment.",
  },
  {
    question: "What if my loan application is not approved?",
    answer:
      "We'll share the reason with you, and you can reapply after improving your eligibility.",
  },
  {
    question: "What happens in case of a delayed EMI payment?",
    answer:
      "A small late fee may apply, and delays can impact your credit score.",
  },
  {
    question: "Can the loan be prepaid or foreclosed?",
    answer: "Yes, you can prepay or foreclose your loan anytime.",
  },
  {
    question: "What is the charge for a bounced EMI?",
    answer: "A nominal bounce charge may apply if your EMI payment fails.",
  },
  {
    question: "Where can loan details be tracked?",
    answer:
      "All your loan details, EMI schedule, and payment history are available on your dashboard.",
  },
];

export const personalLoanFAQdata: FAQItem[] = [
  {
    question: "How to Apply for a Personal Loan with LoanInNeed?",
    answer:
      "Applying for a loan with LoanInNeed is simple and fast. Start by visiting the official website and choose the type of loan you need. Fill in your basic details such as name, income, contact information, and desired loan amount. Next, upload the required documents like identity proof, address proof, and income proof. You can also check your eligibility using the online calculator to know how much you can borrow. Once you submit the application, it is quickly processed, and upon approval, the loan amount is disbursed directly to your bank account.",
  },
  {
    question:
      "What is the minimum CIBIL score required to get a personal loan?",
    answer: "To get a personal loan you must have a CIBIL score of 650+",
  },
  {
    question: "How much can I borrow with a personal loan?",
    answer:
      "Loan amounts typically range from a few thousand up to several lakhs, depending on your income, eligibility, and lender policies.",
  },
  {
    question: "What is the typical repayment tenure for personal loans?",
    answer:
      "Tenures generally range between 30-45 days depending upon your flexibility and convenience.",
  },
  {
    question: "Are personal loans secured or unsecured?",
    answer:
      "Personal loans are usually unsecured—no collateral is required. This makes them quick and convenient, and with low interest rates.",
  },
];

export const instaLoanFAQdata: FAQItem[] = [
  {
    question: "How to Apply for a Insta Loan with LoanInNeed?",
    answer:
      "Applying for a insta loan with LoanInNeed is simple and fast. Start by visiting the official website and choose the type of loan you need. Fill in your basic details such as name, income, contact information, and desired loan amount. Next, upload the required documents like identity proof, address proof, and income proof. You can also check your eligibility using the online calculator to know how much you can borrow. Once you submit the application, it is quickly processed, and upon approval, the loan amount is disbursed directly to your bank account.",
  },
  {
    question: "How much insta loan amount can I get with LoanInNeed?",
    answer:
      "You can get amounts ranging from ₹5,000 to ₹1,00,000, depending on your eligibility and lender's policies.",
  },
  {
    question: "What are the eligibility criteria for a insta personal loan?",
    answer:
      "Any salaried or self-employed individual with a stable income, valid ID proof, and a bank account can apply for a insta personal loan.",
  },
  {
    question: "How fast can I get the money?",
    answer:
      "Most insta personal loans are disbursed within a few minutes to 24 hours after your application is approved.",
  },
  {
    question: "What documents are required to apply for a insta Personal Loan?",
    answer:
      "Basic documents such as ID proof, address proof, income proof, and bank statements are usually required.",
  },
  {
    question: "Do I need a guarantor or collateral for a insta loan?",
    answer:
      "No, insta personal loans are unsecured loans and do not require any guarantor or collateral.",
  },
  {
    question: "What is the repayment period for a insta personal loan?",
    answer:
      "The repayment tenure usually ranges from 30-45 days as per your convenience.",
  },
  {
    question: "Can I repay my insta loan early?",
    answer:
      "Yes, LoanInNeed allows prepayment or foreclosure of the loan, though some may charge a small fee.",
  },
];

export const eligibilityCriteria = {
  spanTitle: "Eligibility check",
  title: "What are the eligibility criteria for",
  titleColoured: "personal loan?",
  desc: "Our instant loan process is designed for speed and convenience",
  criteria: [
    {
      iconImg: "/personal-insta-loan/age.png",
      itemTitle: "Age",
      itemDesc: "21 to 58 years",
    },
    {
      iconImg: "/personal-insta-loan/employment.png",
      itemTitle: "Employment",
      itemDesc: "Salaried professional having income more than ₹20,000",
    },
    {
      iconImg: "/personal-insta-loan/cibil.png",
      itemTitle: "CIBIL Score",
      itemDesc: "Preferably 650 or above for faster approval",
    },
  ],
};

export const mandatoryDocuments = {
  spanTitle: "Mandatory Documents",
  title: "Documents required to avail",
  titleColoured: "personal loan?",
  desc: "Our instant loan process is designed for speed and convenience",
  criteria: [
    {
      iconImg: "/personal-insta-loan/identity.png",
      itemTitle: "Identity Proof",
      itemDesc: "PAN Card & Aadhaar Card",
    },
    {
      iconImg: "/personal-insta-loan/income.png",
      itemTitle: "Income Proof",
      itemDesc: (
        <>
          Last 3 months&apos; salary slips
          <br />
          Last 6 months&apos; bank statements (salary account)
        </>
      ),
    },
    {
      iconImg: "/personal-insta-loan/house.png",
      itemTitle: "Address Proof",
      itemDesc: (
        <>
          If rented house - Rent Agreement
          <br />
          If own house - Electricity Bill
        </>
      ),
    },
  ],
};

export const medicalLoanFAQ = [
  {
    question: "What is a medical crisis loan?",
    answer:
      "A medical crisis loan is a quick personal loan designed to help you cover unexpected medical expenses such as hospitalization, surgery, medicines, or emergency treatments.",
  },
  {
    question: "How quickly can I get a medical emergency loan?",
    answer:
      "At LoanInNeed, your loan application can be approved within minutes, and the funds are disbursed quickly to ensure you get immediate financial support during emergencies.",
  },
  {
    question:
      "Do I need collateral or a guarantor for a Medical Emergency Loan?",
    answer:
      "No, our medical emergency loans are unsecured, meaning you do not need to provide collateral or a guarantor.",
  },
  {
    question:
      "What documents are required to apply for a Medical Emergency Loan?",
    answer:
      "You generally need to submit basic KYC documents such as ID proof, address proof, and income proof.",
  },
  {
    question: "Can I repay the medical loan early without penalties?",
    answer:
      "Yes, LoanInNeed offers flexible repayment options, including early repayment or foreclosure without heavy charges.",
  },
  {
    question:
      "What are the factors to be considered while applying for a personal loan for medical emergencies?",
    answer:
      "While applying for a personal loan for a medical emergency, you should first consider the loan application and disbursal process to ensure that you get the funds you need at the right time. In addition to that, you should check whether your health insurance policy covers the treatment you require, whether in full or part. Finally, you should consider the interest rate offered along with the repayment tenure to ensure that you can repay the loan comfortably over time.",
  },
  {
    question:
      "Where can I get the best Medical Emergency personal loan at lower interest?",
    answer:
      "At LoanInNeed get an instant medical emergency loan with an effortless application process. We offer lower interest loans without any collateral.",
  },
];

export const educationLoanFAQ = [
  {
    question: "What is an education purpose loan?",
    answer:
      "An education purpose loan is a insta personal loan designed to cover expenses like tuition fees, books, exam costs, or other study-related needs.",
  },
  {
    question: "How much loan amount can I get for Education Purpose?",
    answer:
      "The amount depends on your eligibility, income, and repayment capacity, usually ranging from a few thousand to several lakhs.",
  },
  {
    question: "Do I need to provide collateral for an Education Purpose Loan?",
    answer:
      "No, our insta education loans are unsecured and do not require any collateral.",
  },
  {
    question: "How fast is the approval process of Personal Education Loan?",
    answer:
      "Approval is quick and can often be completed within minutes, with funds disbursed shortly after approval.",
  },
  {
    question:
      "Who can be a guarantor for a personal loan for education in India?",
    answer:
      "Applicant’s parents or the legal guardians are allowed to apply as a guarantor to avail of a personal loan for education in India.",
  },
  {
    question:
      "Where can I get the best Education Purpose personal loan at lower interest?",
    answer:
      "At LoanInNeed get an instant educational personal loan with an effortless application process. We offer lower interest loans without any collateral.",
  },
];

export const medicalLoanUseCaseData = [
  {
    title: "Sudden illness or injury",
    description: "Requiring hospitalization or urgent treatment.",
  },
  {
    title: "Planned or unplanned surgeries",
    description: "Like appendicitis, gallbladder removal, or minor operations.",
  },
  {
    title: "Childbirth-related expenses",
    description: "Including normal delivery, C-section, or newborn care.",
  },
  {
    title: "High-cost medical tests or treatments",
    description: "Such as MRI, CT scans, or specialized therapies.",
  },
  {
    title: "Medical expenses not fully covered by insurance",
    description: "Like doctor's fees, room charges, or post-surgery care.",
  },
  {
    title: "Immediate purchase of medicines or medical equipment",
    description: "Needed for recovery at home.",
  },
];

export const locationUseCaseData = [
  {
    title: "Medical emergency loan",
    description:
      "Get instant funds to cover your urgent medical bills or hospital expenses without any delay.",
    iconUrl: "/cities/medical.png",
    pageLink: "/medical-emergency-loan",
  },
  {
    title: "Utility bill loan",
    description:
      "Get quick cash to pay your electricity, water, or internet bills on time, hassle-free.",
    iconUrl: "/cities/utility.png",
    pageLink: "/utility-bill-loan",
  },
  {
    title: "House rent loan",
    description:
      "Easily pay your monthly house rent with fast approval and flexible repayment options.",
    iconUrl: "/cities/house.png",
    pageLink: "/house-rent-loan",
  },
  {
    title: "Daily expense loan",
    description:
      "Manage your everyday essentials and household expenses with quick, insta funding.",
    iconUrl: "/cities/daily.png",
    pageLink: "/daily-expense-loan",
  },
  {
    title: "Education Purpose Loan",
    description:
      "Cover school fees, tuition, or other educational costs with an easy personal loan.",
    iconUrl: "/cities/education.png",
    pageLink: "/education-purpose-loan",
  },
  {
    title: "Debt consolidation loan",
    description:
      "Consolidate or repay your debts with a single, low-interest loan and stress-free terms.",
    iconUrl: "/cities/debt.png",
    pageLink: "/debt-consolidation-loan",
  },
];
