
-- Batch 1: Commercial
UPDATE contract_templates SET
  description = 'Professional agency contract appointing a representative to act on behalf of the principal. Covers commission structure, territory rights, reporting obligations, and termination terms. Suitable for sales agents, marketing representatives, and business development partners.',
  tags = ARRAY['agency','agent','representation','commission','territory','sales-agent']
WHERE name = 'Agency Agreement';

UPDATE contract_templates SET
  description = 'Comprehensive distribution contract for appointing an exclusive or non-exclusive distributor. Includes territory definitions, minimum purchase obligations, pricing terms, marketing support, and performance benchmarks. Ideal for manufacturers expanding into new markets.',
  tags = ARRAY['distribution','territory','exclusive','wholesale','reseller','supply-chain']
WHERE name = 'Distribution Agreement';

UPDATE contract_templates SET
  description = 'Standard commercial contract for buying and selling goods or services. Covers pricing, delivery schedules, payment terms, quality warranties, returns policy, and liability limitations. Suitable for B2B and B2C transactions of any scale.',
  tags = ARRAY['sales','purchase','commercial','b2b','goods','warranty']
WHERE name = 'Sales / Purchase Agreement';

-- Common Life
UPDATE contract_templates SET
  description = 'Detailed agreement for joint ownership of property or assets. Defines each owner''s share, usage rights, expense allocation, maintenance responsibilities, decision-making procedures, and buyout/exit mechanisms. Essential for shared real estate, vehicles, or business assets.',
  tags = ARRAY['co-ownership','shared-property','assets','joint-ownership','buyout']
WHERE name = 'Co-Ownership Agreement';

UPDATE contract_templates SET
  description = 'Structured agreement between creditor and debtor to resolve outstanding debts. Covers reduced settlement amount, payment schedule, release of claims, confidentiality, and consequences of default. Helps both parties avoid litigation costs.',
  tags = ARRAY['debt','settlement','payment','creditor','negotiation']
WHERE name = 'Debt Settlement Agreement';

UPDATE contract_templates SET
  description = 'Complete service agreement for event planning engagements. Covers scope of services, venue coordination, vendor management, timeline milestones, cancellation/rescheduling policy, payment schedule, and force majeure provisions. Suitable for weddings, corporate events, and private celebrations.',
  tags = ARRAY['event','wedding','planning','venue','catering','cancellation']
WHERE name = 'Event / Wedding Planning Contract';

UPDATE contract_templates SET
  description = 'Detailed construction and renovation agreement between homeowner and contractor. Includes project scope, materials specifications, timeline with milestones, payment schedule, change order procedures, warranty terms, insurance requirements, and dispute resolution.',
  tags = ARRAY['renovation','contractor','home-improvement','construction','warranty','milestones']
WHERE name = 'Home Renovation Contract';

UPDATE contract_templates SET
  description = 'Agreement to resolve disputes through professional mediation instead of litigation. Covers mediator selection, process rules, confidentiality obligations, cost sharing, timeline, and enforceability of settlement. Saves time and legal costs for both parties.',
  tags = ARRAY['mediation','dispute','resolution','alternative-dispute','settlement']
WHERE name = 'Mediation Agreement';

UPDATE contract_templates SET
  description = 'Adoption contract covering transfer of pet ownership, care standards, veterinary obligations, spay/neuter requirements, return policies, and liability waivers. Protects the welfare of the animal and defines responsibilities of the adopting party.',
  tags = ARRAY['pet','adoption','animal','veterinary','welfare']
WHERE name = 'Pet Adoption Agreement';

UPDATE contract_templates SET
  description = 'Creative services agreement for photographers and videographers. Covers session details, deliverables (edited photos/videos), usage and licensing rights, model releases, retouching terms, delivery timeline, cancellation policy, and payment structure.',
  tags = ARRAY['photography','videography','creative','copyright','licensing','deliverables']
WHERE name = 'Photography / Videography Contract';

UPDATE contract_templates SET
  description = 'Professional agreement for private tutoring or coaching services. Defines session frequency, duration, learning objectives, cancellation policy, payment terms, progress reporting, and confidentiality. Suitable for academic tutoring, career coaching, and skills training.',
  tags = ARRAY['tutoring','coaching','education','sessions','cancellation']
WHERE name = 'Tutoring / Coaching Agreement';

UPDATE contract_templates SET
  description = 'Formal agreement between an organization and volunteer. Covers role description, time commitment, training requirements, expense reimbursement, confidentiality, code of conduct, liability waivers, and insurance coverage. Essential for nonprofits and community organizations.',
  tags = ARRAY['volunteer','nonprofit','charity','liability','community']
