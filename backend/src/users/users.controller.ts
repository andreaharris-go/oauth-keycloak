import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard, Roles, RoleMatchingMode } from 'nest-keycloak-connect';
import { UsersService } from './users.service';
import { Request } from 'express';

@Controller('api/v1/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles({ roles: ['user'], mode: RoleMatchingMode.ANY })
  async getUsers(@Req() req: Request) {
    const user = (req as any).user;
    return this.usersService.getUsers(user);
  }
}
