import { Router } from "express";
import {
  addToWishlist,
  clearWishlist,
  getMyWishlist,
  removeWishlistItem,
} from "../controllers/wishlist.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", protect, getMyWishlist);
router.post("/", protect, addToWishlist);
router.delete("/clear", protect, clearWishlist);
router.delete("/:masterProductId", protect, removeWishlistItem);

export default router;