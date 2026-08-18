# Business Requirements & Assessment Analysis

**Project**: Cruise Booking System  
**Company Assessment**: Odysseus Solutions - Campus Placement Technical Assessment  
**Author**: Visaveliya Yagnik  

---

## 1. Overview & Understanding of the Brief

Odysseus Solutions requires a **Cruise Booking System** where customers can:
1. Browse available cruises (with live capacity tracking).
2. Specify passenger breakdown (adults 18+, children 0-17 with exact age entry).
3. Select optional add-on services (Insurance, Wi-Fi, Shore Excursions).
4. View a real-time itemized price breakdown (base fare, child discount rates, group discount on cruise fare, optional add-ons, promotional code discount, and tax).
5. Apply promotional codes with real-time validation against date validity, global usage limits, per-customer usage limits, and minimum spend rules.
6. Complete and confirm bookings with a unique reference code.
7. Reconstruct historic bookings with 100% precision even after base prices, child discount tiers, group discount rules, optional service fees, tax rates, or promotional codes change.

---

## 2. Business Rules & Specifications

### 2.1 Passenger Definitions & Capacity Limits
- **Adult**: Age 18 and older. Must pay 100% of adult base fare.
- **Child**: Age 0 to 17.
  - **Age 0 - 4**: **Free** (100% discount on adult base fare).
  - **Age 5 - 11**: **50% of adult base fare** (50% discount).
  - **Age 12 - 17**: **75% of adult base fare** (25% discount).
- **Booking Guardrails**:
  - Minimum **1 adult** required per booking.
  - Maximum **6 total passengers** per booking (adults + children).
  - Booking cannot exceed available cruise passenger capacity (`capacity_left >= total_passengers`).

### 2.2 Pricing Calculation Pipeline
The system calculates pricing in a strict sequential order:

$$\text{Cruise Base Fare} = \sum_{\text{pax}} \text{Fare}(\text{age})$$

1. **Individual Cruise Fares**: Calculate fare for each passenger based on age band percentages.
2. **Group Discount** (Applied exclusively to cruise fare subtotal):
   - 1 – 2 passengers: 0% discount
   - 3 – 4 passengers: 5% discount on cruise fare
   - 5 – 6 passengers: 10% discount on cruise fare
3. **Net Cruise Fare**: $\text{Cruise Base Fare} - \text{Group Discount Amount}$.
4. **Optional Services**:
   - **Insurance**: \$80 per passenger (charged for all passengers).
   - **Wi-Fi**: \$15 per passenger per night (Charged as: $\$15 \times \text{total passengers} \times \text{cruise nights}$).
   - **Shore Excursion**: \$120 per passenger (charged for all passengers).
5. **Subtotal Before Promo**: $\text{Net Cruise Fare} + \text{Optional Services Total}$.
6. **Promotional Discount Application**:
   - Promo code validation rules:
     - Must exist and be active.
     - Current date must fall within `[Valid From, Valid To]`.
     - `current_uses < max_total_uses`.
     - Customer's redemptions for this code `< max_uses_per_customer`.
     - Subtotal before promo must satisfy $\ge \text{min\_spend}$.
   - Promo Types:
     - **Percentage**: Discount = $\text{Subtotal Before Promo} \times \text{Percentage Value}$.
     - **Fixed**: Discount = $\text{Fixed Value}$ (capped at Subtotal Before Promo so total never drops below \$0).
7. **Net Payable Before Tax**: $\text{Subtotal Before Promo} - \text{Promo Discount}$.
8. **Tax Calculation (12%)**: Applied at 12% on the Net Payable Before Tax.
9. **Final Charged Amount**: $\text{Net Payable Before Tax} + \text{Tax Amount}$.

---

## 3. Identified Gaps, Conflicts & Design Assumptions

| # | Ambiguity / Gap in Brief | Resolution & Assumption Made |
|---|--------------------------|------------------------------|
| **1** | **Tax Point Application (Sec 5.6)**: The brief states: *"A tax of 12% applies. Determining the correct point at which to apply it is part of the exercise."* | **Decision**: Tax is applied on the post-discount, post-service net total ($\text{Net Payable Before Tax}$). Taxing after promo discounts and optional add-ons ensures compliance with standard sales tax practices (taxing actual monetary transaction value). |
| **2** | **Group Discount Scope (Sec 5.3)**: Brief specifies *"Applied to the cruise fare only"*. | **Decision**: Group discount percentage (5% or 10%) is calculated strictly on the total cruise fare of all passengers before adding optional services, tax, or promo codes. |
| **3** | **Minimum Spend Scope (Sec 5.5)**: Should minimum spend check base fare or total order value? | **Decision**: Minimum spend evaluates against the combined subtotal of Net Cruise Fare + Optional Services prior to promo code deduction. |
| **4** | **Optional Services Per Passenger (Sec 5.4)**: Are children charged optional services at full price? | **Decision**: Optional services (Insurance \$80, Excursions \$120, Wi-Fi \$15/night) are flat rates charged per passenger standard rate, regardless of passenger age. |
| **5** | **Dynamic Rule Changes (Req 10)**: *"Fares, child age bands, discount tiers, tax rates, promo codes change regularly without requiring code changes or redeployment."* | **Decision**: Implemented DB-backed pricing rule tables (`pricing_rules`, `child_age_bands`, `group_discount_tiers`, `optional_services`, `promotional_codes`). System fetches live DB rules during calculation. |
| **6** | **Historical Price Reconstruction (Req 8)**: *"Amount charged for any booking must be fully reconstructable from stored data at any point in the future after rules change."* | **Decision**: Implemented an immutable `booking_items` and snapshot fields on `bookings` table. Upon booking confirmation, the exact breakdown (individual passenger fares, group discount applied, add-on unit prices, promo code value snapshot, and tax) is frozen into the database. |
| **7** | **Overbooking & Concurrency (Req 5 & 6)**: Avoid selling more than capacity or exceeding promo usage limit under concurrent requests. | **Decision**: Enforced PostgreSQL atomic row updates with guard clauses (`capacity_left >= req_pax` and `current_uses < max_total_uses`) inside transactional isolation blocks. |

---

## 4. User Journeys

### 4.1 Customer Search & Booking Journey
1. **Browse Cruises**: View list of destination cruises with nights, base fare, and live capacity badge.
2. **Configure Passenger Details**: Select adult count (>= 1) and child count (0..5), enter child ages (0-17).
3. **Select Add-ons**: Check optional Wi-Fi, Insurance, Shore Excursion.
4. **Apply Promo Code**: Enter code (e.g. `SUMMER10`, `FIRST150`), view instant feedback on discount amount or rejection reason (e.g., expired `WINTER5`, minimum spend not met, cap reached).
5. **Review Transparent Breakdown**: See line-by-line itemized invoice.
6. **Confirm Booking**: Enter customer info (name, email, phone) -> system atomically decrements cruise capacity, records promo usage, and generates reference code (e.g. `CRZ-7A9B3C`).

### 4.2 Historic Booking Lookup Journey
1. Enter unique reference code into lookup portal.
2. View exact historic price snapshot reconstructable verbatim from stored booking record.
