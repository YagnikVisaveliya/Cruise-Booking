# Technical Approach & System Architecture

**Project**: Cruise Booking System  
**Tech Stack**: React.js (Vite Frontend), Node.js / Express.js (Modular Monolith Backend), PostgreSQL + Prisma ORM (Database Layer)  
**Validation & Testing**: Zod Request Validation, Vitest + Supertest  
**Author**: Visaveliya Yagnik  

---

## 1. Modular Monolith Architecture

The application is engineered as a clean **Modular Monolith**:

| Component | Technology | Rationale |
| --- | --- | --- |
| **Language** | **TypeScript** | Strict type-safety across frontend and backend models |
| **Backend** | **Node.js + Express.js** | Fast, light, and predictable REST API routes |
| **Database** | **PostgreSQL** | ACID transaction compliance & row locking |
| **ORM** | **Prisma ORM** | Type-safe schema definition, migrations, and model queries |
| **Frontend** | **React + Vite** | Fast SPA development with instant HMR |
| **Validation** | **Zod** | Declarative runtime request payload validation |
| **Testing** | **Vitest + Supertest** | Blazing fast integration and API endpoint testing |
| **IDs** | **UUID (`v4`)** | Globally unique identifiers for booking references & entity primary keys |
| **Money Handling** | **Integer Cents** | Prevents IEEE 754 floating-point rounding errors (e.g. `$1,200.00` stored as `120000` cents) |

---

## 2. Prisma ORM Relational Schema & Models

