export const ROLES = {
  MASTER_ADMIN: "MASTER_ADMIN",
  ADMIN: "ADMIN",
  VENDOR: "VENDOR",
  CUSTOMER: "CUSTOMER"
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];