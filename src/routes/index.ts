import { Router } from "express";

import authRoutes from "./auth";
import clientRoutes from "./client";
import vehicleRoutes from "./vehicle";
import serviceRoutes from "./service";
import appointmentRoutes from "./appointment";
import saleRoutes from "./sale";
import expenseRoutes from "./expense";

const unwrap = (m: any) => (m && m.default) ? m.default : m;

const router = Router();

router.use("/auth", unwrap(authRoutes));
router.use("/client", unwrap(clientRoutes));
router.use("/vehicles", unwrap(vehicleRoutes));
router.use("/services", unwrap(serviceRoutes));
router.use("/appointments", unwrap(appointmentRoutes));
router.use("/sales", unwrap(saleRoutes));
router.use("/expenses", unwrap(expenseRoutes));

export default router;