WHERE name = 'Volunteer Agreement';

-- Confidentiality
UPDATE contract_templates SET
  description = 'One-way confidentiality commitment for recipients of sensitive information. Lighter than a full NDA, ideal for due diligence processes, investor briefings, or sharing proprietary data with advisors. Covers definition of confidential information, obligations, exceptions, and duration.',
  tags = ARRAY['confidentiality','undertaking','unilateral','due-diligence','sensitive-data']
WHERE name = 'Confidentiality Undertaking';

UPDATE contract_templates SET
  description = 'Industry-standard mutual or one-way NDA protecting confidential information and trade secrets. Covers scope of protected information, permitted disclosures, return of materials, remedies for breach, and survival period. Essential before any business negotiation or partnership discussion.',
  tags = ARRAY['nda','confidentiality','trade-secrets','mutual','ip-protection']
WHERE name = 'Non-Disclosure Agreement (NDA)';

-- Data & Privacy
UPDATE contract_templates SET
  description = 'GDPR and CCPA-compliant agreement between data controller and processor. Covers lawful basis for processing, data subject rights, security measures, breach notification procedures, sub-processor management, international transfers, and audit rights.',
  tags = ARRAY['gdpr','data-processing','privacy','ccpa','controller','processor']
WHERE name = 'Data Processing Agreement (DPA)';

UPDATE contract_templates SET
  description = 'Framework agreement governing the exchange of data between organizations. Covers purpose limitation, data quality standards, security requirements, access controls, retention periods, compliance obligations, breach notification, and termination procedures.',
  tags = ARRAY['data-sharing','compliance','security','gdpr','interoperability']
WHERE name = 'Data Sharing Agreement';

UPDATE contract_templates SET
  description = 'Comprehensive privacy policy template compliant with GDPR, CCPA, and ePrivacy regulations. Covers data collection methods, legal bases for processing, cookie usage, user rights (access, deletion, portability), third-party sharing, international transfers, and contact information.',
  tags = ARRAY['privacy-policy','gdpr','website','ccpa','cookies','user-rights']
WHERE name = 'Privacy Policy Template';

UPDATE contract_templates SET
  description = 'Complete terms of service for websites and applications. Covers acceptable use policy, user accounts, intellectual property rights, content moderation, limitation of liability, indemnification, governing law, dispute resolution, and modification procedures.',
  tags = ARRAY['terms','website','legal','saas','e-commerce','liability']
WHERE name = 'Terms of Service Template';

-- Employment
UPDATE contract_templates SET
  description = 'EU labor law-compliant employment contract covering role definition, compensation package, benefits, working hours, probation period, annual leave, sick leave, IP assignment, non-disclosure obligations, termination conditions, and notice periods.',
  tags = ARRAY['employment','labor','eu-compliant','full-time','benefits','termination']
WHERE name = 'Employment Agreement';

UPDATE contract_templates SET
  description = 'Comprehensive agreement for engaging freelancers and independent contractors. Covers project scope, deliverables, milestones, payment terms (hourly/fixed/milestone-based), IP ownership, confidentiality, non-solicitation, liability, and tax status clarification.',
  tags = ARRAY['freelance','contractor','independent','deliverables','ip-ownership','milestones']
WHERE name = 'Freelance / Independent Contractor Agreement';

UPDATE contract_templates SET
  description = 'Carefully scoped non-compete agreement restricting competitive activities after employment or contract ends. Covers restricted activities, geographic scope, time limitations (6-24 months), compensation during restriction, and enforceability safeguards.',
  tags = ARRAY['non-compete','restriction','employment','geographic','enforceable']
WHERE name = 'Non-Compete Agreement';

-- Financial
UPDATE contract_templates SET
  description = 'Detailed investment contract for equity or convertible debt financing. Covers investment amount, valuation, share allocation, investor rights (board seat, information rights, anti-dilution), vesting schedules, exit provisions, and drag-along/tag-along rights.',
  tags = ARRAY['investment','equity','venture','valuation','shares','startup']
WHERE name = 'Investment Agreement';

UPDATE contract_templates SET
  description = 'Formal lending agreement covering principal amount, interest rate (fixed/variable), repayment schedule, collateral requirements, prepayment terms, default conditions, acceleration clauses, late payment penalties, and governing law.',
  tags = ARRAY['loan','finance','lending','interest','collateral','repayment']
WHERE name = 'Loan Agreement';

-- Licensing & IP
UPDATE contract_templates SET
  description = 'Complete IP transfer agreement covering patents, copyrights, trademarks, and trade secrets. Includes representations of ownership, scope of assignment, moral rights waiver (where applicable), consideration, and indemnification.',
  tags = ARRAY['ip','assignment','copyright','patent','trademark','transfer']
