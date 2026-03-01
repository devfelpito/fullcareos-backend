import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import errorHandler from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/", (_req, res) => res.send("FullcareOS Backend OK 🚀"));

// Rotas do sistema (prefixo /api)
app.use("/api", routes);

// Tratamento centralizado de erros (evita vazamento de logs do Prisma)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

export default app;
