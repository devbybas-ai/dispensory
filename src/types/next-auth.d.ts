import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      premisesId: string | null;
    };
  }

  interface User {
    role: Role;
    premisesId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    premisesId: string | null;
  }
}
