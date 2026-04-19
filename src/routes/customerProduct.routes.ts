import { Router } from "express";
import {
  getCustomerProductDetails,
  getCustomerProducts,
} from "../controllers/customerProduct.controller";

const router = Router();

router.get("/", getCustomerProducts);
router.get("/:id", getCustomerProductDetails);

export default router;