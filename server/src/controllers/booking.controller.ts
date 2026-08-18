import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service.js';

export class BookingController {
  public static async createBooking(req: Request, res: Response) {
    try {
      const booking = await BookingService.createBooking(req.body);
      return res.status(201).json({
        success: true,
        message: 'Booking created successfully!',
        data: booking
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getBookingByReference(req: Request, res: Response) {
    try {
      const reference = req.params.reference;
      if (!reference) {
        return res.status(400).json({ success: false, message: 'Booking reference is required.' });
      }
      const booking = await BookingService.getBookingByReference(reference);
      return res.json({ success: true, data: booking });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }
}
