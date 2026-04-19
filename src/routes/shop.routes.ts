import { Router } from "express";
import {
  createShop,
  deleteShop,
  getAllShops,
  getMyShops,
  getSingleShop,
  updateShop,
} from "../controllers/shop.controller";
import { allowRoles, protect } from "../middlewares/auth.middleware";
import { ROLES } from "../constants/roles";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles(ROLES.VENDOR, ROLES.ADMIN, ROLES.MASTER_ADMIN),
  upload.single("logo"),
  createShop
);

router.get("/", getAllShops);
router.get("/my/shops", protect, getMyShops);
router.get("/:id", getSingleShop);

router.put(
  "/:id",
  protect,
  upload.single("logo"),
  updateShop
);

router.delete("/:id", protect, deleteShop);

export default router;