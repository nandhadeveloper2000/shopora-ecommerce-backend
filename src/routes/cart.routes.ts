import { Router } from "express";
import {
  addToCart,
  clearCart,
  getMyCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../controllers/cart.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getMyCart);
router.post("/", protect, addToCart);
router.put("/", protect, updateCartItemQuantity);
router.delete("/clear", protect, clearCart);
router.delete("/:vendorListingId", protect, removeCartItem);

export default router;