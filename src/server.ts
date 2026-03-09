import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import errorHandler from "./middleware/errorHandler";
import requestLogger from "./middleware/requestLogger";
import securityHeaders from "./middleware/securityHeaders";
import { getEnv } from "./config/env";

dotenv.config();
const env = getEnv();

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((item) => item.trim()) : "*",
  })
);
app.use(securityHeaders);
app.use(requestLogger);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.send("FullcareOS Backend OK"));
app.use("/api", routes);
app.use(errorHandler);

if (env.NODE_ENV !== "test") {
  app.listen(env.PORT, () => console.log(`Servidor rodando na porta ${env.PORT}`));
}

export default app;
