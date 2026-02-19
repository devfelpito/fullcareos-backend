import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index";  // Importa todas as rotas do projeto

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Teste rápido de servidor
app.get("/", (req, res) => {
  res.send("FullcareOS Backend OK 🚀");
});

// Rotas do sistema
app.use("/api", routes);

// Porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