```prisma
// Datasource & Client Generator
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model PricingRule {
  key       String   @id
  value     Json
  updatedAt DateTime @default(now()) @map("updated_at")

  @@map("pricing_rules")
}

model ChildAgeBand {
  id                 String   @id @default(uuid())
  minAge             Int      @map("min_age")
  maxAge             Int      @map("max_age")
  discountPercentage Float    @map("discount_percentage")
  description        String?

  @@map("child_age_bands")
}

model GroupDiscountTier {
  id                 String @id @default(uuid())
  minPassengers      Int    @map("min_passengers")
  maxPassengers      Int    @map("max_passengers")
  discountPercentage Float  @map("discount_percentage")

  @@map("group_discount_tiers")
}

model OptionalService {
  id             String @id
  name           String
  unitPriceCents Int    @map("unit_price_cents")
  pricingUnit    String @map("pricing_unit")

  @@map("optional_services")
}

model Cruise {
  id             String    @id @default(uuid())
  cruiseLine     String    @map("cruise_line")
  shipName       String    @map("ship_name")
  destination    String
  nights         Int
  adultFareCents Int       @map("adult_fare_cents")
  capacityTotal  Int       @map("capacity_total")
  capacityLeft   Int       @map("capacity_left")
  imageUrl       String?   @map("image_url")
  createdAt      DateTime  @default(now()) @map("created_at")
  bookings       Booking[]

  @@map("cruises")
}

model PromotionalCode {
  id                 String            @id @default(uuid())
  code               String            @unique
  discountType       String            @map("discount_type")
  discountValue      Float             @map("discount_value")
  validFrom          DateTime          @map("valid_from")
  validTo            DateTime          @map("valid_to")
  maxTotalUses       Int               @map("max_total_uses")
  maxUsesPerCustomer Int               @map("max_uses_per_customer")
  minSpendCents      Int               @default(0) @map("min_spend_cents")
  currentUses        Int               @default(0) @map("current_uses")
  bookings           Booking[]
  redemptions        PromoRedemption[]

  @@map("promotional_codes")
}

model Customer {
  id          String            @id @default(uuid())
  firstName   String            @map("first_name")
  lastName    String            @map("last_name")
  email       String            @unique
  phone       String?
  createdAt   DateTime          @default(now()) @map("created_at")
  bookings    Booking[]
  redemptions PromoRedemption[]

  @@map("customers")
}

model Booking {
  id                              String             @id @default(uuid())
  bookingReference                String             @unique @map("booking_reference")
  customerId                      String             @map("customer_id")
  cruiseId                        String             @map("cruise_id")
  nightsSnapshot                  Int                @map("nights_snapshot")
  adultFareCentsSnapshot          Int                @map("adult_fare_cents_snapshot")
  totalPassengers                 Int                @map("total_passengers")
  adultCount                      Int                @map("adult_count")
  childCount                      Int                @map("child_count")
  grossCruiseFareCents            Int                @map("gross_cruise_fare_cents")
  groupDiscountPercentageSnapshot Float              @default(0.0) @map("group_discount_percentage_snapshot")
  groupDiscountAmountCents        Int                @default(0) @map("group_discount_amount_cents")
  netCruiseFareCents              Int                @map("net_cruise_fare_cents")
  optionalServicesTotalCents      Int                @default(0) @map("optional_services_total_cents")
  subtotalBeforePromoCents        Int                @map("subtotal_before_promo_cents")
  promoCodeId                     String?            @map("promo_code_id")
  promoCodeNameSnapshot           String?            @map("promo_code_name_snapshot")
  promoDiscountAmountCents        Int                @default(0) @map("promo_discount_amount_cents")
  netPayableBeforeTaxCents        Int                @map("net_payable_before_tax_cents")
  taxRatePercentageSnapshot       Float              @map("tax_rate_percentage_snapshot")
  taxAmountCents                  Int                @map("tax_amount_cents")
  totalAmountChargedCents         Int                @map("total_amount_charged_cents")
  status                          String             @default("CONFIRMED")
  createdAt                       DateTime           @default(now()) @map("created_at")
  
  customer                        Customer           @relation(fields: [customerId], references: [id])
  cruise                          Cruise             @relation(fields: [cruiseId], references: [id])
  promotionalCode                 PromotionalCode?   @relation(fields: [promoCodeId], references: [id])
  passengers                      BookingPassenger[]
  services                        BookingService[]
  redemptions                     PromoRedemption[]

  @@map("bookings")
}

model BookingPassenger {
  id                              String   @id @default(uuid())
  bookingId                       String   @map("booking_id")
  passengerType                   String   @map("passenger_type")
  age                             Int
  baseFareCentsSnapshot           Int      @map("base_fare_cents_snapshot")
  childDiscountPercentageSnapshot Float    @default(0.0) @map("child_discount_percentage_snapshot")
  chargedFareCents                Int      @map("charged_fare_cents")

  booking                         Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@map("booking_passengers")
}

model BookingService {
  id                     String   @id @default(uuid())
  bookingId              String   @map("booking_id")
  serviceId              String   @map("service_id")
  serviceNameSnapshot    String   @map("service_name_snapshot")
  unitPriceCentsSnapshot Int      @map("unit_price_cents_snapshot")
  quantity               Int
  totalChargedCents      Int      @map("total_charged_cents")

  booking                Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@map("booking_services")
}

model PromoRedemption {
  id            String          @id @default(uuid())
  promoCodeId   String          @map("promo_code_id")
  customerId    String          @map("customer_id")
  bookingId     String          @map("booking_id")
  redeemedAt    DateTime        @default(now()) @map("redeemed_at")

  promotionalCode PromotionalCode @relation(fields: [promoCodeId], references: [id])
  customer        Customer        @relation(fields: [customerId], references: [id])
  booking         Booking         @relation(fields: [bookingId], references: [id])

  @@map("promo_redemptions")
}
```

---

## 3. Zod Request Validation Strategy

Input requests are parsed using strict Zod schemas before hitting business logic:

```typescript
export const calculatePriceSchema = z.object({
  cruise_id: z.union([z.string().uuid(), z.number()]),
  passengers: z
    .array(passengerInputSchema)
    .min(1, 'At least one passenger must be specified')
    .max(6, 'Maximum 6 passengers allowed per booking')
    .refine(
      pax => pax.some(p => p.type === 'adult' || p.age >= 18),
      { message: 'At least one adult (age 18+) is required per booking.' }
    ),
  selected_services: z.array(z.string()).optional(),
  promo_code: z.string().optional()
});
```

---

## 4. Integer Cents Precision & Immutability

1. All monetary values in calculations and database storage are represented as **Integer Cents**:
   $$\text{Amount in Cents} = \text{Math.round}(\text{Amount in Dollars} \times 100)$$
2. When creating a booking, Prisma creates the line items and main header in an isolated database transaction, freezing the exact cents charged for every passenger and add-on service.

---

## 5. Vitest + Supertest Integration Suite

API endpoints are automatically verified using Vitest test runner and Supertest HTTP assertions:
```bash
# Run Vitest test suite
npm run test
```
Tests cover catalog endpoints, price previews, group discounts, child age bands, Zod validation rejections, capacity protection, promo code expirations, and historical price reconstructions.
