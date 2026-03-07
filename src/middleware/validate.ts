import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inválidos",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = parsed.data;
    next();
  };
}
