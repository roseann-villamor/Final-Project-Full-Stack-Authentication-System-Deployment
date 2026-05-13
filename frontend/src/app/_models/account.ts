import { Role } from './role';

export class Account {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: Role;
    jwtToken?: string;
    isVerified?: boolean;
}
