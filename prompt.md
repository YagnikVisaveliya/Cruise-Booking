I am building a Cruise Booking System for a technical assessment.

I will provide the complete assessment requirements below. Do NOT write any code yet.

Your job is to deeply analyze the requirements and produce:

1. Functional requirements
2. Business rules
3. Pricing rules
4. Promotional-code rules
5. Capacity and booking rules
6. Data that must be persisted
7. Important edge cases
8. Ambiguities or missing requirements
9. Sensible assumptions we should make
10. Acceptance criteria for each requirement

Pay special attention to these requirements:

* Customers can search available cruises.
* Customers specify adults, number of children, and each child's age.
* At least one adult is required.
* Maximum 6 passengers per booking.
* Children aged 0–4 are free.
* Children aged 5–11 pay 50% of adult fare.
* Children aged 12–17 pay 75% of adult fare.
* Age 18+ is an adult.
* Group discount applies to cruise fare only:
  1–2 passengers: 0%
  3–4 passengers: 5%
  5–6 passengers: 10%
* Optional services:
  Insurance: $80 per passenger
  Wi-Fi: $15 per passenger per night
  Shore Excursion: $120 per passenger
* One promotional code can be used per booking.
* Promotional codes can be percentage or fixed amount.
* Promotional codes have validity dates.
* Promotional codes have maximum total uses.
* Promotional codes have maximum uses per customer.
* Promotional codes have minimum spend.
* Invalid, expired, exhausted, or inapplicable codes must be rejected with a clear reason.
* A cruise must never be oversold.
* A confirmed booking must have a unique reference.
* The final charged amount must be reconstructable permanently even after pricing rules change.
* The price shown before confirmation must be exactly the amount charged.
* Changing fares, child fare bands, discounts, tax, or promotional codes must not require code deployment.

Also analyze the seed cruise and promotion data from the assessment.

Do not implement anything yet.

At the end, give me a concise list of design decisions we need to make before coding.





Based on the Cruise Booking System requirements I provided, recommend the best technology stack for completing this technical assessment within approximately 110 minutes.

Compare these options where relevant:

* Node.js + TypeScript + Express
* Node.js + TypeScript + NestJS
* C# + ASP.NET Core
* PostgreSQL
* MySQL
* MongoDB
* Prisma
* Entity Framework

Consider:

1. Development speed
2. Reliability
3. Transaction support
4. Concurrency handling
5. Data consistency
6. Ability to model bookings and promotional-code redemptions
7. Ability to reconstruct historical prices
8. Ease of testing
9. Ease of explaining the architecture during an interview
10. My existing experience with Node.js, TypeScript, Express, PostgreSQL and Prisma
11. The 110-minute assessment limit

Recommend one final stack rather than giving me too many alternatives.

Prefer a simple modular monolith over microservices.

Also tell me which technologies we should deliberately NOT use because they would add unnecessary complexity.

Do not write implementation code yet.





Architecture

Design the architecture for the Cruise Booking System using:

* TypeScript
* Node.js
* Express.js
* PostgreSQL
* Prisma
* Zod

Use a modular monolith architecture.

Design the project so that the following business areas are separated:

1. Cruise management
2. Customer management
3. Booking management
4. Pricing
5. Promotional codes
6. Optional services
7. Validation
8. Database access

Explain:

* Folder structure
* Responsibilities of each module
* Request flow
* Pricing flow
* Booking confirmation flow
* Promotional-code redemption flow
* Transaction boundaries
* Error handling
* Validation strategy

The architecture must prioritize correctness and development speed.

Do not introduce microservices, Redis, RabbitMQ, Kubernetes, or other unnecessary infrastructure.

Most importantly, design the system so that the price calculated before confirmation is exactly the price persisted for the booking.

Show the complete request-to-database flow for:

Customer → quote → confirm booking → transaction → booking reference.

Do not write full implementation code yet.






Database design

Design the PostgreSQL database for the Cruise Booking System.

Use Prisma ORM.

The database must support:

* Cruises
* Customers
* Bookings
* Booking passengers
* Child ages
* Optional services
* Promotional codes
* Promotional-code redemptions
* Booking price breakdown
* Historical pricing information

The design must satisfy these requirements:

1. A booking can contain multiple passengers.
2. Each passenger must have an age/category at booking time.
3. Adult and child fares must be reconstructable.
4. Optional services selected for the booking must be stored.
5. Promotional-code redemption must be tracked per customer and globally.
6. Promotional-code limits must be enforceable.
7. Cruise capacity must never be exceeded.
8. Historical booking prices must remain correct even if prices change later.
9. The final booking amount must be reconstructable from stored data.
10. The exact promotional discount applied must be preserved.
11. The exact tax applied must be preserved.
12. The exact service prices used at booking time must be preserved.
13. The booking must have a unique reference.

Discuss whether we should use:

* normalized pricing tables,
* booking price snapshots,
* booking line items,
* JSON snapshots,
* or a combination.

Recommend the simplest design that gives strong historical correctness.

Then provide:

1. Entity relationship explanation
2. Tables
3. Important fields
4. Relationships
5. Constraints
6. Unique indexes
7. Foreign keys
8. Transaction requirements
9. Prisma schema

