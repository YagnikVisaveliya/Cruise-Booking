import { Router } from 'express';
import { CruiseController } from '../controllers/cruise.controller.js';
import { PricingController } from '../controllers/pricing.controller.js';
import { BookingController } from '../controllers/booking.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { calculatePriceSchema, validatePromoSchema } from '../validations/pricing.validation.js';
import { createBookingSchema } from '../validations/booking.validation.js';

const router = Router();

// Cruise catalog routes
router.get('/cruises', CruiseController.getAllCruises);
router.get('/cruises/:id', CruiseController.getCruiseById);

// Quote & Dynamic Pricing routes (with Zod validation)
router.post('/quotes', validateRequest(calculatePriceSchema), PricingController.calculatePrice);
router.post('/pricing/calculate', validateRequest(calculatePriceSchema), PricingController.calculatePrice);
router.post('/pricing/validate-promo', validateRequest(validatePromoSchema), PricingController.validatePromo);

// Booking routes (with Zod validation)
router.post('/bookings', validateRequest(createBookingSchema), BookingController.createBooking);
router.get('/bookings/:reference', BookingController.getBookingByReference);

export default router;
