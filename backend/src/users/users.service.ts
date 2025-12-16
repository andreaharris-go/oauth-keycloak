import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  email: string;
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
