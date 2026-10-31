import { Router } from "express";
import authRoutes from "./auth.routes";
import ticketRoutes from "./ticket.routes";
import categoryRoutes from "./category.routes";
import userRoutes from "./user.routes";
import dashboardRoutes from "./dashboard.routes";
import reportRoutes from "./report.routes";
import knowledgeRoutes from "./knowledge.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);
router.use("/categories", categoryRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/knowledge", knowledgeRoutes);

export default router;
