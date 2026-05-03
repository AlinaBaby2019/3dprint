# Aarhus 3D Print Platform Technical Architecture

## 1. Purpose

This document defines the first technical architecture for a small online 3D
printing service serving the Aarhus area.

The platform must support:

- Customer model upload and browser preview
- Quote-first custom 3D print workflow
- Product catalog and shopping cart
- Customer registration, addresses, and order status
- Admin review, quoting, and production tracking
- Danish, English, and optional Chinese language support
- Future compatibility with image-to-3D and text-to-3D modeling workflows

The design goal is low maintenance, stable operations, and a clean path from
MVP to more automated workflows.

## 2. Recommended Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Frontend | Next.js, React, TypeScript | Mature, good ecosystem, supports server and client code |
| Styling | Tailwind CSS or CSS Modules | Fast implementation, easy Nordic minimalist design |
| 3D preview | Three.js | Standard browser 3D rendering library |
| Backend API | Next.js Route Handlers | Keeps the MVP in one codebase |
| Database | Supabase Postgres | Managed Postgres, low maintenance |
| Authentication | Supabase Auth | Integrated with database and storage policies |
| File storage | Supabase Storage first | Simple permissions and fast MVP |
| Later file storage | Cloudflare R2 | Lower cost for large files and generated assets |
| Payments | Stripe first, MobilePay later | Stripe is easier for development; MobilePay improves Danish conversion |
| Email | Resend, Postmark, or SMTP | Transactional emails for quotes and order updates |
| Deployment | VPS Docker + Cloudflare DNS/CDN | Flexible enough for future Python workers |
| Admin | Custom admin pages first | Keeps workflow tailored to one-person operations |

Recommended initial setup:

```text
Next.js app on VPS
Supabase for Auth + Postgres + Storage
Cloudflare for DNS, CDN, WAF, and later R2
```

Cloudflare Pages is a possible later deployment target, but a VPS is more
flexible if slicer automation, Python modeling jobs, or background workers are
added.

## 3. Core Architecture

The system should be project-centered rather than order-centered.

```text
Project
  -> Project Files
  -> Quote
  -> Order
  -> Payment
  -> Print Job
  -> Delivery
```

This supports several customer entry points without redesigning the database:

- Existing model upload for printing
- Image-to-3D request
- Text-to-3D request
- Custom design request
- Product customization
- Business batch request

## 4. Main Business Workflows

### 4.1 Existing Model Print Workflow

```text
Customer uploads STL/3MF/OBJ/STEP
Customer previews model in browser
Customer selects material, color, quality, quantity, delivery method
System creates a project and preliminary estimate
Admin reviews model and confirms final quote
Customer accepts quote and pays
Admin adds print job to queue
Print job moves through production statuses
Order is delivered, shipped, or marked ready for pickup
```

The first version should not allow fully automatic payment for custom uploaded
models unless the quote has been manually confirmed.

### 4.2 Product Purchase Workflow

```text
Customer browses product catalog
Customer selects color and customization options
Customer adds product to cart
Customer checks out and pays
System creates order and print job
Admin prints and fulfills order
```

Product orders can be paid immediately because price and production risk are
known.

### 4.3 Future Image-To-3D Workflow

```text
Customer uploads one or more reference images
System creates image_to_model project
Admin or AI pipeline generates draft 3D model
Generated model is saved as project file
Admin checks printability and creates quote
Customer approves quote
Print workflow continues normally
```

The website must avoid promising instant printable models from images. The user
experience should make it clear that generated models are reviewed before
production.

## 5. Functional Modules

### 5.1 User Module

Responsibilities:

- Sign up and sign in
- Customer profile
- Saved addresses
- Optional company profile with CVR, EAN, invoice email
- Order and project history
- File ownership via Supabase Auth user ID

### 5.2 Project Module

Responsibilities:

- Create and track customer requests
- Support multiple project types
- Hold project-level status
- Connect files, quotes, orders, messages, and print jobs

Project types:

```text
print_existing_model
image_to_model
text_to_model
custom_design
product_customization
business_batch
```

MVP project types:

```text
print_existing_model
product_customization
```

### 5.3 File Module

Responsibilities:

