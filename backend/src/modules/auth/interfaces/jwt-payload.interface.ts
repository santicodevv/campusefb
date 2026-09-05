import { RoleCode } from '../../users/entities/role.entity';

export interface JwtPayload {
  sub: number; // user id
  email: string;
  roles: RoleCode[];
}
