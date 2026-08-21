"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAffiliate } from "@/hooks/useAffiliate";
import { hasLoanApplication } from "@/lib/utils";
import FraudAlertTicker from "@/components/FraudAlertTicker";


const cities: { title: string; href: string; description: string }[] = [
  {
    title: "Mumbai",
    href: "/cities/payday-loan-in-mumbai",
    description: "Avail loans in Mumbai",
  },
  {
    title: "Delhi",
    href: "/cities/payday-loan-in-delhi",
    description: "Avail loans in Delhi",
  },
  {
    title: "Bengaluru",
    href: "/cities/payday-loan-in-bengaluru",
    description: "Avail loans in Bengaluru",
  },
  {
    title: "Hyderabad",
    href: "/cities/payday-loan-in-hyderabad",
    description: "Avail loans in Hyderabad",
  },
  {
    title: "Pune",
    href: "/cities/payday-loan-in-pune",
    description: "Avail loans in Pune",
  },
  {
    title: "Kolkata",
    href: "/cities/payday-loan-in-kolkata",
    description: "Avail loans in Kolkata",
  },
  {
    title: "Chennai",
    href: "/cities/payday-loan-in-chennai",
    description: "Avail loans in Chennai",
  },
  {
    title: "Chandigarh",
    href: "/cities/payday-loan-in-chandigarh",
    description: "Avail loans in Chandigarh",
  },
  {
    title: "Ahmedabad",
    href: "/cities/payday-loan-in-ahmedabad",
    description: "Avail loans in Ahmedabad",
  },
];

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  const { getLinkWithRef } = useAffiliate();
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={getLinkWithRef(href)} className="block p-2 rounded-md hover:bg-gray-100">
          <div className="text-sm font-medium">{title}</div>
          <p className="text-xs text-muted-foreground">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}


