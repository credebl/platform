import { CustomDecorator } from '@nestjs/common';
import { OrgRoles } from 'libs/org-roles/enums';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: OrgRoles[]): CustomDecorator<string> => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: string[]): CustomDecorator<string> => SetMetadata('permissions', permissions);
export const Subscriptions = (...subscriptions: string[]): CustomDecorator<string> => SetMetadata('subscriptions', subscriptions);

