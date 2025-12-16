# Keycloak Realm Configuration

This directory contains the Keycloak realm export configuration for the oauth-demo realm.

## Security Warning

⚠️ **IMPORTANT**: The `realm-export.json` file contains a demo client secret that is committed to version control. This is **only acceptable for demo/development purposes**.

### For Production Deployment

Before deploying to production, you must:

1. **Generate a new client secret**:
   ```bash
   openssl rand -hex 32
   ```

2. **Update the secret in `realm-export.json`**:
   - Find the `nestjs-backend` client configuration
   - Replace the `secret` field value with your newly generated secret

3. **Update the secret in `docker-compose.yml`**:
   - Update the `KEYCLOAK_CLIENT_SECRET` environment variable

4. **Consider using environment variables**:
   - Instead of committing secrets in the realm export, use Keycloak's API to set secrets after realm import
   - Or use environment variable substitution if your Keycloak deployment supports it

## Realm Configuration Details

- **Realm Name**: oauth-demo
- **Default Admin User**: admin@test.com / admin123 (change in production!)
- **Companies**: ABC, XYZ
- **User Attribute**: company (used for filtering)

### Clients

1. **nextjs-frontend**
   - Type: Public client
   - Used by: NextJS frontend application
   - No secret required (public client)

2. **nestjs-backend**
   - Type: Confidential client
   - Used by: NestJS backend API
   - **Requires secure client secret** (see security warning above)

### Roles

- **user**: Standard user role
- **admin**: Administrator role (for super admin user)

## Modifying the Realm

To make changes to the realm configuration:

1. Make changes through the Keycloak Admin Console (http://localhost:8080)
2. Export the realm:
   - Go to Realm Settings > Action > Partial Export
   - Select what you want to export
   - Download the file
3. Replace `realm-export.json` with the new export
4. **Remember to update any secrets before committing!**
