"# OAuth Keycloak Demo

A complete authentication system using Keycloak 26+, NextJS 15+, and NestJS 11+ with TypeScript.

## Features

- **Keycloak 26+** for authentication and authorization
- **NextJS 15+** frontend with TypeScript for sign up, sign in, and user management
- **NestJS 11+** backend with TypeScript providing RESTful API
- Company-based user filtering (ABC, XYZ companies)
- Super admin role (admin@test.com) can see all users
- Docker Compose for easy setup and deployment

## Architecture

- **Keycloak**: Authentication server on port 8080
- **PostgreSQL**: Database for Keycloak
- **NestJS Backend**: RESTful API on port 3001
  - Endpoint: `GET /api/v1/users` - Returns user list based on authentication
- **NextJS Frontend**: Web interface on port 3000
  - `/signup` - User registration with company selection
  - `/signin` - User login
  - `/users` - User list (filtered by company)

## Requirements

- Docker
- Docker Compose

## Quick Start

**📖 For detailed setup instructions and testing guide, see [SETUP.md](SETUP.md)**

1. Clone the repository
2. Run the application:

```bash
docker-compose up -d
```

3. Wait for all services to start (approximately 2-3 minutes)

4. Access the applications:
   - **Keycloak Admin Console**: http://localhost:8080
     - Username: `admin`
     - Password: `admin`
   - **NextJS Frontend**: http://localhost:3000
   - **NestJS Backend**: http://localhost:3001

## User Roles and Access

### Super Admin
- **Email**: admin@test.com
- **Password**: admin123
- **Access**: Can see all users from all companies

### Regular Users
- Can only see users from their own company
- Companies available: ABC, XYZ

## Testing the Application

### 1. Sign Up New Users

1. Go to http://localhost:3000/signup
2. Fill in the form:
   - Email: user1@abc.com
   - Password: password123
   - First Name: User
   - Last Name: One
   - Company: ABC
3. Click "สมัครสมาชิก" (Sign Up)

Repeat with different users for testing:
- user2@abc.com (Company: ABC)
- user1@xyz.com (Company: XYZ)
- user2@xyz.com (Company: XYZ)

### 2. Sign In

1. Go to http://localhost:3000/signin
2. Enter credentials
3. Click "เข้าสู่ระบบ" (Sign In)

### 3. View Users

After signing in, you'll be redirected to the users list page:
- **As regular user**: You'll see only users from your company
- **As admin@test.com**: You'll see all users from all companies

## API Endpoints

### Get Users
```
GET http://localhost:3001/api/v1/users
Authorization: Bearer <token>
```

Returns:
```json
[
  {
    "id": "1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": "abc"
  }
]
```

## Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
npm install
npm run start:dev
```

## Configuration

### Security Considerations

⚠️ **IMPORTANT**: This is a demo application with example credentials and secrets. Before deploying to production:

1. **Generate New Secrets**:
   ```bash
   # Generate a new Keycloak client secret
   openssl rand -hex 32
   ```

2. **Update Secrets in Multiple Locations**:
   - `docker-compose.yml` - Update `KEYCLOAK_CLIENT_SECRET`
   - `keycloak/realm-export.json` - Update the `secret` field for `nestjs-backend` client
   - Backend environment variables

3. **Use Environment Files**: Create a `.env` file (excluded from git) instead of hardcoding secrets in `docker-compose.yml`

4. **Change Default Passwords**:
   - Keycloak admin password
   - Database password
   - Super admin user password (admin@test.com)

5. **For Production**: Use Docker secrets, Kubernetes secrets, or a secrets management service

### Environment Variables

See `.env.example` for all available configuration options.

#### Backend (.env)
```
NODE_ENV=development
PORT=3001
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=oauth-demo
KEYCLOAK_CLIENT_ID=nestjs-backend
KEYCLOAK_CLIENT_SECRET=<your-secure-secret-here>
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=oauth-demo
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=nextjs-frontend
```

## Keycloak Configuration

The realm configuration is automatically imported from `keycloak/realm-export.json`:

- **Realm**: oauth-demo
- **Clients**: 
  - nextjs-frontend (Public client)
  - nestjs-backend (Confidential client)
- **Roles**: user, admin
- **User Attributes**: company (abc, xyz, super)

## Stopping the Application

```bash
docker-compose down
```

To remove volumes (database data):
```bash
docker-compose down -v
```

## Tech Stack

- **Keycloak**: 26.0.7
- **NextJS**: 15.1.0+
- **NestJS**: 11.0.0+
- **React**: 19.0.0+
- **TypeScript**: 5.3.3+
- **PostgreSQL**: 16
- **Node.js**: 20

## Project Structure

```
.
├── docker-compose.yml
├── keycloak/
│   └── realm-export.json
├── backend/
│   ├── src/
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
└── frontend/
    ├── app/
    │   ├── signup/
    │   │   └── page.tsx
    │   ├── signin/
    │   │   └── page.tsx
    │   ├── users/
    │   │   └── page.tsx
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── package.json
    ├── tsconfig.json
    └── Dockerfile
```

## Troubleshooting

### Keycloak is not starting
- Wait longer (it can take 1-2 minutes to start)
- Check logs: `docker-compose logs keycloak`

### Cannot connect to backend
- Ensure all services are running: `docker-compose ps`
- Check backend logs: `docker-compose logs nestjs`

### Users not showing up
- Make sure you're signed in
- Check that the token is valid
- Verify company attribute is set correctly in Keycloak

## License

MIT" 
