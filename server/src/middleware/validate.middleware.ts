import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error: any) {
      if (error.name === 'ZodError' || error instanceof ZodError || error.issues) {
        const issues = (error.issues || error.errors || []).map((err: any) => 
          err.message ? `${err.path ? err.path.join('.') + ': ' : ''}${err.message}` : String(err)
        );
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: issues.length > 0 ? issues : ['Invalid request parameters']
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid request payload',
        errors: [error.message || 'Invalid request payload']
      });
    }
  };
};