export default function Navbar() {
  const pathname = usePathname();
  const { getLinkWithRef } = useAffiliate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [dashboardLink, setDashboardLink] = React.useState("/dashboard");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [isProfileComplete, setIsProfileComplete] = React.useState(true);
  // Dashboard is only accessible once the user has at least one loan application.
  const [canAccessDashboard, setCanAccessDashboard] = React.useState(false);

  React.useEffect(() => {
    const userToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const partnerToken = typeof window !== 'undefined' ? localStorage.getItem('partnerAuthToken') : null;
    let timeoutId: NodeJS.Timeout;

    if (userToken) {
      setIsLoggedIn(true);
      setDashboardLink("/dashboard");
      
      // Load profile: enable the dashboard button only if the user has a loan application.
      import("@/lib/api").then(({ apiClient }) => {
        apiClient.getCompleteProfile().then(res => {
          setIsProfileComplete(true);
          const hasApp = hasLoanApplication(res?.profile);
          setCanAccessDashboard(hasApp);
          
          if (!hasApp) {
            timeoutId = setTimeout(() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              window.location.replace("/");
            }, 10 * 60 * 1000); // 10 minutes
          }
        }).catch(e => {
          console.error("Failed to load profile in navbar:", e);
          setIsProfileComplete(true);
          setCanAccessDashboard(false);
          
          timeoutId = setTimeout(() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.replace("/");
          }, 10 * 60 * 1000); // 10 minutes
        });
      });
    } else if (partnerToken) {
      setIsLoggedIn(true);
      setIsProfileComplete(true);
      // Partners (DSA/BC/Affiliate) have their own dashboards — always accessible.
      setCanAccessDashboard(true);
      const partnerDataStr = localStorage.getItem('partnerData');
      if (partnerDataStr) {
        try {
          const partnerData = JSON.parse(partnerDataStr);
          const type = partnerData.partnerType;
          // partnerType can be DSA, BC, AFFILIATE
          if (type === 'DSA') setDashboardLink("/dsa-dashboard");
          else if (type === 'BC') setDashboardLink("/bc-dashboard");
          else if (type === 'AFFILIATE') setDashboardLink("/affiliate-dashboard");
          else setDashboardLink("/dashboard");
        } catch (e) {
          console.error("Error parsing partner data", e);
          setDashboardLink("/dashboard");
        }
      } else {
        setDashboardLink("/dashboard");
      }
    } else {
      setIsLoggedIn(false);
      setIsProfileComplete(true);
      setCanAccessDashboard(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname]);

  // Helper: wrap Link to auto-close the sheet on mobile nav
  const MobileLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <Link
      href={getLinkWithRef(href)}
      className={className}
      onClick={() => setSheetOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <FraudAlertTicker />
      <nav className="w-full mx-auto py-3 px-4 sm:px-6 md:px-12 lg:px-24 bg-red-50 shadow-sm">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={getLinkWithRef("/")} className="flex items-center flex-shrink-0">
            <Image src="/lin-logo.png" alt="Logo" width={120} height={40} className="h-8 w-auto sm:h-10" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex">
            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <NavigationMenuLink asChild>
                      <Link href={getLinkWithRef("/personal-loan")}>Personal loan</Link>
                    </NavigationMenuLink>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-3 p-3">
                      <ListItem
                        href="/personal-loan/insta-loan"
                        title="Insta Loan"
                      >
                        Get an instant personal loan with quick approval.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Loan calculators</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-4 p-3">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link href={getLinkWithRef("/loan-calculators/personal-emi-calculator")}>
                            Personal EMI Calculator
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link href={getLinkWithRef("/loan-calculators/eligibility-loan-calculator")}>
                            Eligibility Loan Calculator
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link href={getLinkWithRef("/loan-calculators/loan-comparison-calculator")}>
                            Loan Comparison Calculator
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Cities</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-2 p-3 md:grid-cols-2 lg:grid-cols-3 w-[500px]">
                      {cities.map((c) => (
                        <ListItem key={c.title} title={c.title} href={c.href}>
                          {c.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-3">
                      <li>
                        <Link href={getLinkWithRef("/blog")}>Blogs</Link>
                      </li>
                      <li>
                        <Link href={getLinkWithRef("/about-us")}>About us</Link>
                      </li>
                      <li>
                        <Link href={getLinkWithRef("/careers")}>Careers</Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Support</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-3">
                      <li>
                        <Link href={getLinkWithRef("/contact-us")}>Contact us</Link>
                      </li>
                      <li>
                        <Link href={getLinkWithRef("/enquire-now")}>Enquire now</Link>
                      </li>
                      <li>
                        <Link href={getLinkWithRef("/track-loan")}>Track loan</Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {isLoggedIn ? (
                      canAccessDashboard ? (
                        <NavigationMenuItem>
                          <NavigationMenuTrigger className="text-red-600 font-semibold h-9 px-4 py-2 hover:bg-red-50 hover:text-red-700 data-[state=open]:bg-red-50 data-[active]:bg-red-50">
                            Account
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid w-[150px] gap-2 p-3">
                              <li>
                                <Link href={getLinkWithRef(dashboardLink)} className="block p-2 rounded-md hover:bg-gray-100 text-sm font-medium">
                                  Dashboard
                                </Link>
                              </li>
                              <li>
                                <button
                                  onClick={() => {
                                    localStorage.removeItem('authToken');
                                    localStorage.removeItem('userData');
                                    window.location.replace(getLinkWithRef("/"));
                                  }}
                                  className="w-full text-left block p-2 rounded-md hover:bg-red-50 text-red-600 text-sm font-medium transition-colors"
                                >
                                  Logout
                                </button>
                              </li>
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      ) : (
                        <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                localStorage.removeItem('authToken');
                                localStorage.removeItem('userData');
                                window.location.replace(getLinkWithRef("/"));
                              }}
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-semibold shadow-sm"
                            >
                              Logout
                            </Button>
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      )
                ) : (
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href={getLinkWithRef("/login")}>Login</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href={getLinkWithRef(isLoggedIn ? "/apply-now" : "/signup")}>
                      <Button size="default" variant="default" className="text-base">
                        Apply now
                      </Button>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>


          {/* Mobile Hamburger */}
          <div className="lg:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Image
                      src="/lin-logo.png"
                      alt="Logo"
                      width={120}
                      height={40}
                    />
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col space-y-2 px-4">
                  <Accordion type="multiple" className="w-full">
                    {/* Personal Loan */}
                    <AccordionItem value="personal-loan" className="border-b">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Personal Loan
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2 pl-3">
                          <MobileLink href="/personal-loan" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            All Personal Loans
                          </MobileLink>
                          <MobileLink href="/personal-loan/insta-loan" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Insta Loan
                          </MobileLink>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Loan Calculators */}
                    <AccordionItem value="calculators" className="border-b">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Loan Calculators
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2 pl-3">
                          <MobileLink href="/loan-calculators/personal-emi-calculator" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Personal EMI Calculator
                          </MobileLink>
                          <MobileLink href="/loan-calculators/eligibility-loan-calculator" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Eligibility Loan Calculator
                          </MobileLink>
                          <MobileLink href="/loan-calculators/loan-comparison-calculator" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Loan Comparison Calculator
                          </MobileLink>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Cities */}
                    <AccordionItem value="cities" className="border-b">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Cities
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2 pl-3">
                          {cities.map((city) => (
                            <MobileLink key={city.title} href={city.href} className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                              {city.title}
                            </MobileLink>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Learn */}
                    <AccordionItem value="learn" className="border-b">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Learn
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2 pl-3">
                          <MobileLink href="/blog" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Blogs
                          </MobileLink>
                          <MobileLink href="/about-us" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            About Us
                          </MobileLink>
                          <MobileLink href="/careers" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Careers
                          </MobileLink>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Support */}
                    <AccordionItem value="support" className="border-b-0">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Support
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2 pl-3">
                          <MobileLink href="/contact-us" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Contact Us
                          </MobileLink>
                          <MobileLink href="/enquire-now" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Enquire Now
                          </MobileLink>
                          <MobileLink href="/track-loan" className="text-sm text-gray-700 py-1.5 hover:text-primary transition-colors">
                            Track Loan
                          </MobileLink>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="pt-4 flex flex-col space-y-3">
                    {isLoggedIn ? (
                      canAccessDashboard ? (
                        <div className="flex flex-col space-y-2">
                          <MobileLink href={dashboardLink}>
                            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">Dashboard</Button>
                          </MobileLink>
                          <Button
                            variant="outline"
                            onClick={() => {
                              localStorage.removeItem('authToken');
                              localStorage.removeItem('userData');
                              window.location.replace(getLinkWithRef("/"));
                            }}
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Logout
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            localStorage.removeItem('authToken');
                            localStorage.removeItem('userData');
                            window.location.replace(getLinkWithRef("/"));
                          }}
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Logout
                        </Button>
                      )
                    ) : (
                      <MobileLink href="/login" className="text-sm font-medium py-2 hover:text-primary transition-colors">
                        Login
                      </MobileLink>
                    )}
                    <MobileLink href={isLoggedIn ? "/apply-now" : "/signup"} className="w-full">
                      <Button variant="default" className="w-full">Apply now</Button>
                    </MobileLink>
                  </div>
                </div>

              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
