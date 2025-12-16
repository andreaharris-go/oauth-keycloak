# OAuth Keycloak Demo - Setup Guide

This guide provides step-by-step instructions for setting up and running the OAuth Keycloak demo application.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- Ports 3000, 3001, and 8080 available

## Quick Start

### 1. Start the Application

```bash
# Clone the repository
git clone <repository-url>
cd oauth-keycloak

# Start all services
docker-compose up -d

# Watch the logs (optional)
docker-compose logs -f
```

### 2. Wait for Services to Start

The services will take approximately 2-3 minutes to fully initialize. You can check the status with:

```bash
docker-compose ps
```

All services should show as "Up" (healthy).

### 3. Access the Application

Once all services are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Keycloak Admin**: http://localhost:8080
  - Username: `admin`
  - Password: `admin`

## Testing the Application

### Test 1: Sign Up as a Regular User

1. Navigate to http://localhost:3000
2. Click "สมัครสมาชิก" (Sign Up) or go directly to http://localhost:3000/signup
3. Fill in the form:
   - **Email**: test1@abc.com
   - **Password**: password123
   - **First Name**: Test
   - **Last Name**: User
   - **Company**: ABC
4. Click "สมัครสมาชิก" (Sign Up)
5. Wait for the success message
6. You'll be redirected to the sign-in page

### Test 2: Sign In and View Company Users

1. Sign in with the credentials you just created:
   - **Email**: test1@abc.com
   - **Password**: password123
2. After successful login, you'll see the user list
3. **Expected Result**: You should see only users from company ABC
   - You created user (test1@abc.com)
   - Pre-loaded users: user1@abc.com, user2@abc.com

### Test 3: Create Another User in Different Company

1. Sign out (click "ออกจากระบบ")
2. Go to Sign Up page
3. Create a user with company XYZ:
   - **Email**: test2@xyz.com
   - **Password**: password123
   - **First Name**: Test
   - **Last Name**: XYZ User
   - **Company**: XYZ
4. Sign in with the new credentials
5. **Expected Result**: You should see only users from company XYZ
   - Your created user (test2@xyz.com)
   - Pre-loaded users: user1@xyz.com, user2@xyz.com

### Test 4: Super Admin Access

1. Sign out
2. Sign in as the super admin:
   - **Email**: admin@test.com
   - **Password**: admin123
3. **Expected Result**: You should see ALL users from ALL companies
   - Super admin (admin@test.com)
   - ABC users: user1@abc.com, user2@abc.com, test1@abc.com
   - XYZ users: user1@xyz.com, user2@xyz.com, test2@xyz.com

### Test 5: API Testing (Optional)

You can also test the API directly:

1. First, get an access token by signing in through the UI and checking browser's sessionStorage
2. Or use curl to get a token:

```bash
curl -X POST http://localhost:8080/realms/oauth-demo/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=nextjs-frontend" \
  -d "username=admin@test.com" \
  -d "password=admin123" \
  -d "grant_type=password"
```

3. Use the token to call the API:

```bash
curl http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer <your-access-token>"
```

## Verifying the Setup

### Check Service Health

```bash
# Check all containers are running
docker-compose ps

# Check Keycloak logs
docker-compose logs keycloak

# Check Backend logs
docker-compose logs nestjs

# Check Frontend logs
docker-compose logs nextjs
```

### Verify Keycloak Configuration

1. Go to http://localhost:8080
2. Click "Administration Console"
3. Login with admin/admin
4. Select "oauth-demo" realm from the dropdown (top left)
5. Check:
   - **Users**: You should see admin@test.com and any users you created
   - **Clients**: nextjs-frontend and nestjs-backend should be present
   - **Realm Roles**: user and admin roles should exist

## Troubleshooting

### Services Not Starting

**Problem**: Services fail to start or show as unhealthy

**Solutions**:
1. Check if ports 3000, 3001, 8080, 5432 are available
2. Check Docker logs: `docker-compose logs`
3. Restart services: `docker-compose restart`
4. Rebuild containers: `docker-compose up -d --build`

### Cannot Access Frontend

**Problem**: http://localhost:3000 doesn't load

**Solutions**:
1. Check if NextJS container is running: `docker-compose ps nextjs`
2. Check logs: `docker-compose logs nextjs`
3. Wait longer - initial build can take time
4. Rebuild: `docker-compose up -d --build nextjs`

### Cannot Sign Up

**Problem**: Sign up fails with error

**Solutions**:
1. Check backend is running: `docker-compose ps nestjs`
2. Check Keycloak is running: `docker-compose ps keycloak`
3. Check backend logs: `docker-compose logs nestjs`
4. Verify the email isn't already registered
5. Ensure password is at least 6 characters

### Cannot Sign In

**Problem**: Sign in fails with "Invalid credentials"

**Solutions**:
1. Verify you're using the correct email and password
2. For admin account: admin@test.com / admin123
3. Check Keycloak is running: `docker-compose ps keycloak`
4. Verify user exists in Keycloak Admin Console

### User List Not Showing

**Problem**: After sign in, user list is empty or shows error

**Solutions**:
1. Check backend API is running: `docker-compose ps nestjs`
2. Check backend logs: `docker-compose logs nestjs`
3. Verify authentication token in browser sessionStorage
4. Try signing out and signing in again

### Keycloak Admin Console Not Accessible

**Problem**: Cannot access http://localhost:8080

**Solutions**:
1. Wait longer - Keycloak can take 1-2 minutes to fully start
2. Check Keycloak container: `docker-compose ps keycloak`
3. Check health: `docker-compose logs keycloak | grep -i "ready"`
4. Restart Keycloak: `docker-compose restart keycloak`

## Stopping the Application

### Stop Services (Keep Data)

```bash
docker-compose down
```

This will stop all services but keep the database data in a volume.

### Stop Services and Remove All Data

```bash
docker-compose down -v
```

This will stop services and remove all volumes, including the database. Use this to completely reset the application.

## Development Mode

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Then access the frontend at http://localhost:3000 (running outside Docker).

### Backend Development

```bash
cd backend
npm install
npm run start:dev
```

Then the API will be available at http://localhost:3001 (running outside Docker).

**Note**: When running services outside Docker, update the environment variables to point to the correct URLs (e.g., use localhost instead of container names).

## Next Steps

- Read the main [README.md](../README.md) for detailed documentation
- Review security considerations before production deployment
- Customize the Keycloak realm configuration as needed
- Add more users and test company-based filtering
- Explore Keycloak Admin Console features

## Support

If you encounter issues not covered in this guide:

1. Check the main README.md file
2. Review Docker Compose logs
3. Check Keycloak documentation
4. Verify all environment variables are set correctly