- Upload customer files
- Store metadata such as MIME type, file size, path, and storage provider
- Attach files to projects
- Support future generated and repaired models

Supported MVP file types:

```text
.stl
.3mf
.obj
.step
.stp
.jpg
.jpeg
.png
.webp
.pdf
.zip
```

File roles:

```text
original_upload
reference_image
generated_model
repaired_model
sliced_file
preview_image
final_photo
```

Storage path convention:

```text
projects/{project_id}/uploads/
projects/{project_id}/generated/
projects/{project_id}/approved/
projects/{project_id}/print-files/
projects/{project_id}/photos/
```

### 5.4 Model Preview Module

Responsibilities:

- Render STL/OBJ/3MF in the browser where possible
- Show rotation, zoom, and pan controls
- Display bounding box dimensions
- Warn when dimensions exceed printer limits
- Avoid heavy server-side rendering

The Bambu printer build volume should be stored as configuration rather than
hard-coded into UI components.

Example configuration:

```text
max_x_mm = 256
max_y_mm = 256
max_z_mm = 260
```

### 5.5 Estimate Module

Responsibilities:

- Provide a preliminary customer-facing price range
- Avoid presenting the estimate as final price
- Include material, color, quality, quantity, urgency, and delivery method
- Later integrate slicer-derived print time and material usage

Initial estimate formula:

```text
estimated_price =
setup_fee
+ material_estimate * material_multiplier
+ quality_multiplier
+ quantity
+ support_or_complexity_fee
+ delivery_fee
```

Customer-facing wording:

```text
Estimated price: 120-180 DKK
Final quote after file review.
```

### 5.6 Quote Module

Responsibilities:

- Allow admin to confirm or modify the estimate
- Add production notes and material recommendations
- Set quote expiry date
- Set expected completion date
- Send quote to customer
- Convert accepted quote to order

Quote statuses:

```text
draft
sent
accepted
declined
expired
cancelled
```

### 5.7 Order Module

Responsibilities:

- Track paid and unpaid orders
- Connect quote orders and product orders
- Store order items, totals, VAT handling, and customer details
- Provide customer order status page

Order statuses:

```text
pending_payment
paid
in_production
ready
fulfilled
refunded
cancelled
```

### 5.8 Print Job Module

Responsibilities:

- Manage the production queue
- Track material, color, nozzle, layer height, and printer
- Track failures and reprints
- Store sliced file and final photos

Print job statuses:

```text
queued
printing
post_processing
ready
failed
reprinting
done
```

### 5.9 Product Module

Responsibilities:

- Display printed products
- Support made-to-order products
- Support color selection
- Support simple personalization such as name or text
- Support inventory or virtual inventory

Product types:

```text
standard_product
made_to_order
customizable_product
digital_design_service
```

### 5.10 Cart And Checkout Module

Responsibilities:

- Add products to cart
- Preserve selected color and customization options
- Convert cart to order
- Use Stripe Checkout for first implementation
- Later support MobilePay and invoice payment

Custom uploaded model projects should not go directly through cart until a quote
has been approved.

### 5.11 Payment Module

Responsibilities:

- Store provider references
- Verify payment webhooks
- Update order status
- Support refunds later
- Support multiple payment methods

Payment providers:

```text
stripe
mobilepay
bank_transfer
invoice
```

### 5.12 Delivery Module

Responsibilities:

- Support pickup, local delivery, and parcel shipping
- Store delivery address
- Track delivery status
- Allow admin delivery notes

Delivery methods:

```text
pickup_aarhus
local_delivery
parcel_shipping
```

Delivery statuses:

```text
not_required
pickup_ready
out_for_delivery
shipped
delivered
failed
```

### 5.13 Notification Module

Responsibilities:

- Quote sent
- Quote accepted
- Payment received
- Print started
- Print ready
- Delivery update
- Password/login emails via Supabase Auth

Email should be the MVP notification channel. SMS can be added later.

### 5.14 Admin Module

Responsibilities:

- View incoming projects
- Download project files
- View uploaded model preview
- Create and edit quotes
- Update order, print, and delivery statuses
- Manage products, materials, colors, and pricing rules
- Upload final photos
- See customer messages

The admin module is critical because the first version depends on manual review.

### 5.15 Multilingual Module

Supported languages:

