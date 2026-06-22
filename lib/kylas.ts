// CRM Integration Helper
export const getKylasSalaryRange = (salary: number) => {
  if (salary <= 50000) return "₹35,000 - ₹50,000";
  if (salary <= 100000) return "₹50,000 - ₹1,00,000";
  return "₹1,00,000 and above";
};

export const getKylasLoanAmountRange = (amount: number) => {
  if (amount <= 5000) return "₹5,000";
  if (amount <= 10000) return "₹10,000";
  if (amount <= 15000) return "₹15,000";
  if (amount <= 20000) return "₹20,000";
  if (amount <= 25000) return "₹25,000";
  if (amount <= 30000) return "₹30,000";
  if (amount <= 40000) return "₹40,000";
  if (amount <= 50000) return "₹50,000";
  if (amount <= 75000) return "₹75,000";
  return "₹1,00,000";
};

export const submitLeadToKylas = async (personalData: any, phone: string, basicDetails: any, leadId?: number): Promise<number | undefined> => {
  try {
    const loanAmount = basicDetails?.loanAmount || 0;
    const salary = Number(basicDetails?.monthlyIncome) || Number(basicDetails?.monthlySalaryRange) || 30000;
    const city = basicDetails?.city || "";
    
    const kylasPayload = {
      ownerId: 72388,
      firstName: personalData?.firstName || personalData?.name?.split(" ")[0] || "",
      lastName: personalData?.lastName || personalData?.name?.split(" ").slice(1).join(" ") || "",
      phoneNumbers: [
        {
          type: "MOBILE",
          code: "IN",
          value: phone || "",
          dialCode: "+91",
          primary: true
        }
      ],
      salutation: null,
      emails: personalData?.email ? [
        {
          type: "OFFICE",
          value: personalData.email,
          primary: true
        }
      ] : [],
      timezone: "Asia/Kolkata",
      city: city,
      state: "",
      zipcode: "",
      country: "IN",
      department: "",
      dnd: false,
      facebook: "",
      twitter: "",
      linkedIn: "",
      address: basicDetails?.currentAddress || "",
      companyName: basicDetails?.companyName || "",
      designation: "",
      companyAddress: basicDetails?.companyAddress || "",
      companyCity: "",
      companyState: "",
      companyZipcode: "",
      companyCountry: "IN",
      companyEmployees: null,
      companyAnnualRevenue: null,
      companyWebsite: "",
      companyPhones: [],
      companyIndustry: "",
      companyBusinessType: "",
      requirementName: `Loan Amount: ${loanAmount}`,
      requirementCurrency: "INR",
      requirementBudget: loanAmount ? Number(loanAmount) : null,
      products: [],
      campaign: 2688093,
      customFieldValues: {
        ...(personalData?.panNumber ? { cfPan: personalData.panNumber } : {}),
        ...(personalData?.aadhaarNumber ? { cfAadhar: Number(personalData.aadhaarNumber.replace(/\D/g, '')) } : {}),
        cfCibilScoreRange: 2669967,
        cfSalary: 2812268
      },
      source: 2650535,
      subSource: "Website Lead",
    };

    const url = process.env.NEXT_PUBLIC_KYLAS_API;
    const apiKey = process.env.NEXT_PUBLIC_LEAD_API_KEY;

    if (!url || !apiKey) {
      console.warn("⚠️ Kylas API credentials missing in environment variables. Lead not submitted.");
      return;
    }

    // console.log("🗻🗻🗻🗻🗻 KYLAS PAYLOAD (OUTBOUND) 🗻🗻🗻🗻🗻\n", JSON.stringify(kylasPayload, null, 2));

    if (leadId) {
      // Update existing lead
      const getRes = await fetch(`${url}/v1/leads/${leadId}`, {
        method: "GET",
        headers: { "api-key": apiKey }
      });
      if (!getRes.ok) throw new Error(`GET failed: ${getRes.status}`);
      const existingLead = await getRes.json();
      
      const updatedLead = { ...existingLead, ...kylasPayload };
      
      const res = await fetch(`${url}/v1/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "api-key": apiKey },
        body: JSON.stringify(updatedLead)
      });
      
      if (!res.ok) {
        console.error("❌ Kylas PUT failed:", await res.text());
        throw new Error(`PUT failed: ${res.status}`);
      }
      
      if (res.status === 200) {
        console.log(`🗻🗻🗻🗻🗻 Kylas Response 200: Lead ${leadId} updated successfully 🗻🗻🗻🗻🗻`);
      } else {
        console.log(`🗻🗻🗻🗻🗻 Kylas Response ${res.status}: Lead ${leadId} updated 🗻🗻🗻🗻🗻`);
      }
      
      console.log("Jai Kailashpati🕉️");
      return leadId;
    } else {
      // Create new lead
      const res = await fetch(`${url}/v1/leads/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": apiKey },
        body: JSON.stringify(kylasPayload)
      });
      
      if (!res.ok) {
        console.error("❌ Kylas POST failed:", await res.text());
        throw new Error(`POST failed: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (res.status === 200 || res.status === 201) {
        console.log(`🗻🗻🗻🗻🗻 Kylas Response ${res.status}: Lead submitted successfully 🗻🗻🗻🗻🗻`);
        console.log("Response Data:", data);
      }
      
      console.log("Jai Kailashpati🕉️");
      return data.id; // Return the created lead ID
    }
  } catch (error) {
    console.error("❌ Error submitting to Kylas API:", error);
    console.log("Jai Kailashpati🕉️ (With Errors)");
    return undefined;
  }
};
