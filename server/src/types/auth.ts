export type Role = "consumer" | "store" | "delivery";

export type AuthUser = {
  id: string;
  role: Role;
};
