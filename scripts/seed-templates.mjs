/**
 * Seed script: creates general contract templates and uploads them to
 * Supabase Storage, then inserts records into contract_templates table.
 *
 * Run:  node scripts/seed-templates.mjs
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "../node_modules/docx/dist/index.mjs";
import { readFileSync } from "fs";
import { createClient } from "../node_modules/@supabase/supabase-js/dist/index.mjs";

// ── Config ───────────────────────────────────────────────────────────────────
const env = readFileSync(".env", "utf8")
  .split("\n")
  .reduce((acc, line) => {
    const [k, ...v] = line.split("=");
    if (k && v.length) acc[k.trim()] = v.join("=").trim().replace(/^"|"$/g, "");
    return acc;
  }, {});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuY2l2a2NyaG95cGJ2dnBtZmdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA3MTkyNCwiZXhwIjoyMDk1NjQ3OTI0fQ.vS_QF3spdDhNoxV1Cv8PExQe0HOQ7In5PMlyw9HyYlY";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── Helpers ──────────────────────────────────────────────────────────────────
const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } });
const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 160 } });
const p = (text) => new Paragraph({ children: [new TextRun({ text, size: 24 })], spacing: { after: 160 } });
const blank = () => new Paragraph({ text: "" });
const field = (label) => new Paragraph({
  children: [
    new TextRun({ text: `${label}: `, bold: true, size: 24 }),
    new TextRun({ text: "______________________________", size: 24 }),
  ],
  spacing: { after: 120 },
});
const numbered = (items) => items.map((text, i) =>
  new Paragraph({ text: `${i + 1}. ${text}`, spacing: { after: 100 } })
);
const bulleted = (items) => items.map(text =>
  new Paragraph({ text: `• ${text}`, spacing: { after: 100 }, indent: { left: 400 } })
);

async function makeDocx(sections) {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 24 } },
      },
    },
    sections: [{ children: sections }],
  });
  return Packer.toBuffer(doc);
}

// ── Template definitions ──────────────────────────────────────────────────────
const TEMPLATES = [

  // ── EMPLOYMENT ──────────────────────────────────────────────────────────────
  {
    name: "Employment Contract",
    description: "Standard full-time employment agreement covering role, compensation, hours, benefits, and termination.",
    category: "Employment",
    file_name: "employment_contract.docx",
    tags: ["employment", "full-time", "HR", "onboarding"],
    sections: () => [
      h1("EMPLOYMENT AGREEMENT"),
      p("This Employment Agreement ('Agreement') is entered into as of the date signed below between:"),
      blank(),
      field("Employer (Company Name)"),
      field("Employee Full Name"),
      field("Start Date"),
      field("Job Title / Position"),
      blank(),
      h2("1. Position and Duties"),
      p("The Employee is hired for the position stated above. The Employee agrees to perform all duties associated with this role to the best of their ability and in accordance with Company policies."),
      h2("2. Compensation"),
      field("Annual / Monthly Salary"),
      field("Payment Schedule (weekly/bi-weekly/monthly)"),
      field("Payment Method"),
      h2("3. Working Hours"),
      p("Standard working hours are Monday to Friday, [START TIME] to [END TIME], totalling [HOURS] per week. Overtime may be required and will be compensated as per applicable law."),
      h2("4. Benefits"),
      p("The Employee shall be entitled to the following benefits:"),
      ...bulleted(["Health insurance as per Company policy", "Annual leave: [X] days per year", "Sick leave: as per applicable law", "Pension/retirement contributions: [SPECIFY]"]),
      h2("5. Confidentiality"),
      p("The Employee agrees not to disclose any confidential business information, trade secrets, or proprietary data of the Company during or after employment."),
      h2("6. Termination"),
      p("Either party may terminate this Agreement by providing [NOTICE PERIOD] written notice. The Company reserves the right to terminate immediately for gross misconduct."),
      h2("7. Governing Law"),
      field("Jurisdiction / Country"),
      p("This Agreement is governed by the laws of the jurisdiction stated above."),
      blank(),
      p("IN WITNESS WHEREOF, the parties have signed this Agreement:"),
      blank(),
      field("Employer Signature"),
      field("Date"),
      blank(),
      field("Employee Signature"),
      field("Date"),
    ],
  },

  {
    name: "Part-Time Employment Contract",
    description: "Employment agreement for part-time workers with flexible hours, pro-rated benefits, and clear scope of work.",
    category: "Employment",
    file_name: "part_time_employment_contract.docx",
    tags: ["employment", "part-time", "HR"],
    sections: () => [
      h1("PART-TIME EMPLOYMENT AGREEMENT"),
      field("Employer'), field('Employee'), field('Start Date'), field('Position"),
      blank(),
      h2("1. Hours of Work"),
      field("Hours per week"),
      field("Working days / schedule"),
      p("The Employee agrees to work the hours specified above. Schedule changes require mutual written consent."),
      h2("2. Hourly Rate / Compensation"),
      field("Hourly rate"),
      field("Payment schedule"),
      h2("3. Pro-Rated Benefits"),
      p("Benefits are provided on a pro-rated basis proportional to contracted hours relative to full-time (40 hours/week). Specific entitlements are detailed in the Company handbook."),
      h2("4. Termination"),
      p("Either party may terminate with [NOTICE PERIOD] written notice. Immediate dismissal may apply in cases of serious misconduct."),
      h2("5. Other Terms"),
      p("All other terms including confidentiality, intellectual property, and conduct policies apply as per the Company employee handbook."),
      blank(),
      field("Employer Signature'), field('Date"),
      field("Employee Signature'), field('Date"),
    ],
  },

  {
    name: "Internship Agreement",
    description: "Agreement for unpaid or paid internships defining learning objectives, duration, supervision, and compensation.",
    category: "Employment",
    file_name: "internship_agreement.docx",
    tags: ["internship", "employment", "student"],
    sections: () => [
      h1("INTERNSHIP AGREEMENT"),
      field("Company Name'), field('Intern Name'), field('University / Institution"),
      field("Start Date'), field('End Date'), field('Department / Supervisor"),
      blank(),
      h2("1. Purpose"),
      p("This Agreement establishes the terms of an internship placement. The primary purpose is educational development and professional experience."),
      h2("2. Duties"),
      p("The Intern will assist with the following tasks: [DESCRIBE TASKS]. Specific assignments will be agreed with the Supervisor on a weekly basis."),
      h2("3. Compensation"),
      field("Stipend (if applicable)"),
      p("The internship is [PAID / UNPAID]. If paid, the stipend is as stated above, payable monthly."),
      h2("4. Working Hours"),
      field("Hours per week'), field('Schedule"),
      h2("5. Learning Objectives"),
      ...numbered(["[OBJECTIVE 1]", "[OBJECTIVE 2]", "[OBJECTIVE 3]"]),
      h2("6. Confidentiality"),
      p("The Intern agrees to maintain confidentiality of all proprietary information encountered during the internship."),
      h2("7. Termination"),
      p("Either party may terminate this agreement with 5 business days' written notice."),
      blank(),
      field("Authorised Company Representative'), field('Date"),
      field("Intern Signature'), field('Date"),
      field("Parent/Guardian Signature (if under 18)'), field('Date"),
    ],
  },

  // ── FREELANCE / SERVICES ────────────────────────────────────────────────────
  {
    name: "Freelance Services Agreement",
    description: "Comprehensive freelance contract for project-based work including deliverables, payment schedule, IP ownership, and liability.",
    category: "Freelance",
    file_name: "freelance_services_agreement.docx",
    tags: ["freelance", "services", "contractor", "project"],
    sections: () => [
      h1("FREELANCE SERVICES AGREEMENT"),
      p("This Agreement is made between:"),
      blank(),
      field("Client (Company or Individual)"),
      field("Freelancer / Contractor Name"),
      field("Project Title"),
      field("Start Date"),
      field("Estimated Completion Date"),
      blank(),
      h2("1. Scope of Work"),
      p("The Freelancer agrees to provide the following services:"),
      ...numbered(["[DELIVERABLE 1 — describe in detail]", "[DELIVERABLE 2]", "[DELIVERABLE 3]"]),
      h2("2. Payment"),
      field("Total Project Fee"),
      field("Payment Schedule (e.g., 50% upfront, 50% on delivery)"),
      field("Accepted Payment Methods"),
      p("Invoices are payable within [X] days of receipt. Late payments incur [X]% monthly interest."),
      h2("3. Revisions"),
      p("The project fee includes up to [X] rounds of revisions. Additional revisions will be billed at [HOURLY RATE]/hour."),
      h2("4. Intellectual Property"),
      p("Upon receipt of full payment, all rights to the deliverables transfer exclusively to the Client. The Freelancer retains the right to display work in their portfolio unless otherwise agreed."),
      h2("5. Confidentiality"),
      p("Both parties agree to keep all project information, business processes, and client data confidential."),
      h2("6. Independent Contractor"),
      p("The Freelancer is an independent contractor, not an employee. The Freelancer is responsible for their own taxes and insurance."),
      h2("7. Termination"),
      p("Either party may terminate with [X] days written notice. The Client owes payment for all work completed to the termination date."),
      h2("8. Limitation of Liability"),
      p("The Freelancer's total liability under this Agreement shall not exceed the total fees paid for the project."),
      blank(),
      field("Client Signature'), field('Date"),
      field("Freelancer Signature'), field('Date"),
    ],
  },

  {
    name: "Consulting Agreement",
    description: "Professional consulting contract for advisory services, retainer arrangements, and ongoing strategic engagement.",
    category: "Freelance",
    file_name: "consulting_agreement.docx",
    tags: ["consulting", "advisory", "retainer", "professional services"],
    sections: () => [
      h1("CONSULTING AGREEMENT"),
      field("Client Company'), field('Consultant Name / Company"),
      field("Engagement Start Date'), field('Engagement Duration"),
      blank(),
      h2("1. Services"),
      p("The Consultant will provide advisory and consulting services in the following area(s): [AREA OF EXPERTISE]"),
      p("Specific deliverables or milestones: [LIST KEY OUTPUTS]"),
      h2("2. Fees & Billing"),
      field("Rate (hourly / daily / monthly retainer)"),
      field("Billing cycle"),
      field("Expense reimbursement policy"),
      h2("3. Availability"),
      p("The Consultant will dedicate approximately [X] hours per [week/month] to this engagement. Availability is subject to mutual scheduling."),
      h2("4. Confidentiality & Non-Disclosure"),
      p("The Consultant shall not disclose, use, or exploit any confidential information belonging to the Client for any purpose other than fulfilling this Agreement."),
      h2("5. Non-Compete (Optional)"),
      p("During the engagement and for [X] months thereafter, the Consultant shall not engage with direct competitors of the Client without prior written consent."),
      h2("6. Ownership of Work Product"),
      p("All work product created specifically for the Client under this Agreement is owned by the Client upon full payment."),
      h2("7. Termination"),
      p("Either party may terminate this Agreement with [X] days written notice. All outstanding invoices become due immediately upon termination."),
      blank(),
      field("Client Representative Signature'), field('Title'), field('Date"),
      field("Consultant Signature'), field('Date"),
    ],
  },

  // ── NDA ─────────────────────────────────────────────────────────────────────
  {
    name: "Non-Disclosure Agreement (Mutual)",
    description: "Mutual NDA for two parties sharing confidential information. Covers definition of confidential information, obligations, exclusions, and term.",
    category: "NDA",
    file_name: "mutual_nda.docx",
    tags: ["NDA", "confidentiality", "mutual", "business"],
    sections: () => [
      h1("MUTUAL NON-DISCLOSURE AGREEMENT"),
      p("This Mutual Non-Disclosure Agreement ('Agreement') is entered into as of the date last signed below between:"),
      blank(),
      field("Party A (Name / Company)"),
      field("Party B (Name / Company)"),
      field("Effective Date"),
      field("Purpose of Disclosure (e.g., exploring a potential business partnership)"),
      blank(),
      h2("1. Confidential Information"),
      p("'Confidential Information' means any non-public information disclosed by either party, whether oral, written, or electronic, that is designated as confidential or reasonably should be understood as confidential given the nature of the information."),
      h2("2. Obligations"),
      p("Each party agrees to: (a) hold the other party's Confidential Information in strict confidence; (b) not disclose it to third parties without prior written consent; (c) use it solely for the stated Purpose."),
      h2("3. Exclusions"),
      p("Obligations do not apply to information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was already known prior to disclosure; (c) is independently developed without use of Confidential Information; (d) is required to be disclosed by law or court order."),
      h2("4. Term"),
      field("Duration of confidentiality obligations (e.g., 2 years from Effective Date)"),
      h2("5. Return of Materials"),
      p("Upon request, each party shall promptly return or destroy all confidential materials belonging to the other party."),
      h2("6. Remedies"),
      p("Each party acknowledges that breach may cause irreparable harm for which monetary damages would be inadequate. Either party may seek injunctive relief in addition to other remedies."),
      h2("7. Governing Law"),
      field("Governing jurisdiction"),
      blank(),
      field("Party A Signature'), field('Name & Title'), field('Date"),
      blank(),
      field("Party B Signature'), field('Name & Title'), field('Date"),
    ],
  },

  {
    name: "One-Way Non-Disclosure Agreement",
    description: "Unilateral NDA where only one party discloses confidential information. Ideal for vendor evaluations, demos, and job interviews.",
    category: "NDA",
    file_name: "one_way_nda.docx",
    tags: ["NDA", "confidentiality", "unilateral", "vendor"],
    sections: () => [
      h1("NON-DISCLOSURE AGREEMENT (Unilateral)"),
      field("Disclosing Party (Company / Individual)"),
      field("Receiving Party (Company / Individual)"),
      field("Effective Date"),
      field("Purpose"),
      blank(),
      h2("1. Confidential Information"),
      p("The Disclosing Party may share proprietary and confidential information relating to [SUBJECT MATTER] with the Receiving Party solely for the stated Purpose."),
      h2("2. Obligations of Receiving Party"),
      p("The Receiving Party shall: (a) keep all Confidential Information strictly confidential; (b) not copy, reproduce, or distribute it; (c) restrict access to employees/contractors with a need to know, who are themselves bound by confidentiality."),
      h2("3. No Licence"),
      p("Nothing in this Agreement grants the Receiving Party any rights in or to the Confidential Information except as expressly set forth herein."),
      h2("4. Term"),
      field("Duration (e.g., 3 years from Effective Date)"),
      h2("5. Injunctive Relief"),
      p("The Receiving Party acknowledges that unauthorised disclosure would cause irreparable harm entitling the Disclosing Party to seek injunctive relief without posting bond."),
      h2("6. Governing Law"),
      field("Governing jurisdiction"),
      blank(),
      field("Disclosing Party Signature'), field('Name & Title'), field('Date"),
      blank(),
      field("Receiving Party Signature'), field('Name & Title'), field('Date"),
    ],
  },

  // ── LEASE / REAL ESTATE ─────────────────────────────────────────────────────
  {
    name: "Residential Lease Agreement",
    description: "Standard residential tenancy agreement covering rent, deposit, maintenance responsibilities, and tenant rights.",
    category: "Real Estate",
    file_name: "residential_lease_agreement.docx",
    tags: ["lease", "rental", "residential", "tenancy", "landlord"],
    sections: () => [
      h1("RESIDENTIAL LEASE AGREEMENT"),
      field("Landlord Name / Management Company"),
      field("Tenant(s) Full Name(s)"),
      field("Property Address"),
      field("Lease Start Date'), field('Lease End Date"),
      field("Monthly Rent Amount"),
      field("Security Deposit Amount"),
      blank(),
      h2("1. Premises"),
      p("The Landlord agrees to lease the property described above to the Tenant(s) for residential use only."),
      h2("2. Rent"),
      p("Rent of the amount stated above is due on the [DAY] of each month. Payments should be made to [PAYMENT METHOD / ACCOUNT]."),
      p("Late payment (after [GRACE PERIOD] days) incurs a late fee of [AMOUNT / %]."),
      h2("3. Security Deposit"),
      p("The Tenant has paid the security deposit stated above. It will be returned within [X] days of lease end, minus any deductions for damages beyond normal wear and tear."),
      h2("4. Utilities"),
      p("The following utilities are included in rent: [LIST OR STATE 'NONE']."),
      p("The Tenant is responsible for: [LIST UTILITIES]."),
      h2("5. Maintenance & Repairs"),
      p("The Landlord is responsible for maintaining the property in a habitable condition. The Tenant must report any damage promptly and is responsible for minor maintenance (e.g., changing light bulbs)."),
      h2("6. Rules & Restrictions"),
      ...bulleted(["No smoking on the premises", "Pets: [ALLOWED / NOT ALLOWED / WITH APPROVAL]", "Maximum occupants: [NUMBER]", "Subletting: not permitted without written consent"]),
      h2("7. Termination"),
      p("Either party may terminate this lease at the end of the term by providing [NOTICE PERIOD] written notice. Early termination by the Tenant may incur a penalty of [AMOUNT]."),
      h2("8. Governing Law"),
      field("Jurisdiction"),
      blank(),
      field("Landlord Signature'), field('Date"),
      field("Tenant Signature'), field('Date"),
    ],
  },

  {
    name: "Commercial Office Lease Agreement",
    description: "Commercial lease for office space including permitted use, CAM charges, fit-out provisions, and renewal options.",
    category: "Real Estate",
    file_name: "commercial_office_lease.docx",
    tags: ["lease", "commercial", "office", "business"],
    sections: () => [
      h1("COMMERCIAL OFFICE LEASE AGREEMENT"),
      field("Landlord'), field('Tenant (Business Name)'), field('Premises Address"),
      field("Premises Area (sq m / sq ft)'), field('Lease Term Start'), field('Lease Term End"),
      field("Base Rent (monthly)'), field('Security Deposit"),
      blank(),
      h2("1. Permitted Use"),
      p("The Tenant may use the premises solely for [OFFICE / BUSINESS TYPE] purposes. Any change in use requires prior written consent from the Landlord."),
      h2("2. Rent & Operating Costs"),
      p("The Tenant shall pay base rent plus their proportionate share of common area maintenance (CAM), property taxes, and insurance, estimated at [AMOUNT] per month."),
      h2("3. Fit-Out & Alterations"),
      p("The Tenant may make alterations with Landlord's written consent. All improvements become property of the Landlord unless agreed otherwise."),
      h2("4. Maintenance"),
      p("Landlord maintains structural elements and common areas. Tenant maintains their interior space, including HVAC filters, in good condition."),
      h2("5. Assignment & Subletting"),
      p("Tenant may not assign or sublet without Landlord's written consent, not to be unreasonably withheld."),
      h2("6. Renewal Option"),
      p("Tenant has an option to renew for [X] additional year(s) at [RENEWAL RENT / MARKET RATE] by providing [X] months' written notice."),
      h2("7. Default & Remedy"),
      p("If Tenant defaults on rent for more than [X] days, Landlord may issue notice to cure. Failure to cure within [X] days entitles Landlord to terminate the lease."),
      blank(),
      field("Landlord Authorised Signatory'), field('Title'), field('Date"),
      field("Tenant Authorised Signatory'), field('Title'), field('Date"),
    ],
  },

  // ── BUSINESS ────────────────────────────────────────────────────────────────
  {
    name: "Partnership Agreement",
    description: "Business partnership agreement defining contributions, profit sharing, decision-making, and exit provisions.",
    category: "Business",
    file_name: "partnership_agreement.docx",
    tags: ["partnership", "business", "shareholders", "joint venture"],
    sections: () => [
      h1("GENERAL PARTNERSHIP AGREEMENT"),
      field("Partner 1 Name'), field('Partner 2 Name'), field('Partner 3 Name (if applicable)"),
      field("Business Name'), field('Business Address'), field('Effective Date"),
      blank(),
      h2("1. Business Purpose"),
      p("The Partners agree to carry on the following business: [DESCRIBE BUSINESS ACTIVITY]."),
      h2("2. Capital Contributions"),
      field("Partner 1 Contribution (amount / assets)"),
      field("Partner 2 Contribution"),
      field("Partner 3 Contribution (if applicable)"),
      h2("3. Ownership & Profit Sharing"),
      field("Partner 1 Ownership %"),
      field("Partner 2 Ownership %"),
      p("Profits and losses are distributed proportionally to ownership unless otherwise agreed in writing."),
      h2("4. Management & Decision-Making"),
      p("Routine business decisions may be made by any Partner. Decisions involving expenditure over [THRESHOLD] require unanimous written consent."),
      h2("5. Banking & Accounts"),
      p("The Partnership shall maintain a dedicated business bank account. Withdrawals over [AMOUNT] require [NUMBER] signatories."),
      h2("6. Partner Duties"),
      p("Each Partner agrees to devote [FULL-TIME / PART-TIME / SPECIFY %] of their professional time to the Partnership."),
      h2("7. Dissolution & Exit"),
      p("A Partner may exit by providing [X] months' notice. Buy-out value shall be determined by independent valuation. Dissolution requires unanimous consent unless a Partner is in material breach."),
      h2("8. Governing Law"),
      field("Jurisdiction"),
      blank(),
      field("Partner 1 Signature'), field('Date"),
      field("Partner 2 Signature'), field('Date"),
      field("Partner 3 Signature'), field('Date"),
    ],
  },

  {
    name: "Service Level Agreement (SLA)",
    description: "SLA defining service standards, uptime guarantees, response times, penalties for non-compliance, and escalation procedures.",
    category: "Business",
    file_name: "service_level_agreement.docx",
    tags: ["SLA", "service", "IT", "operations", "support"],
    sections: () => [
      h1("SERVICE LEVEL AGREEMENT (SLA)"),
      field("Service Provider'), field('Client'), field('Service Description"),
      field("Agreement Start Date'), field('Review Date"),
      blank(),
      h2("1. Services Covered"),
      p("This SLA covers the following services: [LIST SERVICES]. Any services not listed are excluded."),
      h2("2. Service Hours"),
      field("Standard service hours"),
      field("Emergency support hours"),
      h2("3. Availability & Uptime"),
      field("Target uptime % (e.g., 99.9%)"),
      p("Planned maintenance windows will be communicated at least [X] hours in advance and do not count toward downtime."),
      h2("4. Response & Resolution Times"),
      ...bulleted([
        "Critical (service down): Response within 1 hour, Resolution within [X] hours",
        "High (major impact): Response within [X] hours, Resolution within [X] hours",
        "Medium (partial impact): Response within [X] business hours",
        "Low (minor issue): Response within [X] business days",
      ]),
      h2("5. Escalation Procedure"),
      ...numbered(["Initial contact: [CONTACT DETAILS]", "Escalation 1: [MANAGER]", "Escalation 2: [DIRECTOR]"]),
      h2("6. Service Credits"),
      p("If uptime falls below the target, the Client is entitled to service credits as follows: [X]% monthly fee per [%] below target, up to a maximum of [X]% of monthly fees."),
      h2("7. Review"),
      p("This SLA will be reviewed annually or upon significant changes to the service."),
      blank(),
      field("Service Provider Signature'), field('Date"),
      field("Client Signature'), field('Date"),
    ],
  },

  {
    name: "Website Development Contract",
    description: "Contract for website or web application development including specifications, milestones, payment, and IP transfer.",
    category: "Business",
    file_name: "website_development_contract.docx",
    tags: ["web development", "software", "design", "technology"],
    sections: () => [
      h1("WEBSITE DEVELOPMENT CONTRACT"),
      field("Client Name / Company'), field('Developer / Agency"),
      field("Project Name'), field('Project Start Date'), field('Expected Launch Date"),
      blank(),
      h2("1. Project Scope"),
      p("The Developer agrees to design and develop the following: [DESCRIBE WEBSITE / APP]"),
      p("Technologies to be used: [TECH STACK]"),
      p("Number of pages / features included: [LIST]"),
      h2("2. Deliverables & Milestones"),
      ...numbered([
        "Discovery & wireframes — [DATE] — [PAYMENT]",
        "Design mockups (desktop + mobile) — [DATE] — [PAYMENT]",
        "Development (frontend + backend) — [DATE] — [PAYMENT]",
        "Testing & QA — [DATE]",
        "Launch & handover — [DATE] — [FINAL PAYMENT]",
      ]),
      h2("3. Payment"),
      field("Total Project Cost"),
      field("Payment schedule"),
      p("All amounts are due within [X] days of invoice. Work may be paused if payment is overdue by more than [X] days."),
      h2("4. Client Responsibilities"),
      ...bulleted(["Provide all content (text, images, branding) by [DATE]", "Provide timely feedback within [X] business days of each submission", "Provide access to required hosting/domain accounts"]),
      h2("5. Revisions"),
      p("The project includes [X] revision rounds per milestone. Additional revisions are billed at [RATE]/hour."),
      h2("6. Intellectual Property"),
      p("Upon final payment, all rights to the developed website transfer to the Client. Developer retains rights to generic code components and may display the work in their portfolio."),
      h2("7. Hosting & Maintenance"),
      p("Ongoing hosting and maintenance are [INCLUDED / NOT INCLUDED]. If offered separately, monthly fee: [AMOUNT]."),
      h2("8. Warranties"),
      p("Developer warrants the website will function as specified for [X] months post-launch. Bug fixes during this period are included at no extra charge."),
      blank(),
      field("Client Signature'), field('Date"),
      field("Developer Signature'), field('Date"),
    ],
  },

  // ── FINANCE ─────────────────────────────────────────────────────────────────
  {
    name: "Loan Agreement",
    description: "Personal or business loan agreement specifying principal, interest rate, repayment schedule, and default consequences.",
    category: "Finance",
    file_name: "loan_agreement.docx",
    tags: ["loan", "finance", "debt", "repayment"],
    sections: () => [
      h1("LOAN AGREEMENT"),
      field("Lender Name'), field('Borrower Name"),
      field("Loan Amount (Principal)'), field('Loan Date"),
      blank(),
      h2("1. Loan Amount"),
      p("The Lender agrees to lend the principal amount stated above to the Borrower under the terms set out in this Agreement."),
      h2("2. Interest"),
      field("Annual Interest Rate"),
      p("Interest is calculated on the outstanding principal balance using [SIMPLE / COMPOUND] method."),
      h2("3. Repayment Schedule"),
      field("First Payment Date"),
      field("Number of Instalments"),
      field("Monthly Instalment Amount"),
      field("Final Payment Date"),
      p("Payments are due on the [DAY] of each month. Early repayment is [PERMITTED WITHOUT PENALTY / SUBJECT TO FEE]."),
      h2("4. Late Payment"),
      p("Payments more than [X] days late incur a fee of [AMOUNT / %]. Repeated late payments may accelerate the full loan balance."),
      h2("5. Default"),
      p("If the Borrower fails to make [X] consecutive payments, the full outstanding balance becomes immediately due and payable."),
      h2("6. Security / Collateral"),
      field("Collateral offered (if any)"),
      p("If no collateral: this is an unsecured loan."),
      h2("7. Governing Law"),
      field("Jurisdiction"),
      blank(),
      field("Lender Signature'), field('Date"),
      field("Borrower Signature'), field('Date"),
      p("Witness (optional):"),
      field("Witness Signature'), field('Date"),
    ],
  },

  {
    name: "Payment Plan Agreement",
    description: "Instalment payment arrangement for outstanding debts, purchases, or services, with clear schedule and default terms.",
    category: "Finance",
    file_name: "payment_plan_agreement.docx",
    tags: ["payment", "instalment", "finance", "debt settlement"],
    sections: () => [
      h1("PAYMENT PLAN AGREEMENT"),
      field("Creditor / Service Provider'), field('Debtor / Client"),
      field("Total Amount Owed'), field('Agreement Date"),
      blank(),
      h2("1. Background"),
      p("The Debtor owes the Creditor the total amount stated above in relation to [GOODS / SERVICES / ORIGINAL AGREEMENT DATE]."),
      h2("2. Payment Schedule"),
      field("Down payment (due immediately)"),
      field("Monthly instalment amount"),
      field("First instalment date"),
      field("Number of instalments"),
      p("Each instalment is due on the [DAY] of the month via [PAYMENT METHOD]."),
      h2("3. No Additional Charges"),
      p("Provided payments are made on time, no additional interest or fees will be charged under this plan."),
      h2("4. Default"),
      p("If the Debtor misses [X] payments or is more than [X] days late, the full remaining balance becomes due immediately and the Creditor may pursue collection."),
      h2("5. Modifications"),
      p("This plan may only be modified in writing and signed by both parties."),
      h2("6. Governing Law"),
      field("Jurisdiction"),
      blank(),
      field("Creditor Signature'), field('Date"),
      field("Debtor Signature'), field('Date"),
    ],
  },

  // ── PRIVACY / DATA ──────────────────────────────────────────────────────────
  {
    name: "Privacy Policy (Website)",
    description: "GDPR-compliant website privacy policy covering data collection, usage, third parties, cookies, and user rights.",
    category: "Compliance",
    file_name: "privacy_policy_website.docx",
    tags: ["privacy", "GDPR", "data protection", "website", "compliance"],
    sections: () => [
      h1("PRIVACY POLICY"),
      field("Company / Website Name"),
      field("Website URL"),
      field("Last Updated"),
      blank(),
      h2("1. Who We Are"),
      p("We are [COMPANY NAME], operating [WEBSITE URL]. This Privacy Policy explains how we collect, use, and protect your personal data."),
      h2("2. Data We Collect"),
      ...bulleted(["Name and email address (when you register or contact us)", "Usage data (pages visited, time on site, browser type)", "Cookies and tracking data (see Section 7)", "Payment information (processed securely via third-party providers)"]),
      h2("3. How We Use Your Data"),
      ...bulleted(["To provide and improve our services", "To communicate with you (transactional and marketing emails)", "To process payments", "To comply with legal obligations"]),
      h2("4. Legal Basis (GDPR)"),
      p("We process data under the following legal bases: (a) Contract performance; (b) Legitimate interests; (c) Legal obligation; (d) Consent — which may be withdrawn at any time."),
      h2("5. Data Sharing"),
      p("We do not sell personal data. We share data only with: service providers (hosting, email, analytics) who process data on our behalf under data processing agreements."),
      h2("6. Data Retention"),
      p("We retain personal data for as long as necessary for the stated purposes or as required by law. Account data is deleted within [X] days of account closure."),
      h2("7. Cookies"),
      p("We use essential cookies (required for site function), analytics cookies (with your consent), and marketing cookies (with your consent). Manage cookie preferences via our cookie banner."),
      h2("8. Your Rights"),
      ...bulleted(["Access the data we hold about you", "Request correction of inaccurate data", "Request deletion ('right to be forgotten')", "Object to processing", "Data portability", "Lodge a complaint with your supervisory authority"]),
      h2("9. Contact"),
      field("Data Controller Email"),
      field("Postal Address"),
    ],
  },
];

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🌱 Seeding ${TEMPLATES.length} templates to Supabase...\n`);
  let created = 0;

  for (const tmpl of TEMPLATES) {
    process.stdout.write(`  ⏳ ${tmpl.name} ... `);
    try {
      // 1. Build DOCX
      const buffer = await makeDocx(tmpl.sections());

      // 2. Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from("contract-templates")
        .upload(tmpl.file_name, buffer, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });
      if (uploadErr) throw new Error(`Storage: ${uploadErr.message}`);

      // 3. Insert DB record
      const { error: dbErr } = await supabase
        .from("contract_templates")
        .upsert(
          {
            name: tmpl.name,
            description: tmpl.description,
            category: tmpl.category,
            file_path: tmpl.file_name,
            file_name: tmpl.file_name,
            tags: tmpl.tags,
            is_active: true,
          },
          { onConflict: "file_path" }
        );
      if (dbErr) throw new Error(`DB: ${dbErr.message}`);

      console.log("✅");
      created++;
    } catch (e) {
      console.log(`❌  ${e.message}`);
    }
  }

  console.log(`\n✅ Done! ${created}/${TEMPLATES.length} templates seeded.\n`);
}

seed().catch(console.error);
