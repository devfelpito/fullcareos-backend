"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const requestLogger_1 = __importDefault(require("./middleware/requestLogger"));
const securityHeaders_1 = __importDefault(require("./middleware/securityHeaders"));
const env_1 = require("./config/env");
dotenv_1.default.config();
const env = (0, env_1.getEnv)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((item) => item.trim()) : "*",
}));
app.use(securityHeaders_1.default);
app.use(requestLogger_1.default);
app.use(express_1.default.json({ limit: "1mb" }));
app.get("/", (_req, res) => res.send("FullcareOS Backend OK"));
app.use("/api", routes_1.default);
app.use(errorHandler_1.default);
if (env.NODE_ENV !== "test") {
    app.listen(env.PORT, () => console.log(`Servidor rodando na porta ${env.PORT}`));
}
exports.default = app;
