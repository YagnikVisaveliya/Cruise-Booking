import { Request, Response } from 'express';
import { PricingService } from '../services/pricing.service.js';

export class PricingController {
  public static async calculatePrice(req: Request, res: Response) {
    try {
      const calculation = await PricingService.calculatePrice(req.body);
      return res.json({ success: true, data: calculation });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, errors: [error.message] });
    }
  }

  public static async validatePromo(req: Request, res: Response) {
    try {
      const { code, subtotalCents, customer_email } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Promotional code is required.', errors: ['Promotional code is required.'] });
      }
      const subtotal = subtotalCents ? subtotalCents / 100 : 0;
      const result = await PricingService.validatePromoCode(code, subtotal, customer_email);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, errors: [error.message] });
    }
  }
}
