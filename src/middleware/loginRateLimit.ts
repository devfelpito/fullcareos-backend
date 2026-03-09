import rateLimit from "express-rate-limit";

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { message: "Muitas tentativas de login. Tente novamente em instantes." },
});

export default loginRateLimit;