WHERE name = 'Intellectual Property Assignment';

UPDATE contract_templates SET
  description = 'Modern SaaS subscription contract covering service description, subscription tiers, uptime guarantees (SLA), data processing terms, security measures, backup policies, support levels, pricing and billing, auto-renewal, and data portability.',
  tags = ARRAY['saas','subscription','cloud','sla','uptime','data-portability']
WHERE name = 'SaaS Subscription Agreement';

UPDATE contract_templates SET
  description = 'End-user or enterprise software licensing agreement covering granted rights, usage restrictions (seats, devices, territories), maintenance and support, updates policy, warranty disclaimers, limitation of liability, and audit rights.',
  tags = ARRAY['software','license','saas','enterprise','usage-rights','support']
WHERE name = 'Software License Agreement';

-- Partnership
UPDATE contract_templates SET
  description = 'Strategic agreement for two or more parties collaborating on a specific project while remaining independent entities. Covers purpose, contributions (capital, IP, labor), management structure, profit/loss sharing, and dissolution procedures.',
  tags = ARRAY['joint-venture','partnership','collaboration','project','profit-sharing']
WHERE name = 'Joint Venture Agreement';

UPDATE contract_templates SET
  description = 'Non-binding preliminary agreement outlining mutual intentions before entering a formal contract. Covers proposed scope, timeline, responsibilities, key terms to be negotiated, confidentiality, exclusivity period, and conditions for proceeding.',
  tags = ARRAY['mou','preliminary','intentions','non-binding','negotiation']
WHERE name = 'Memorandum of Understanding (MOU)';

UPDATE contract_templates SET
  description = 'Comprehensive business partnership agreement covering capital contributions, profit/loss distribution, management roles, decision-making authority, partner withdrawal procedures, admission of new partners, non-compete obligations, and dissolution terms.',
  tags = ARRAY['partnership','business','profit-sharing','management','dissolution']
WHERE name = 'Partnership Agreement';

-- Personal Life
UPDATE contract_templates SET
  description = 'Employment agreement for hiring a childcare provider or nanny. Covers duties (feeding, transport, activities), work schedule, compensation, overtime, paid time off, house rules, emergency procedures, confidentiality, trial period, and termination notice.',
  tags = ARRAY['childcare','nanny','employment','schedule','compensation','household']
WHERE name = 'Childcare / Nanny Agreement';

UPDATE contract_templates SET
  description = 'Legal document declaring your wishes for asset distribution and guardianship of minor children after death. Covers estate allocation, specific bequests, executor appointment, guardian designation, trust provisions, and revocation of prior wills.',
  tags = ARRAY['will','testament','inheritance','estate','guardian','executor']
WHERE name = 'Last Will and Testament';

UPDATE contract_templates SET
  description = 'Agreement between individuals for private lending. Covers loan amount, interest rate, repayment schedule, late payment terms, early repayment options, default provisions, and governing law. More structured than informal IOUs for better legal protection.',
  tags = ARRAY['personal-loan','lending','private','interest','repayment','iou']
WHERE name = 'Personal Loan Agreement';

UPDATE contract_templates SET
  description = 'Legal authorization granting another person the right to act on your behalf for financial, legal, medical, or personal matters. Covers scope of authority, effective dates, revocation procedures, and agent responsibilities.',
  tags = ARRAY['power-of-attorney','legal','representation','authorization','agent','fiduciary']
WHERE name = 'Power of Attorney';

UPDATE contract_templates SET
  description = 'Pre-marriage agreement defining asset division, debt responsibilities, spousal support terms, and property rights in the event of divorce or separation. Covers pre-existing assets, future earnings, inheritance rights, and sunset clauses.',
  tags = ARRAY['prenuptial','marriage','assets','divorce','property-division','spousal-support']
WHERE name = 'Prenuptial Agreement';

UPDATE contract_templates SET
  description = 'Private property sale contract covering purchase price, deposit, payment schedule, property condition disclosure, title transfer, encumbrances check, inspection rights, completion timeline, and default remedies. Suitable for direct sales without estate agents.',
  tags = ARRAY['property','sale','real-estate','private','title-transfer','deposit']
WHERE name = 'Property Sale Agreement (Private)';

UPDATE contract_templates SET
  description = 'Residential tenancy agreement covering rent amount, payment schedule, security deposit, lease duration, maintenance responsibilities, house rules, subletting restrictions, early termination, renewal terms, and tenant/landlord obligations.',
  tags = ARRAY['rental','residential','tenant','landlord','lease','deposit','housing']
