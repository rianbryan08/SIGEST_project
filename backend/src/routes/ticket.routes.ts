import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { uploadScreenshot } from "../middlewares/upload.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", ticketController.list);
router.get("/:id", ticketController.getById);
router.post("/", uploadScreenshot, ticketController.create);
router.get("/:id/attachments/:attachmentId", ticketController.downloadAttachment);
router.post("/:id/assign", ticketController.assign);
router.post("/:id/forward", requireRole("ADMIN", "ANALISTA", "TECHNICIAN"), ticketController.forward);
router.put("/:id/status", requireRole("ADMIN", "ANALISTA", "TECHNICIAN"), ticketController.updateStatus);
router.put("/:id/priority", requireRole("ADMIN", "ANALISTA", "TECHNICIAN"), ticketController.updatePriority);
router.post("/:id/comments", ticketController.addComment);
router.post("/:id/feedback", ticketController.submitFeedback);

export default router;
