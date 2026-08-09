export interface Email {
  email_id: string;
  thread_id: string;
  message_index: number;
  from_name: string;
  from_email: string;
  to: string;
  cc: string[];
  subject: string;
  body: string;
  received_at: string;
  attachments: string[];
  is_reply: boolean;
}

export function generateSampleEmails(): Email[] {
  const emails: Email[] = [];

  // Add the 12 worked examples from the prompt
  // Example 1 — Clean enterprise RFP
  emails.push({
    email_id: "em_00001",
    thread_id: "th_0091",
    message_index: 0,
    from_name: "Suresh Kulkarni",
    from_email: "s.kulkarni@meridiansteel.co.in",
    to: "sales@company.com",
    cc: ["procurement@meridiansteel.co.in"],
    subject: "RFP - Enterprise Document Management System",
    body: "Dear Team,\n\nMeridian Steel invites proposals for an enterprise DMS covering 4 plants and ~1,200 users. Indicative budget is Rs. 25 lakhs. Proposals must reach us by 12th August 2026.\n\nWarm regards,\nSuresh Kulkarni\nMeridian Steel Pvt Ltd",
    received_at: "2026-08-01T09:14:22+05:30",
    attachments: ["RFP_DMS_2026.pdf"],
    is_reply: false
  });

  // Example 2 — SMB demo request
  emails.push({
    email_id: "em_00002",
    thread_id: "th_0092",
    message_index: 0,
    from_name: "Ankit Bose",
    from_email: "ankit@railyardlogistics.in",
    to: "sales@company.com",
    cc: [],
    subject: "Quick demo request",
    body: "Hi, we're a 30-person logistics startup in Pune... can we get a demo sometime next week? Nothing urgent. — Ankit Bose, Founder, Railyard Logistics",
    received_at: "2026-08-01T11:02:15+05:30",
    attachments: [],
    is_reply: false
  });

  // Example 3 — BHEL PSU tender
  emails.push({
    email_id: "em_00003",
    thread_id: "th_0093",
    message_index: 0,
    from_name: "Tender Desk",
    from_email: "tenders@bhel.in",
    to: "sales@company.com",
    cc: [],
    subject: "Tender Notice No. BHEL/PROC/2026/0847",
    body: "Tender Notice No. BHEL/PROC/2026/0847. Bharat Heavy Electricals Limited invites bids for supply of analytics software licences. Estimated value: Rs. 6,50,000. Last date for bid submission: 03-08-2026, 1700 hrs IST.",
    received_at: "2026-08-01T14:20:00+05:30",
    attachments: ["BHEL_Specs.zip"],
    is_reply: false
  });

  // Example 4 — Marketing sponsorship
  emails.push({
    email_id: "em_00004",
    thread_id: "th_0094",
    message_index: 0,
    from_name: "Nandita Reddy",
    from_email: "nandita@saassummit.in",
    to: "sales@company.com",
    cc: [],
    subject: "Sponsorship confirmation needed",
    body: "We're finalising sponsors for the India SaaS Summit in Bengaluru. Gold tier is ₹4,00,000 and includes a keynote slot. We need confirmation by tomorrow EOD as we're going to print. — Nandita Reddy, Sponsorship Lead",
    received_at: "2026-08-02T16:45:00+05:30",
    attachments: ["Sponsorship_Deck.pdf"],
    is_reply: false
  });

  // Example 5 — Finance invoice
  emails.push({
    email_id: "em_00005",
    thread_id: "th_0095",
    message_index: 0,
    from_name: "Accounts Payable",
    from_email: "ap@vantagecloud.com",
    to: "sales@company.com",
    cc: [],
    subject: "Overdue Invoice INV-2026-0331 - Net 30",
    body: "Please find attached invoice INV-2026-0331 for Rs. 1,18,000 (incl. 18% GST) against PO-88214. Kindly process — payment terms were Net 30 and this is now 12 days overdue. Also, our GSTIN has changed, updated details attached. — Vantage Cloud Services",
    received_at: "2026-08-03T10:00:00+05:30",
    attachments: ["INV-2026-0331.pdf", "GSTIN_Updated.pdf"],
    is_reply: false
  });

  // Example 6 — Alliances partnership
  emails.push({
    email_id: "em_00006",
    thread_id: "th_0096",
    message_index: 0,
    from_name: "Zayn Malik",
    from_email: "z.malik@zenithcloud.com",
    to: "sales@company.com",
    cc: [],
    subject: "Partnership Exploration - MEA Region",
    body: "We're a Salesforce implementation partner across MEA with 40+ enterprise clients. We'd like to explore reselling your platform in the region, or a technical integration at minimum. Who handles partnerships? — Zenith Cloud Partners",
    received_at: "2026-08-03T12:00:00+05:30",
    attachments: [],
    is_reply: false
  });

  // Example 7 — Out of Office (OOO)
  emails.push({
    email_id: "em_00007",
    thread_id: "th_0091",
    message_index: 1,
    from_name: "Suresh Kulkarni",
    from_email: "s.kulkarni@meridiansteel.co.in",
    to: "sales@company.com",
    cc: [],
    subject: "Automatic Reply: RFP - Enterprise Document Management System",
    body: "I am out of office until 14th August with limited access to email. For urgent matters please contact my colleague at raghav@northbridge.in. — Sent from Outlook",
    received_at: "2026-08-03T08:00:00+05:30",
    attachments: [],
    is_reply: true
  });

  // Example 8 — Vendor spam
  emails.push({
    email_id: "em_00008",
    thread_id: "th_0098",
    message_index: 0,
    from_name: "Growth Agency SEO",
    from_email: "sales@growthagency.com",
    to: "sales@company.com",
    cc: [],
    subject: "3x your traffic in 90 days",
    body: "Hi, I noticed your website isn't ranking on page 1 for key terms. We've helped 200+ SaaS companies 3x their organic traffic. We do content marketing, PR outreach, and webinar promotion. Free audit attached — interested in a quick 15 min call?",
    received_at: "2026-08-04T09:00:00+05:30",
    attachments: ["Free_SEO_Audit.pdf"],
    is_reply: false
  });

  // Example 9 — Newsletter
  emails.push({
    email_id: "em_00009",
    thread_id: "th_0099",
    message_index: 0,
    from_name: "B2B Growth Weekly",
    from_email: "newsletter@b2bgrowth.com",
    to: "sales@company.com",
    cc: [],
    subject: "B2B Growth Weekly — Issue #212",
    body: "The B2B Growth Weekly — Issue #212. In this edition: why PLG is stalling, 5 pricing experiments that worked, and a teardown of Figma's onboarding. [Unsubscribe]",
    received_at: "2026-08-04T15:30:00+05:30",
    attachments: [],
    is_reply: false
  });

  // Example 10 — Thread Reply (PATCH)
  emails.push({
    email_id: "em_00010",
    thread_id: "th_0091",
    message_index: 2,
    from_name: "Suresh Kulkarni",
    from_email: "s.kulkarni@meridiansteel.co.in",
    to: "sales@company.com",
    cc: ["procurement@meridiansteel.co.in"],
    subject: "Re: RFP - Enterprise Document Management System",
    body: "Correction to our earlier note — the board has approved an increased budget of Rs. 32 lakhs, and the submission deadline is advanced to 11th August. Apologies for the change.\n\nFrom: Suresh Kulkarni <s.kulkarni@meridiansteel.co.in>\nTo: sales@company.com\nSent: 2026-08-01\nSubject: RFP - Enterprise Document Management System...",
    received_at: "2026-08-09T09:15:00+05:30",
    attachments: [],
    is_reply: true
  });

  // Example 11 — Genuinely ambiguous
  emails.push({
    email_id: "em_00011",
    thread_id: "th_0101",
    message_index: 0,
    from_name: "Farhan Qureshi",
    from_email: "farhan@halcyonretail.com",
    to: "sales@company.com",
    cc: [],
    subject: "Booth Follow-up - Mumbai Event",
    body: "Hi — we met at your booth in Mumbai. Two things: (1) we'd like to evaluate your platform for our 800-person org, budget TBD but likely significant, and (2) our CMO wants to co-host a webinar with your team in September. Can you loop in the right people? — Farhan Qureshi, VP Strategy, Halcyon Retail",
    received_at: "2026-08-05T10:00:00+05:30",
    attachments: [],
    is_reply: false
  });

  // Example 12 — Hinglish, informal, value in shorthand
  emails.push({
    email_id: "em_00012",
    thread_id: "th_0102",
    message_index: 0,
    from_name: "Vikas Agarwal",
    from_email: "vikas@dealerplus.in",
    to: "sales@company.com",
    cc: [],
    subject: "product enquiry check",
    body: "Bhai, humko aapka product chahiye for our dealer network. Around 150 users honge. Budget approx 1.2 cr allocated hai for this FY. Kab connect kar sakte hain? Thoda jaldi, board review 20th ko hai.",
    received_at: "2026-08-05T14:10:00+05:30",
    attachments: [],
    is_reply: false
  });

  // Now, dynamically generate another 238 emails to complete 250 emails.
  // We use templates of different types.
  
  const companies = [
    { name: "Reliance Jio", domain: "jio.com", valueStr: "Rs 45 Lakhs", numeric: 4500000 },
    { name: "Tata Steel", domain: "tatasteel.com", valueStr: "Rs 80,000,00", numeric: 8000000 },
    { name: "Tech Mahindra", domain: "techmahindra.com", valueStr: "1.5 crores", numeric: 15000000 },
    { name: "HDFC Bank", domain: "hdfcbank.com", valueStr: "₹50,00,000", numeric: 5000000 },
    { name: "Zomato", domain: "zomato.com", valueStr: "2.1 Cr", numeric: 21000000 },
    { name: "L&T Construction", domain: "lntecc.com", valueStr: "Rs. 3 Crores", numeric: 30000000 },
    { name: "Swiggy", domain: "swiggy.in", valueStr: "8,50,000 INR", numeric: 850000 },
    { name: "Paytm", domain: "paytm.com", valueStr: "Rs. 15,00,000", numeric: 1500000 },
    { name: "Ola Electric", domain: "olaelectric.in", valueStr: "Rs 1.8 Cr", numeric: 18000000 },
    { name: "Zerodha", domain: "zerodha.com", valueStr: "Rs 75 Lakhs", numeric: 7500000 }
  ];

  const smbCompanies = [
    { name: "Nandi Organics", domain: "nandiorganics.in" },
    { name: "Superfast Courier", domain: "superfast.co.in" },
    { name: "Apex Design Labs", domain: "apexdesign.in" },
    { name: "Chai Point franchisee", domain: "chaipoint.in" },
    { name: "Bose Electricals", domain: "boseelectricals.com" },
    { name: "Vasco Logistics", domain: "vascologistics.net" },
    { name: "Delhi Bakery", domain: "delhibakery.com" },
    { name: "Apex Legal Partners", domain: "apexlegal.co.in" }
  ];

  const firstNames = ["Rajesh", "Pooja", "Rahul", "Aisha", "Kunal", "Sneha", "Aditya", "Neha", "Vikram", "Shreya", "Rohan", "Tanvi"];
  const lastNames = ["Sharma", "Patel", "Mehta", "Joshi", "Sen", "Gupta", "Deshmukh", "Nair", "Verma", "Rao", "Reddy", "Singh"];

  for (let i = 13; i <= 250; i++) {
    const threadNum = Math.floor(100 + i);
    const threadId = `th_${threadNum}`;
    const emailId = `em_${String(i).padStart(5, '0')}`;
    const day = Math.floor(1 + (i % 28));
    const receivedAt = `2026-08-${String(day).padStart(2, '0')}T${String(10 + (i % 8)).padStart(2, '0')}:${String(10 + (i % 40)).padStart(2, '0')}:00+05:30`;
    
    // Distribute categories
    const r = i % 7;
    
    if (r === 0) {
      // Enterprise RFP
      const company = companies[i % companies.length];
      const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@${company.domain}`;
      const hasDeadline = i % 3 === 0;
      const deadlineDate = `2026-08-${String(day + 4).padStart(2, '0')}`;
      
      emails.push({
        email_id: emailId,
        thread_id: threadId,
        message_index: 0,
        from_name: name,
        from_email: email,
        to: "sales@company.com",
        cc: [],
        subject: `RFP Submission - Enterprise licensing for ${company.name}`,
        body: `Dear Team,\n\nWe are pleased to invite your bid for the license deployment across ${company.name}. The scope details are attached. Our allocated budget is estimated at around ${company.valueStr}.${hasDeadline ? ` The deadline for submission is strict: ${deadlineDate}.` : ' Sometime next week is fine for initial drafts.'}\n\nBest Regards,\n${name}\nProcurement Head`,
        received_at: receivedAt,
        attachments: ["RFP_Scope.pdf"],
        is_reply: false
      });
    } else if (r === 1) {
      // SMB Demo / Product enquiry
      const company = smbCompanies[i % smbCompanies.length];
      const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@${company.domain}`;
      
      emails.push({
        email_id: emailId,
        thread_id: threadId,
        message_index: 0,
        from_name: name,
        from_email: email,
        to: "sales@company.com",
        cc: [],
        subject: "Product pricing and demo info",
        body: `Hi Sales team,\n\nWe are looking to upgrade our team tools. Can you share the pricing sheet for 20 users? Also would love to hop on a short demo call if someone is free next week. Thanks!\n\n${name}\n${company.name}`,
        received_at: receivedAt,
        attachments: [],
        is_reply: false
      });
    } else if (r === 2) {
      // Marketing
      const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@marketingevents.co.in`;
      
      emails.push({
        email_id: emailId,
        thread_id: threadId,
        message_index: 0,
        from_name: name,
        from_email: email,
        to: "sales@company.com",
        cc: [],
        subject: "Co-marketing and Webinar proposal - Q3",
        body: `Hello Team,\n\nWe represent the Tech Leadership Forum. We are planning a panel webinar on AI Operations in September. We'd love to invite your VP of Product to speak, and explore standard sponsorship opportunities (starts at Rs. 2,00,000). Let us know your thoughts.\n\nCheers,\n${name}`,
        received_at: receivedAt,
        attachments: ["TLF_Sponsorship_Details.pdf"],
        is_reply: false
      });
    } else if (r === 3) {
      // Alliances
      const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@partnerlabs.io`;
      
      emails.push({
        email_id: emailId,
        thread_id: threadId,
        message_index: 0,
        from_name: name,
        from_email: email,
        to: "sales@company.com",
        cc: [],
        subject: "Integration Partnership and Channel Sales Proposal",
        body: `Dear Business Development,\n\nI am reaching out from PartnerLabs. We build connectors for enterprise CRM networks. We would love to build a custom tech integration for your platform, allowing your users to sync data instantly. We also have a channel resell referral structure. Let us know who handles partner relations.\n\nSincerely,\n${name}`,
        received_at: receivedAt,
        attachments: [],
        is_reply: false
      });
    } else if (r === 4) {
      // Finance
      const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const email = `${name.toLowerCase().replace(" ", ".")}@vendor-finance.com`;
      const isUrgent = i % 2 === 0;
      
      emails.push({
        email_id: emailId,
        thread_id: threadId,
        message_index: 0,
        from_name: name,
        from_email: email,
        to: "sales@company.com",
        cc: [],
        subject: `Pending Invoice Payment Reminder ${isUrgent ? ' - OVERDUE' : ''}`,
        body: `Hi Team,\n\nThis is a friendly reminder that invoice VEND-2026-${i} is currently unpaid. ${isUrgent ? 'The payment terms were Net 15 and it is now 8 days overdue. Please process on priority to avoid service suspension.' : 'Kindly process at your earliest convenience. Details attached.'}\n\nThanks,\nFinance Team`,
        received_at: receivedAt,
        attachments: [`VEND_2026_${i}.pdf`],
        is_reply: false
      });
    } else if (r === 5) {
      // OOO or newsletter (Ignored)
      if (i % 2 === 0) {
        // Out of office
        emails.push({
          email_id: emailId,
          thread_id: threadId,
          message_index: 1,
          from_name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
          from_email: `user${i}@clientcorp.com`,
          to: "sales@company.com",
          cc: [],
          subject: "Out of Office AutoReply",
          body: "Thank you for your email. I am currently out of office on annual leave returning August 24. For urgent issues please reach out to support@clientcorp.com. Cheers.",
          received_at: receivedAt,
          attachments: [],
          is_reply: true
        });
      } else {
        // Newsletter
        emails.push({
          email_id: emailId,
          thread_id: threadId,
          message_index: 0,
          from_name: "SaaS Ops Newsletter",
          from_email: "no-reply@saasopsnews.com",
          to: "sales@company.com",
          cc: [],
          subject: "SaaS Ops Insights #44: How to scale customer success",
          body: "Welcome to SaaS Ops Insights. In this issue: how we cut churn by 4%, the latest metrics from public SaaS firms, and a list of open job roles. [Unsubscribe from list]",
          received_at: receivedAt,
          attachments: [],
          is_reply: false
        });
      }
    } else {
      // Spam / SEO Sales Pitch (Ignored)
      emails.push({
        email_id: emailId,
        thread_id: threadId,
        message_index: 0,
        from_name: "Digital Leads Team",
        from_email: "info@leadgen-india.com",
        to: "sales@company.com",
        cc: [],
        subject: "High-quality B2B Sales Leads - Lead Generation Services",
        body: "Hello,\n\nWe provide verified lead lists for B2B tech companies in India. We can supply 500 decision maker contacts per month tailored to your sector. Let us know if you want a free sample sheet of 20 leads. Can we schedule a brief 10 min presentation call next Tuesday?\n\nRegards,\nLeadGen Services Team",
        received_at: receivedAt,
        attachments: [],
        is_reply: false
      });
    }
  }

  return emails;
}
