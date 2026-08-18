import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export class CruiseController {
  public static async getAllCruises(req: Request, res: Response) {
    try {
      const cruises = await prisma.cruise.findMany({
        orderBy: { createdAt: 'asc' }
      });

      const formatted = cruises.map(c => ({
        id: c.id,
        cruise_line: c.cruiseLine,
        ship_name: c.shipName,
        destination: c.destination,
        nights: c.nights,
        adult_fare: c.adultFareCents / 100,
        capacity_total: c.capacityTotal,
        capacity_left: c.capacityLeft,
        image_url: c.imageUrl
      }));

      return res.json({ success: true, data: formatted });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getCruiseById(req: Request, res: Response) {
    try {
      const idStr = req.params.id;

      const cruise = await prisma.cruise.findUnique({
        where: { id: idStr }
      });

      if (!cruise) {
        return res.status(404).json({ success: false, message: `Cruise '${idStr}' not found.` });
      }

      const formatted = {
        id: cruise.id,
        cruise_line: cruise.cruiseLine,
        ship_name: cruise.shipName,
        destination: cruise.destination,
        nights: cruise.nights,
        adult_fare: cruise.adultFareCents / 100,
        capacity_total: cruise.capacityTotal,
        capacity_left: cruise.capacityLeft,
        image_url: cruise.imageUrl
      };

      return res.json({ success: true, data: formatted });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
