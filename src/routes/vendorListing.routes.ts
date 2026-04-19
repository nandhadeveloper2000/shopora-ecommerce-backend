import { Router } from "express";
import {
  createVendorListing,
  getVendorListings
} from "../controllers/vendorListing.controller";
import { allowRoles, protect } from "../middlewares/auth.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/", protect, allowRoles(ROLES.VENDOR), createVendorListing);
router.get("/", getVendorListings);

export default router;