WHERE name = 'Rental Agreement (Residential)';

UPDATE contract_templates SET
  description = 'Agreement between roommates sharing a living space. Covers rent split, utility division, common area usage, guest policies, quiet hours, cleaning responsibilities, personal property, subletting rules, and move-out procedures.',
  tags = ARRAY['roommate','shared-living','rent-split','house-rules','utilities']
WHERE name = 'Roommate Agreement';

UPDATE contract_templates SET
  description = 'Private vehicle sale contract covering vehicle description (make, model, VIN), purchase price, payment method, title transfer, odometer disclosure, as-is condition or warranty terms, and liability release upon completion.',
  tags = ARRAY['vehicle','car-sale','private','title-transfer','vin','as-is']
WHERE name = 'Vehicle Sale Agreement';

-- Real Estate
UPDATE contract_templates SET
  description = 'Commercial lease agreement covering premises description, permitted use, rent structure (base + percentage), security deposit, lease term, renewal options, maintenance obligations, insurance requirements, assignment/subletting, and default remedies.',
  tags = ARRAY['lease','commercial','office','retail','rent','premises','business-space']
WHERE name = 'Lease Agreement (Commercial)';

UPDATE contract_templates SET
  description = 'Agreement allowing a tenant to sublease all or part of their rented space to a third party. Covers original lease terms compliance, sub-tenant obligations, rent payments, duration, landlord consent requirements, and liability allocation.',
  tags = ARRAY['sublease','tenant','sub-tenant','landlord-consent','rental','partial-lease']
WHERE name = 'Sub-Lease Agreement';

-- Service Agreements
UPDATE contract_templates SET
  description = 'Professional consulting engagement agreement covering scope of advisory services, deliverables, project timeline, hourly/fixed-fee rates, expense reimbursement, IP ownership of work product, confidentiality, non-solicitation, and liability limitations.',
  tags = ARRAY['consulting','advisory','professional-services','deliverables','hourly-rate','expertise']
WHERE name = 'Consulting Agreement';

UPDATE contract_templates SET
  description = 'Contract for providing a dedicated team of professionals to a client. Covers team composition, roles and responsibilities, working hours, communication protocols, performance metrics, team member replacement procedures, and pricing structure.',
  tags = ARRAY['dedicated-team','outsourcing','staffing','it-services','team-management','remote']
WHERE name = 'Dedicated Team Contract';

UPDATE contract_templates SET
  description = 'IT services agreement tailored for Polish market requirements. Covers system development, maintenance, support levels, response times, data protection (RODO compliance), acceptance criteria, penalty clauses, and intellectual property rights.',
  tags = ARRAY['it-services','poland','rodo','software-development','support','maintenance']
WHERE name = 'IT Services Agreement (PL)';

UPDATE contract_templates SET
  description = 'Ongoing managed services contract covering IT infrastructure management, monitoring, security operations, backup services, help desk support, escalation procedures, SLAs with uptime guarantees, reporting, and pricing (per-device or flat fee).',
  tags = ARRAY['managed-services','it-management','monitoring','infrastructure','sla','support']
WHERE name = 'Managed Services Contract';

UPDATE contract_templates SET
  description = 'General-purpose service agreement template covering scope of work, service levels, payment terms, liability, warranties, force majeure, termination provisions, and dispute resolution. Adaptable for any professional service engagement.',
  tags = ARRAY['service','general-purpose','professional','scope-of-work','payment','warranty']
WHERE name = 'Service Agreement (Draft)';

UPDATE contract_templates SET
  description = 'Service Level Agreement defining measurable performance metrics, uptime targets (99.9%+), response and resolution times, escalation matrix, service credits for SLA breaches, reporting frequency, review procedures, and exclusions.',
  tags = ARRAY['sla','uptime','performance','metrics','service-credits','escalation']
WHERE name = 'Service Level Agreement (SLA)';

UPDATE contract_templates SET
  description = 'Staff augmentation contract for supplementing client teams with external talent. Covers resource profiles, skill requirements, onboarding process, daily/hourly rates, working hours, reporting structure, replacement guarantees, and confidentiality.',
  tags = ARRAY['staff-augmentation','outsourcing','talent','it-staffing','rates','onboarding']
WHERE name = 'Staff Augmentation Contract';

UPDATE contract_templates SET
  description = 'Time and material contract for projects with evolving requirements. Covers hourly/daily rates per role, material costs, time tracking and approval procedures, invoicing frequency, budget caps, change management, and project governance.',
  tags = ARRAY['time-material','flexible','hourly-rates','agile','budget','project-management']
WHERE name = 'Time & Material Contract';
