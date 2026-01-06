export interface Role {
  id: number;
  name: string;
  createdAt?: Date;
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
