import { Router } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateBody } from "../middleware/validate";
import { loginSchema } from "../validation/schemas";
import loginRateLimit from "../middleware/loginRateLimit";

const router = Router();

router.post("/login", loginRateLimit, validateBody(loginSchema), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return res.status(401).json({ message: "Credenciais invalidas" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Credenciais invalidas" });
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.companyId, roleId: user.roleId },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      companyId: user.companyId,
      roleId: user.roleId,
      active: user.active,
      createdAt: user.createdAt,
    };

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

export default router;
