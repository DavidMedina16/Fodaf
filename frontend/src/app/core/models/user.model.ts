export interface Role {
  id: number;
  name: string;
  createdAt?: Date;
  [key: string]: unknown;
}

export interface User {
  id: number;
  roleId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  role?: Role;
  [key: string]: unknown;
}

export interface CreateUserRequest {
  roleId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateUserRequest {
  roleId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}
