import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
  @UseGuards(AuthGuard('jwt'))
  async getUsers(@Req() req: Request) {
    const user = (req as any).user;

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');

    console.log('User from token:', user);
    console.log('Access token available:', !!accessToken);
    console.log('Access token (first 50 chars):', accessToken?.substring(0, 50));

    return this.usersService.getUsers(user, accessToken);
  }

  @Post('register')
  // TODO: @Public() - This endpoint should be public (no JWT authentication required)
  async register(@Body() registerDto: RegisterUserDto) {
    return this.usersService.registerUser(registerDto);
  }
}
