# CREDEBL UI User Guide

## Introduction
CREDEBL is an open-source Self-Sovereign Identity (SSI) and Verifiable Credentials platform.  
This guide helps users navigate the CREDEBL User Interface (UI) efficiently.

## Accessing the Platform
1. Open your browser.
2. Navigate to your environment:
   - Local development: `http://localhost:5000`
   - Hosted environment: as provided by your administrator
3. Log in using your credentials or developer account for local setups.

## Dashboard Overview
- **Users**: Manage users and their credentials.
- **Ledger**: View issued credentials and verification history.
- **Organizations**: Manage organizational accounts and credentials.
- **Connections**: Track SSI connections and their status.
- **Issuance & Verification**: Issue credentials or verify existing ones.

## Navigation
- Use the **sidebar menu** to switch between modules.
- Hover over icons to see tooltips explaining their functions.
- Use search bars and filters to quickly locate records.

## Modules

### Users
- **Add User**: Fill required fields and click *Create*.
- **Search Users**: Filter by ID, name, or email.
- **View Details**: Click on a user to view full credentials and history.

### Ledger
- Lists all issued credentials with columns like credential ID, type, issuer, and status.
- Filter results by type, status, or date range.

### Organizations
- **Add Organization**: Provide name, type, and assign credentials.
- **Manage Credentials**: Assign, revoke, or view credentials for organizations.

### Connections
- Shows active SSI connections including status, last activity, and associated users.
- Use filters to locate specific connections.

### Issuance & Verification
- **Issue Credential**:
  1. Select credential type.
  2. Choose recipient (user or organization).
  3. Fill required fields.
  4. Click *Issue Credential*.
- **Verify Credential**:
  1. Enter credential ID.
  2. System checks ledger.
  3. Displays verification result.

## Best Practices
- Verify credentials before issuing.
- Ensure all environment variables are correctly configured.
- Restart services if UI is not reflecting updates.

## Troubleshooting
- **UI not accessible**: Confirm API Gateway and microservices are running.
- **Credential issuance errors**: Check Prisma database schema and restart services.
- **UI outdated**: Clear browser cache or restart frontend.

## Additional Resources
- [CREDEBL GitHub Repository](https://github.com/credebl/platform)
- [Backend Setup & Environment Guide](README.md)
- [Docker & NATS Documentation](https://docs.docker.com/)

---

*This guide is maintained by contributors and will be updated as CREDEBL evolves.*