```text
da
en
zh
```

Recommended public languages at launch:

```text
da
en
```

Chinese can be enabled for internal use or later public launch.

URL pattern:

```text
/da
/en
/zh
/da/print
/en/products
```

Translation strategy:

- Static UI copy in code-based translation files
- Product, material, FAQ, and policy content can later use database translations

Database translation field example:

```json
{
  "da": "Sort PLA",
  "en": "Black PLA",
  "zh": "黑色 PLA"
}
```

### 5.16 Legal And Trust Module

Required pages:

- Terms and conditions
- Privacy policy
- Cookie policy
- Upload file policy
- Refund and cancellation policy
- Material and strength disclaimer
- Business information with CVR

Important upload terms:

- Customer confirms they have the right to upload and print the model
- Customer understands uploaded files may require review or repair
- Final quote is confirmed manually before custom production

## 6. Database Model

### 6.1 Core Tables

```text
profiles
addresses
projects
project_files
quotes
orders
order_items
payments
print_jobs
deliveries
products
product_variants
cart_items
messages
material_options
color_options
audit_logs
```

### 6.2 Future AI Tables

```text
model_generation_jobs
model_generation_results
ai_usage_logs
```

### 6.3 Suggested Table Responsibilities

`profiles`

- Extends Supabase Auth users
- Stores name, phone, language, customer type

`addresses`

- Stores shipping, billing, and local delivery addresses

`projects`

- Main customer request object
- Stores type, status, selected options, and owner user ID

`project_files`

- Stores file metadata and storage paths
- Supports user uploads, generated models, repaired models, and final photos

`quotes`

- Stores admin-confirmed pricing and production notes

`orders`

- Stores payable customer order after quote acceptance or cart checkout

`order_items`

- Stores purchased products, quote items, or service items

`payments`

- Stores payment provider, reference IDs, status, and amount

`print_jobs`

- Stores production queue and printing metadata

`deliveries`

- Stores fulfillment method and delivery status

`products` and `product_variants`

- Store catalog products, color variants, and made-to-order options

`messages`

- Stores customer/admin communication attached to a project or order

`material_options` and `color_options`

- Store available materials, prices, colors, and in-stock flags

`audit_logs`

- Stores important admin actions and status changes

## 7. Status Model

### 7.1 Project Statuses

```text
draft
uploaded
needs_review
quoted
approved
in_production
completed
cancelled
```

### 7.2 Quote Statuses

```text
draft
sent
accepted
declined
expired
cancelled
```

### 7.3 Order Statuses

```text
pending_payment
paid
in_production
ready
fulfilled
refunded
cancelled
```

### 7.4 Print Job Statuses

```text
queued
printing
post_processing
ready
failed
reprinting
done
```

### 7.5 Delivery Statuses

```text
not_required
pickup_ready
out_for_delivery
shipped
delivered
failed
```

## 8. Storage Design

Initial storage:

```text
Supabase Storage
```

Future storage:

```text
Cloudflare R2
```

All stored files should record:

```text
storage_provider
bucket
path
mime_type
size_bytes
checksum
created_by
created_at
```

This makes it possible to migrate from Supabase Storage to R2 without changing
the business model.

## 9. Security And Privacy

### 9.1 Authentication

Use Supabase Auth for:

- Email/password
- Magic link later if desired
- Session management

### 9.2 Authorization

Use Row Level Security policies:

- Customers can only see their own projects, orders, files, quotes, and messages
- Admin can see all operational records
- Public users can only see published products and public pages

### 9.3 File Privacy

Uploaded files should not be public by default.

Recommended policy:

- Product images can be public
- Customer uploaded models and images are private
- Signed URLs are used for temporary access

### 9.4 Admin Secrets

Supabase service role key and Stripe secret key must only be used on the server.
They must never be exposed in browser code.

## 10. API Design

Initial API routes:

```text
POST /api/projects
POST /api/projects/{id}/files
POST /api/projects/{id}/estimate
POST /api/quotes/{id}/accept
POST /api/checkout
POST /api/webhooks/stripe
GET  /api/order-status
```

Admin API routes:

```text
GET    /api/admin/projects
PATCH  /api/admin/projects/{id}
POST   /api/admin/quotes
PATCH  /api/admin/print-jobs/{id}
PATCH  /api/admin/deliveries/{id}
```

