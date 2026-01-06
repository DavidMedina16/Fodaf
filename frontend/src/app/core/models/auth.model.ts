import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface TokenPayload {
  sub: number;
  email: string;
  roleId: number;
  iat: number;
  exp: number;
}
