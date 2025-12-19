import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { jwtDecode, JwtPayload } from "jwt-decode";

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
  private decodeToken(token: string): any {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('Decoded token:', decoded);
      return decoded.sub; // Returns the user ID (Subject)
    } catch (error) {
      console.error("Invalid token:", error);
      return undefined;
    }
  }

  private async getUserInfoFromKeycloak(userId: string, adminToken: string): Promise<any> {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'oauth-demo';

    try {
      const url = `${keycloakUrl}/admin/realms/${realm}/users/${userId}`;
      console.log('Fetching user info from Keycloak Admin API:', url);

      const userInfoResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      console.log('Keycloak Admin API response status:', userInfoResponse.status);

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('Keycloak Admin API error response:', errorText);
        return null;
      }

      const userInfo = await userInfoResponse.json();
      console.log('Fetched user info from Keycloak:', {
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        company: userInfo.attributes?.company?.[0]
      });
      return userInfo;
    } catch (error) {
      console.error('Error fetching user info from Keycloak:', error);
      return null;
    }
  }

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

  async getUsers(user: any, accessToken?: string): Promise<User[]> {
    console.log('getUsers called with user:', user);
    console.log('Access token available:', !!accessToken);

    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'oauth-demo';
    const clientId = process.env.KEYCLOAK_CLIENT_ID || 'nestjs-backend';
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'ffdf702e77fbf9ec0255bdc727964f2dcd5648d65435249414f3a84dc8091f06';

    try {
      // Decode the access token to get full user info
      let userInfo = user;
      console.log('XXXX 1: ', accessToken)
      if (accessToken) {
        const decodedToken = this.decodeToken(accessToken);
        console.log('XXXX 2: ', decodedToken);
        if (decodedToken) {
          console.log('Using decoded token data');
          userInfo = { ...user, ...decodedToken };
        }
      }

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
      const adminAccessToken = tokenData.access_token;

      // Get full user info from Keycloak Admin API using user ID (sub) from token
      const userId = userInfo?.sub;

      if (userId && adminAccessToken) {
        console.log('Fetching user info for userId:', userId);
        const fetchedUserInfo = await this.getUserInfoFromKeycloak(userId, adminAccessToken);
        if (fetchedUserInfo) {
          console.log('Successfully fetched user info from Keycloak');
          userInfo = {
            ...userInfo,
            email: fetchedUserInfo.email,
            firstName: fetchedUserInfo.firstName,
            lastName: fetchedUserInfo.lastName,
            attributes: fetchedUserInfo.attributes,
          };
        } else {
          console.log('Failed to fetch user info from Keycloak, using token data');
        }
      } else {
        console.log('No user ID in token, using token data as-is');
      }

      // Extract user info
      const userEmail = userInfo?.email || userInfo?.preferred_username;
      const userCompany = userInfo?.attributes?.company?.[0];
      const userRoles = userInfo?.realm_access?.roles || [];

      console.log('Extracted - Email:', userEmail, 'Company:', userCompany, 'Roles:', userRoles);

      // Fetch users from Keycloak
      const usersResponse = await fetch(
        `${keycloakUrl}/admin/realms/${realm}/users`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
        },
      );

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users from Keycloak');
      }

      const keycloakUsers = await usersResponse.json();

      // Transform Keycloak users to our User interface
      const allUsers: User[] = keycloakUsers.map((kcUser: any) => ({
        id: kcUser.id,
        email: kcUser.email || '',
        firstName: kcUser.firstName || '',
        lastName: kcUser.lastName || '',
        company: kcUser.attributes?.company?.[0] || '',
      }));

      console.log('Current user:', { email: userEmail, company: userCompany, roles: userRoles });
      console.log('Total users from Keycloak:', allUsers.length);

      // Super admin sees all users
      if (userEmail === 'admin@test.com' || userRoles.includes('admin')) {
        console.log('User is admin, returning all users');
        return allUsers;
      }

      // Regular users see only users from their company
      if (userCompany) {
        const filteredUsers = allUsers.filter((u) => u.company === userCompany);
        console.log(`Filtering by company '${userCompany}', found ${filteredUsers.length} users`);
        return filteredUsers;
      }

      console.log('No company found, returning empty list');
      return [];
    } catch (error) {
      console.error('Error fetching users from Keycloak:', error);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async registerUser(registerDto: RegisterUserDto): Promise<{ message: string }> {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
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

      console.log('Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Failed to get service account token:', errorText);
        throw new HttpException(
          'Failed to authenticate with Keycloak. Check client credentials.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      console.log('Service account token obtained successfully');

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
            emailVerified: false,
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

      console.log('Create user response status:', createUserResponse.status);

      if (!createUserResponse.ok) {
        const error = await createUserResponse.text();
        console.error('Keycloak create user error:', error);

        if (createUserResponse.status === 403) {
          throw new HttpException(
            'Permission denied: Service account does not have the required roles. ' +
            'Please enable "Service accounts enabled" and assign "manage-users" role ' +
            'from realm-management to the nestjs-backend client in Keycloak Admin Console.',
            HttpStatus.FORBIDDEN,
          );
        }

        if (createUserResponse.status === 409) {
          throw new HttpException(
            'User with this email already exists.',
            HttpStatus.CONFLICT,
          );
        }

        throw new HttpException(
          `Failed to create user: ${error}`,
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
