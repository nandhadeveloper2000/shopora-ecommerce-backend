import { ShopModel } from "../models/shop.model";
import { PERMISSIONS, PermissionKey } from "../constants/permissions";
import { ROLES } from "../constants/roles";
import { ApiError } from "../utils/ApiError";

const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  [ROLES.MASTER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.VENDOR]: [
    PERMISSIONS.SHOP_READ,
    PERMISSIONS.SHOP_WRITE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_WRITE,
    PERMISSIONS.PAYOUT_READ,
  ],
  [ROLES.CUSTOMER]: [PERMISSIONS.ORDER_READ],
};

export function assertPermission(role: string, permission: PermissionKey) {
  const permissions = ROLE_PERMISSIONS[role] || [];

  if (!permissions.includes(permission) && role !== ROLES.ADMIN && role !== ROLES.MASTER_ADMIN) {
    throw new ApiError(403, "Forbidden");
  }
}

export async function assertShopOwnership(params: {
  actorId: string;
  actorRole: string;
  shopId: string;
}) {
  const { actorId, actorRole, shopId } = params;

  if (actorRole === ROLES.ADMIN || actorRole === ROLES.MASTER_ADMIN) {
    return true;
  }

  const shop = await ShopModel.findOne({
    _id: shopId,
    ownerId: actorId,
    isDeleted: false,
  });

  if (!shop) {
    throw new ApiError(403, "You do not have access to this shop");
  }

  return true;
}