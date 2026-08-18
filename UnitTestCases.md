# Unit & System Test Cases Specification

**Project**: Cruise Booking System  
**Author**: Visaveliya Yagnik  

This document details the complete test suite matrix designed to validate all functional requirements, business pricing rules, edge cases, boundary conditions, concurrency constraints, and quote/confirm price consistency.

---

## Complete Test Matrix (23 Test Cases)

| ID | Category | Scenario Description | Input / Pre-conditions | Expected Result |
|---|---|---|---|---|
| **TC-PAS-01** | Passenger | 0 adults in booking | 0 Adults, 1 Child (Age 10) | REJECTED (HTTP 400): "At least one adult (age 18+) is required" |
| **TC-PAS-02** | Passenger | 1 adult booking | 1 Adult (Age 30), Royal Caribbean ($1,200) | SUCCESS (HTTP 200): Charged = $1,344.00 ($1,200 + 12% tax) |
| **TC-PAS-03** | Passenger | 6 passengers (Maximum limit) | 2 Adults, 4 Children (ages 4, 5, 11, 17) | SUCCESS (HTTP 200): Total pax = 6 |
| **TC-PAS-04** | Passenger | 7 passengers (Exceed limit) | 7 Passengers | REJECTED (HTTP 400): "Maximum 6 passengers allowed" |
| **TC-PAS-05** | Passenger | Age 0-4 boundary (Age 0 & Age 4) | 1 Adult, Child Age 0, Child Age 4 | Child fares = $0 (100% Free) |
| **TC-PAS-06** | Passenger | Age 5-11 boundary (Age 5 & Age 11) | 1 Adult, Child Age 5, Child Age 11 | Child fares = 50% of adult fare ($600 each) |
| **TC-PAS-07** | Passenger | Age 12-17 boundary (Age 12 & Age 17) | 1 Adult, Child Age 12, Child Age 17 | Child fares = 75% of adult fare ($900 each) |
| **TC-PAS-08** | Passenger | Age 18 boundary (Adult transition) | 1 Passenger Age 18 | Counted as Adult (100% fare = $1,200) |
| **TC-GRP-01** | Group | 1 passenger -> 0% discount | 1 Pax | Group discount = 0% ($0) |
| **TC-GRP-02** | Group | 2 passengers -> 0% discount | 2 Pax | Group discount = 0% ($0) |
| **TC-GRP-03** | Group | 3 passengers -> 5% discount | 3 Pax | Group discount = 5% on cruise fare subtotal |
| **TC-GRP-04** | Group | 4 passengers -> 5% discount | 4 Pax | Group discount = 5% on cruise fare subtotal |
| **TC-GRP-05** | Group | 5 passengers -> 10% discount | 5 Pax | Group discount = 10% on cruise fare subtotal |
| **TC-GRP-06** | Group | 6 passengers -> 10% discount | 6 Pax | Group discount = 10% on cruise fare subtotal |
| **TC-SRV-01** | Add-on Services | Insurance + Wi-Fi + Excursion | 2 Pax, 7 Nights cruise | Insurance = $160, Wi-Fi = $210, Excursion = $240 |
| **TC-PRM-01** | Promo Code | Valid percentage (SUMMER10) | Subtotal >= $1,000 | Discount = 10% on pre-tax subtotal |
| **TC-PRM-02** | Promo Code | Valid fixed (FIRST150) | Subtotal >= $2,000 | Discount = $150.00 |
| **TC-PRM-03** | Promo Code | Minimum spend not met | Subtotal = $1,200 < $2,000 min spend | REJECTED (HTTP 400): "Minimum spend of $2,000 required" |
| **TC-PRM-04** | Promo Code | Expired promo (WINTER5) | Valid to date 2025-03-31 | REJECTED (HTTP 400): "Promotional code is expired" |
| **TC-CAP-01** | Capacity | Zero remaining capacity (MSC) | Request booking on MSC Cruises (Capacity = 0) | REJECTED (HTTP 400): "Insufficient capacity remaining" |
| **TC-QTE-01** | Consistency | Quote vs Confirm price check | `POST /quotes` vs `POST /bookings` | Quote final total equals confirmed charged amount exactly |
| **TC-REC-01** | Historical | Reconstruction integrity | `GET /api/bookings/:reference` | Returns exact stored financial snapshot |
| **TC-ENG-01** | Pure Engine | Independent PricingEngine | Zero DB dependencies | Computes exact integer cents breakdown synchronously |

---

## Running Test Suite

```bash
# Execute 23 Vitest test cases
npm run test
```