## 11. Frontend Pages

Public pages:

```text
/
/{locale}
/{locale}/print
/{locale}/print/upload
/{locale}/products
/{locale}/products/{slug}
/{locale}/cart
/{locale}/checkout
/{locale}/order-status
/{locale}/materials
/{locale}/faq
/{locale}/terms
/{locale}/privacy
```

Account pages:

```text
/{locale}/account
/{locale}/account/projects
/{locale}/account/orders
/{locale}/account/addresses
```

Admin pages:

```text
/admin
/admin/projects
/admin/orders
/admin/quotes
/admin/print-jobs
/admin/products
/admin/materials
/admin/settings
```

## 12. Background Jobs

MVP background jobs:

- Send email after quote is created
- Send email after payment is confirmed
- Clean expired upload drafts

Future background jobs:

- Slicer-based price calculation
- Image-to-3D generation
- Model repair pipeline
- Preview image rendering
- File migration from Supabase Storage to R2

Future Python worker responsibilities:

- Run slicer CLI
- Run Blender scripts
- Call AI model generation services
- Validate or repair mesh files
- Generate preview thumbnails

## 13. Deployment Architecture

Recommended MVP deployment:

```text
Cloudflare DNS/CDN
        |
        v
VPS running Docker
        |
        v
Next.js application
        |
        +--> Supabase Auth
        +--> Supabase Postgres
        +--> Supabase Storage
        +--> Stripe
        +--> Email provider
```

Later:

```text
Next.js app
Python worker
Cloudflare R2
Queue system
Slicer automation
AI modeling provider
```

## 14. MVP Scope

### Phase 1

- Nordic minimalist homepage
- Danish and English UI
- Model upload form
- Browser 3D preview
- Preliminary estimate
- User registration and login
- Address collection
- Project creation
- Admin project review
- Manual quote creation
- Product catalog
- Cart
- Stripe Checkout integration placeholder
- Order status page

### Phase 2

- Supabase Storage policies
- Transactional emails
- Real Stripe Checkout
- MobilePay Business support
- Invoice details for business customers
- Material and color inventory
- Product customization fields
- Final production photo uploads

### Phase 3

- Slicer-based quote automation
- Image-to-3D project workflow
- Text-to-3D project workflow
- Python worker pipeline
- Cloudflare R2 storage migration
- Business account features
- Batch order tools

## 15. Design Direction

The frontend should use a Nordic minimalist style:

- Quiet neutral background
- Clear typography
- Muted colors with restrained accents
- Practical workflow-first layout
- Dense but readable admin screens
- No decorative-heavy landing page
- Product and print workflows visible immediately

The main screen should make the service clear in the first viewport:

```text
Local 3D printing in Aarhus
Upload a model, get a quote, receive locally
```

## 16. Key Technical Decisions

1. Use a project-centered model to keep future AI modeling compatible.
2. Use manual quote confirmation for custom prints in the MVP.
3. Use Supabase first for database, authentication, and private files.
4. Keep Cloudflare R2 as a future storage provider for large files.
5. Keep slicer and AI workloads out of normal web requests.
6. Add Python workers later for modeling, mesh repair, and quote automation.
7. Deploy on VPS first for flexibility, while using managed Supabase services to
   reduce operational maintenance.

## 17. Implementation Progress

Last updated: 2026-05-03 (session 7)

### Completed

- Public multilingual homepage for Danish, English, and Chinese routes.
- Model upload form with STL browser preview, preliminary quote range, material,
  color, quality, quantity, and delivery selections.
- Client-side file size limit check (100 MB) before upload attempt.
- Supabase-backed project creation and private customer file upload path
  convention.
- Supabase Auth sign up, sign in, sign out, and account navigation.
- Customer address management on the account page, including saved addresses and
  default address selection. Default address switching uses a single Postgres
  function (`set_default_address`) to avoid a two-query race condition.
- Customer account project history showing submitted projects, project status,
  selected print options, preliminary estimate, and latest quote when available.
  Projects with a `sent` quote show an accept button that triggers payment.
