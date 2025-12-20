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

  async getUsers(user: any, accessToken?: string): Promise<User[]> {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'oauth-demo';
    const clientId = process.env.KEYCLOAK_CLIENT_ID || 'nestjs-backend';
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
        const errorText = await tokenResponse.text();
        console.error('Failed to get service account token:', errorText);
        throw new HttpException(
          'Failed to authenticate with Keycloak',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const tokenData = await tokenResponse.json();
      const adminToken = tokenData.access_token;

      // Fetch all users from Keycloak
      const usersResponse = await fetch(
        `${keycloakUrl}/admin/realms/${realm}/users`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      if (!usersResponse.ok) {
        const errorText = await usersResponse.text();
        console.error('Failed to fetch users from Keycloak:', errorText);
        throw new HttpException(
          'Failed to fetch users',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const keycloakUsers = await usersResponse.json();
      console.log(`Fetched ${keycloakUsers.length} users from Keycloak`);

      // Transform Keycloak users to our User interface
      const users: User[] = keycloakUsers.map((keycloakUser: any) => ({
        id: keycloakUser.id,
        email: keycloakUser.email || '',
        firstName: keycloakUser.firstName || '',
        lastName: keycloakUser.lastName || '',
        company: keycloakUser.attributes?.company?.[0] || '',
      }));

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error instanceof HttpException) {
        throw error;
      }
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

      // Prepare user data
      const userData = {
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
      };

      console.log('Creating user with data:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        company: registerDto.company,
        attributes: userData.attributes,
      });

      // Create user in Keycloak
      const createUserResponse = await fetch(
        `${keycloakUrl}/admin/realms/${realm}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(userData),
        },
      );

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
}
