import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", ticketController.list);
router.get("/:id", ticketController.getById);
router.post("/", ticketController.create);
router.post("/:id/assign", ticketController.assign);
router.post("/:id/forward", requireRole("ADMIN", "TECHNICIAN"), ticketController.forward);
router.put("/:id/status", ticketController.updateStatus);
router.put("/:id/priority", requireRole("ADMIN", "TECHNICIAN"), ticketController.updatePriority);
router.post("/:id/comments", ticketController.addComment);
router.post("/:id/feedback", ticketController.submitFeedback);

export default router;
