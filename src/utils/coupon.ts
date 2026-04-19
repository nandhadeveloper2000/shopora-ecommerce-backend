import { CouponModel } from "../models/coupon.model";
import { OrderModel } from "../models/order.model";

export async function validateAndApplyCoupon(params: {
  userId: string;
  couponCode?: string;
  subtotal: number;
}) {
  const { userId, couponCode, subtotal } = params;

  if (!couponCode) {
    return {
      coupon: null,
      discountAmount: 0,
      couponSnapshot: null,
    };
  }

  const code = String(couponCode).trim().toUpperCase();
  const now = new Date();

  const coupon = await CouponModel.findOne({
    code,
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  });

  if (!coupon) {
    throw new Error("Coupon is invalid or expired");
  }

  if (coupon.totalUsageLimit > 0 && coupon.usedCount >= coupon.totalUsageLimit) {
    throw new Error("Coupon usage limit reached");
  }

  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
    throw new Error(`Coupon valid only for orders above ${coupon.minOrderAmount}`);
  }

  if (coupon.applicableUserIds && coupon.applicableUserIds.length > 0) {
    const allowed = coupon.applicableUserIds.some((id) => String(id) === String(userId));
    if (!allowed) {
      throw new Error("Coupon is not applicable for this user");
    }
  }

  if (coupon.perUserUsageLimit > 0) {
    const userUsedCount = await OrderModel.countDocuments({
      userId,
      couponId: coupon._id,
      status: { $ne: "CANCELLED" },
    });

    if (userUsedCount >= coupon.perUserUsageLimit) {
      throw new Error("You have already used this coupon the maximum allowed times");
    }
  }

  let discountAmount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (subtotal * coupon.discountValue) / 100;

    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return {
    coupon,
    discountAmount,
    couponSnapshot: {
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
    },
  };
}