Do not implement API endpoints yet.






Pricing engine

Design a pure and testable pricing engine for the Cruise Booking System.

The pricing engine must calculate the complete booking price according to these rules.

Cruise fare:

* Adult = 100% of adult base fare.
* Child age 0–4 = free.
* Child age 5–11 = 50% of adult fare.
* Child age 12–17 = 75% of adult fare.
* Age 18+ = adult.

Booking limits:

* At least 1 adult.
* Maximum 6 passengers.

Group discount applies ONLY to cruise fare:

* 1–2 passengers = 0%
* 3–4 passengers = 5%
* 5–6 passengers = 10%

Optional services:

* Insurance = $80 per passenger.
* Wi-Fi = $15 per passenger per night.
* Shore Excursion = $120 per passenger.

Promotional codes may be:

* Percentage discount
* Fixed amount discount

Promotional codes have:

* Valid from
* Valid to
* Maximum total uses
* Maximum uses per customer
* Minimum spend

Tax:

* 12%

The assessment intentionally leaves the exact tax point ambiguous.

Choose a sensible tax calculation order and clearly document the assumption.

Also identify and document assumptions for:

* Whether promotional discounts apply before or after group discount.
* Whether promotional discounts apply to optional services.
* What amount is used for minimum spend.
* Whether fixed discounts can reduce a subtotal below zero.
* Whether tax applies before or after promotional discount.
* Whether optional services are discounted by promotional codes.

Use integer cents internally rather than floating-point currency.

The pricing engine should return a detailed breakdown such as:

* cruise base fare
* child fare adjustments
* group discount
* cruise fare after group discount
* optional services
* promotional discount
* taxable subtotal
* tax
* final total

The result must also contain enough information to create a permanent price snapshot.

Design the pricing engine as a pure function with no database access.

Provide pseudocode first and then TypeScript implementation.

Also list all unit tests that should be written for the pricing engine.






Promotional code logic

Design the promotional-code subsystem.

A customer can apply exactly one promotional code per booking.

Each promotional code contains:

* code
* type: percentage or fixed
* value
* validFrom
* validTo
* maximumTotalUses
* maximumUsesPerCustomer
* minimumSpend

The system must reject a code if:

1. It does not exist.
2. It is outside its validity period.
3. Global usage limit has been reached.
4. The customer has reached their personal usage limit.
5. Minimum spend is not satisfied.
6. The discount configuration is invalid.
7. Another promotional code is already applied.

Every rejection must have a clear business error.

Most importantly, design this to handle concurrent booking confirmations.

Example:

Two customers attempt to redeem the final available use of a promotional code at the same time.

The system must not allow the maximum usage count to be exceeded.

Explain how PostgreSQL transactions and row locking / atomic updates should be used.

Also explain when the promotional redemption record should be created:

* during quote
* during confirmation
* or both

The quote must not consume the promotional code.

Only a successfully confirmed booking should consume the usage.

Provide:

1. Business rules
2. Database design
3. Transaction flow
4. Concurrency strategy
5. TypeScript implementation
6. Tests






Capacity and booking confirmation

Design the booking confirmation process.

The booking process should be:

1. Customer selects a cruise.
2. Customer enters passengers.
3. Customer selects optional services.
4. Customer optionally enters a promotional code.
5. System calculates a quote.
6. Customer sees the complete price breakdown.
7. Customer confirms.
8. System creates the booking.
9. System creates passenger records.
10. System reserves/reduces cruise capacity.
11. System records promotional-code redemption if applicable.
12. System stores the final immutable price breakdown.
13. System generates a unique booking reference.

The system must guarantee:

* No overselling.
* No promotional-code over-redemption.
* Price shown during quote equals confirmed price.
* Failed booking transactions leave no partial data.
* A booking cannot be confirmed twice.
* Historical prices remain unchanged.

Design the PostgreSQL transaction carefully.

Explain how to prevent this race condition:

Cruise has 1 remaining capacity.

Two customers simultaneously try to book 1 passenger.

Both requests see capacity = 1.

Neither request should be allowed to oversell the cruise.

Provide:

1. Transaction sequence
2. Locking strategy
3. SQL/Prisma approach
4. Failure scenarios
5. Idempotency considerations
6. TypeScript service implementation
7. Tests for concurrent/edge cases



API design

Design the REST API for the Cruise Booking System.

Keep the API minimal because the assessment has a 110-minute time limit.

Required capabilities:

1. Find available cruises.
2. Get cruise details.
3. Create/find customer.
4. Generate a booking quote.
5. Apply a promotional code during quote calculation.
6. Confirm a booking.
7. Retrieve a confirmed booking by reference.

For each endpoint provide:

* HTTP method
* URL
* Request body
* Query parameters
* Response
* Validation
* Possible errors
* HTTP status codes

The quote response must contain a complete price breakdown.

The confirm request must use enough information to guarantee that the confirmed amount matches the quoted amount.

Do not create unnecessary CRUD endpoints.

Use Zod for request validation.

Use consistent error responses.

Then provide the Express route/controller/service structure.
