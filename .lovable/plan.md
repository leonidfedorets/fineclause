## Plan: AI Invoice & Document Automation MVP

### 1. Create Stripe product & price
- New product: "Invoice AI" at €20/mo recurring

### 2. Add subscription tier
- Add `invoice` tier to `subscriptionTiers.ts` with Stripe IDs
- Update `PricingSection`, `SubscriptionDialog` to show the new tier

### 3. Database: `invoices` table
- Fields: id, user_id, client_name, client_email, items (jsonb), total, currency, status, pdf_path, created_at
- RLS: users can CRUD their own invoices

### 4. Storage bucket: `invoices`
- Private bucket for generated PDF invoices

### 5. Edge function: `generate-invoice`
- Accept invoice data (client info, line items, tax %, notes)
- Use AI to format and validate
- Generate PDF, upload to storage, save record to DB

### 6. Frontend: `/invoices` page
- Invoice form: client name/email, line items (description, qty, price), tax %, notes
- AI-assisted: auto-suggest formatting, validate tax compliance
- Invoice list/registry with download links
- Protected route, gated to `invoice` tier subscribers

### 7. Navigation & i18n
- Add "Invoices" to navbar dropdown
- Add English translations (other languages can follow)
