import { Router } from "express";

/**
 * Example structure for future modular routing:
 * - controllers become thin
 * - services hold business logic
 * - routes stay declarative
 */

const router = Router();

// router.use("/orders", orderRoutes);
// router.use("/inventory", inventoryRoutes);
// router.use("/payments", paymentRoutes);

export default router;