export type UserRole = "citizen" | "administrator" | "worker";

export type PublicUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  neighborhood_id: number | null;
  neighborhood_name: string | null;
  points: number;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: PublicUser;
};

export type Neighborhood = {
  id: number;
  name: string;
  slug: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  full_name: string;
  neighborhood_id?: number | null;
};
