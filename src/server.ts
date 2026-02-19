import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/", (req, res) => res.send("FullcareOS Backend OK 🚀"));

// Monta todas as rotas na raiz. Se preferir prefixo "/api", troque por `app.use("/api", routes);`
app.use("/", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

export default app;