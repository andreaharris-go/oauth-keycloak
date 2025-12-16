import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
}

interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
}

@Injectable()
export class UsersService {
  // Mock data - in a real application, this would come from a database
  private users: User[] = [
    {
      id: '1',
      email: 'admin@test.com',
      firstName: 'Super',
      lastName: 'Admin',
      company: 'super',
    },
    {
      id: '2',
      email: 'user1@abc.com',
      firstName: 'User',
      lastName: 'One',
      company: 'abc',
    },
    {
      id: '3',
      email: 'user2@abc.com',
      firstName: 'User',
      lastName: 'Two',
      company: 'abc',
    },
    {
      id: '4',
      email: 'user1@xyz.com',
      firstName: 'User',
      lastName: 'Three',
      company: 'xyz',
    },
    {
      id: '5',
      email: 'user2@xyz.com',
      firstName: 'User',
      lastName: 'Four',
      company: 'xyz',
    },
  ];

  async getUsers(user: any): Promise<User[]> {
    // Extract user info from Keycloak token
    const userEmail = user?.email || user?.preferred_username;
    const userCompany = user?.company;
    const userRoles = user?.realm_access?.roles || [];

    // Super admin sees all users
    if (userEmail === 'admin@test.com' || userRoles.includes('admin')) {
      return this.users;
    }

    // Regular users see only users from their company
    if (userCompany) {
      return this.users.filter((u) => u.company === userCompany);
    }

    return [];
  }

  async registerUser(registerDto: RegisterUserDto): Promise<{ message: string }> {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
    const realm = process.env.KEYCLOAK_REALM || 'oauth-demo';
    const clientId = process.env.KEYCLOAK_CLIENT_ID || 'nestjs-backend';
    // NOTE: The fallback secret is for demo purposes only. In production, this should throw an error if not set.
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'ffdf702e77fbf9ec0255bdc727964f2dcd5648d65435249414f3a84dc8091f06';

    try {
      // Get service account token
      const tokenResponse = await fetch(
        `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
          }),
        },
      );

      if (!tokenResponse.ok) {
        throw new Error('Failed to get service account token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Create user in Keycloak
      const createUserResponse = await fetch(
        `${keycloakUrl}/admin/realms/${realm}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: registerDto.email,
            username: registerDto.email,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            enabled: true,
            emailVerified: true,
            attributes: {
              company: [registerDto.company],
            },
            credentials: [
              {
                type: 'password',
                value: registerDto.password,
                temporary: false,
              },
            ],
          }),
        },
      );

      if (!createUserResponse.ok) {
        const error = await createUserResponse.text();
        console.error('Keycloak error:', error);
        throw new HttpException(
          'Failed to create user. Email may already exist.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Add user to local mock data
      const newUser: User = {
        id: String(this.users.length + 1),
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        company: registerDto.company,
      };
      this.users.push(newUser);

      return { message: 'User registered successfully' };
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to register user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const newUser: User = {
      id: String(this.users.length + 1),
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      company: userData.company || '',
    };
    this.users.push(newUser);
    return newUser;
  }
}
