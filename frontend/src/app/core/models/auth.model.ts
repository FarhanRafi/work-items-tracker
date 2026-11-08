export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  expiresAtUtc: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAtUtc: string;
}

