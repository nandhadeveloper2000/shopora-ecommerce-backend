import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  createAddress,
  deleteAddress,
  getMyAddresses,
  getSingleAddress,
  setDefaultAddress,
  updateAddress,
} from "../controllers/address.controller";

const router = Router();

router.post("/", protect, createAddress);
router.get("/", protect, getMyAddresses);
router.get("/:id", protect, getSingleAddress);
router.put("/:id", protect, updateAddress);
router.patch("/:id/default", protect, setDefaultAddress);
router.delete("/:id", protect, deleteAddress);

export default router;