- Admin dashboard at `/[locale]/admin` with `profiles.is_admin` access check,
  incoming project queue, project file metadata, quote create/update form,
  project/print status controls, and signed URL download for private files.
- Admin RLS write policies for quotes and print jobs in
  `20260502071500_admin_write_policies.sql`.
- Admin order queue at `/[locale]/admin` showing all orders with order status
  and delivery status controls. RLS update policies for orders and deliveries
  added in `20260502084000_admin_order_policies.sql`.
- Admin quote email notification: "Send quote to customer" button on the quote
  form triggers `POST /api/admin/notify-quote`, which sends a Resend email with
  quote amount, expiry, and expected completion to the project owner.
- Customer quote acceptance: projects with `sent` quote status show an "Accept
  quote & pay" button in the account page. Clicking it calls
  `POST /api/quotes/[id]/accept` (creates order) then `POST /api/checkout`
  (creates Stripe session) and redirects the customer to Stripe Checkout.
- Product and material catalog display using local static assets.
- Product cart with color selection, quantity, personalization text for
  customizable products, local cart persistence, subtotal, and saved address
  selection.
- Checkout RLS write policies for `orders`, `order_items`, and `deliveries`
  added in `20260502074000_checkout_write_policies.sql`.
- Stripe Checkout session creation at `POST /api/checkout`. Product checkout
  creates a Supabase order then redirects through Stripe. Requires
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`.
- Stripe webhook handler at `POST /api/webhooks/stripe` updates order status to
  `paid` and inserts a `payments` record on `checkout.session.completed`.
  Requires `STRIPE_WEBHOOK_SECRET`.
- `payments` table with RLS policies in
  `20260502083000_payments_table.sql`.
- `print_jobs` RLS policy fixed to also cover order-owned jobs in
  `20260502081000_fix_print_jobs_rls.sql`.
- Quote acceptance flow: `POST /api/quotes/[id]/accept` creates order from
  accepted quote and returns an order ID ready for Stripe checkout.
- Order confirmation email sent on successful Stripe webhook via Resend.
- Order status lookup on the homepage backed by live Supabase queries.
- Checkout success page at `/[locale]/checkout/success`.
- Legal pages at `/[locale]/terms` and `/[locale]/privacy` with full content
  in Danish, English, and Chinese.
- Footer links to terms and privacy on all pages.
- Printer build volume in shared configuration (`src/lib/print-config.ts`).
- Complete i18n coverage across all three languages for all UI sections.
- Docker Compose deployment on the VPS using the Next.js standalone build
  on port 3000.
- Business customer profile fields in the account page: full name, phone,
  customer type (private/business), company name, CVR, EAN, and invoice email.
  Data saved to `profiles` table with existing RLS update policy.
- Admin products management panel at `/[locale]/admin`: lists all database
  products with slug, name, price (inline edit), and active toggle. Supports
  adding new products with slug, name, price, and category. Implemented in
  `src/components/admin-products.tsx`.
- `AccountNav` label prop made optional to fix type errors in legal pages that
  do not show navigation labels.
- Stripe client initialization deferred to call time (`getStripe()`) to prevent
  build-time crashes when `STRIPE_SECRET_KEY` is absent.
- Product catalog database sync: migration
  `20260502091000_seed_products.sql` seeds the four launch products into the
  `products` table with multilingual names and metadata (colors, customizable,
  lead_time, image_url). The `ProductCatalog` component now loads from Supabase
  and falls back to static `catalog.ts` only when the DB returns no rows.
- Admin production photo upload: admin can attach photos (JPEG/PNG/WebP) to any
  project via the admin detail panel. Files are uploaded to the `project-files`
  Supabase Storage bucket under the project owner's user path and recorded in
  `project_files` with role `final_photo`. Uploaded photos appear in the project
  file list with a signed URL download button.
- Customer-facing production photo gallery: account page project cards show a
  "View photos" button when `final_photo` files exist. Signed URLs are generated
  in batch via `createSignedUrls` and rendered as thumbnail images linking to
  full size.
- Order status notification emails: when admin saves order status to
  `in_production`, `ready`, or `fulfilled`, a checkbox triggers
  `POST /api/admin/notify-order-status` which sends a localized Resend email to
  the customer. Three email templates in Danish, English, and Chinese.
- Admin payments view at `/[locale]/admin`: lists all payments with provider,
  reference, amount, status, and date. Admin can mark a paid payment as
  refunded. RLS write policy added in `20260502092000_payments_admin_write.sql`.
- SEO `generateMetadata()` on all locale pages (account, admin, checkout/success,
  all legal pages, faq, print, products).
- FAQ page at `/[locale]/faq` with 8 Q&A items in Danish, English, and Chinese.
  Navigation and footer links included.
- Dedicated `/[locale]/print` page (wraps PrintUpload + process panel) and
  `/[locale]/products` page (wraps ProductCatalog).
- Account page tab navigation: Profile | Projects (N) | Addresses via `activeTab`
  state. Status badges with i18n labels and colour coding.
- Mobile nav: smaller font/padding at 560px breakpoint; account tabs wrap on
  small screens. Nav active state highlighted with accent colour.
- Unit tests via Vitest (`vitest.config.ts`, 23 tests across i18n, print-config,
  email). E2E tests via Playwright (`playwright.config.ts`, 5 spec files).
- Bug fix: `POST /api/quotes/[id]/accept` now inserts a `deliveries` row with
  the correct method (`pickup_aarhus` / `local_delivery` / `shipping`) and the
  selected `address_id`. Previously no delivery record was created, breaking
  the admin order fulfilment view.
- Bug fix: account panel now shows an inline address picker before accepting a
  quote when the project delivery method is "Local delivery" or "Shipping".
  Pickup orders proceed directly to payment. Selected `address_id` is sent to
  the accept API and stored on the delivery record.
- Bug fix: delivery method in project list is now shown as a localized label
  (da/en/zh) instead of the raw English database value.
- Bug fix: address query in account panel includes an explicit
  `.eq("user_id", currentUserId)` filter for clarity alongside RLS.
- Bug fix: hardcoded English "Pending" fallback in project price display replaced
  with locale-neutral "—".
- Nordic UI polish: h1 `line-height` adjusted from 0.98 → 1.04 for better
  readability. Process step numbers rendered as filled accent-green circle
  badges (28 px). Material cards have a 3 px left accent-border. Adjacent
  `.section` blocks separated by a 1 px border-top divider.
- i18n: five new keys added to `account` section in all three locales:
  `deliveryPickup`, `deliveryLocal`, `deliveryShipping`, `selectAddress`,
  `confirmAndPay`.

### In Progress

- Resend email integration is wired and will activate once `RESEND_API_KEY`
  and `EMAIL_FROM` are set in the environment. Email is sent for quote
  notifications and order confirmations. No email is sent if the key is absent.
- Stripe integration is wired and will activate once the three Stripe
  environment variables are set. Product checkout and quote-based checkout
  share the same `/api/checkout` route.
- Supabase must be linked to a dedicated project named `aarhus-3d-print`
  before pushing migrations. Do not reuse the existing `FlexWork` project.

### Admin Module Status

Current status: fully implemented for MVP.

Implemented:

- Protected `/[locale]/admin` route gated by `profiles.is_admin`.
- Incoming project queue with status filters and project detail view.
- Project file metadata, quote create/update form, status controls.
- Signed URL download for private project files.
- Admin production photo upload (`final_photo` role, Supabase Storage).
- Customer ↔ admin messaging with internal note support.
- Order queue with order/delivery status controls and status notification emails.
- Quote email notification trigger (`POST /api/admin/notify-quote`).
- Material and color management (CRUD with multiplier and stock fields).
- Products management (DB-backed CRUD, slug, name, price, active toggle).
- Payments view with refund marking.

### Next Planned Work

- Supabase project setup: link CLI to dedicated `aarhus-3d-print` project and
  push all migrations in `supabase/migrations/`.
- Deploy to VPS: build Docker image, configure `.env.production`, run
  `docker compose up`.
- Slicer-based quote automation to replace file-size estimate.
- Playwright browser install (`npx playwright install chromium`) and E2E run
  against dev server.
- CSS polish: photo grid styles, status badge styles, and checkbox-label styles
  for the new UI elements need to be added to globals.css.
- SEO and meta tags: `<title>` and `<meta description>` for each locale page.
- Supabase project setup and migration push (dedicated `aarhus-3d-print` project).
