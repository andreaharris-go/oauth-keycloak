import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard, Roles, RoleMatchingMode, Public } from 'nest-keycloak-connect';
import { UsersService } from './users.service';
import { Request } from 'express';

interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
}

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  @Roles({ roles: ['user'], mode: RoleMatchingMode.ANY })
  async getUsers(@Req() req: Request) {
    const user = (req as any).user;
    return this.usersService.getUsers(user);
  }

  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterUserDto) {
    return this.usersService.registerUser(registerDto);
  }
}
