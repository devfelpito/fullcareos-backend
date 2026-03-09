import { Router } from "express";

import authRoutes from "./auth";
import customerAuthRoutes from "./customerAuth";
import onboardingRoutes from "./onboarding";
import customerPortalRoutes from "./customerPortal";
import billingRoutes from "./billing";
import systemRoutes from "./system";
import clientRoutes from "./client";
import vehicleRoutes from "./vehicle";
import serviceRoutes from "./service";
import appointmentRoutes from "./appointment";
import saleRoutes from "./sale";
import expenseRoutes from "./expense";

const unwrap = (m: any) => (m && m.default ? m.default : m);

const router = Router();

router.use("/system", unwrap(systemRoutes));
router.use("/auth", unwrap(authRoutes));
router.use("/customer-auth", unwrap(customerAuthRoutes));
router.use("/customer-portal", unwrap(customerPortalRoutes));
router.use("/onboarding", unwrap(onboardingRoutes));
router.use("/billing", unwrap(billingRoutes));
router.use("/client", unwrap(clientRoutes));
router.use("/vehicles", unwrap(vehicleRoutes));
router.use("/services", unwrap(serviceRoutes));
router.use("/appointments", unwrap(appointmentRoutes));
router.use("/sales", unwrap(saleRoutes));
router.use("/expenses", unwrap(expenseRoutes));

export default router;
