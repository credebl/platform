/* eslint-disable camelcase */
import * as CryptoJS from 'crypto-js';
import * as fs from 'fs';
import * as util from 'util';

import { HttpStatus, Logger } from '@nestjs/common';

import { CommonConstants } from '../../common/src/common.constant';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

const connectionString = process.env.POOL_DATABASE_URL as string;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  // Added prisma logging for better debugging
  log: [
    {
      emit: 'stdout',
      level: 'error'
    },
    {
      emit: 'stdout',
      level: 'info'
    },
    {
      emit: 'stdout',
      level: 'warn'
    }
  ]
});
const logger = new Logger('Init seed DB');
let platformUserId = '';
let cachedConfig: PlatformConfig;

const configData = fs.readFileSync(
  `${process.cwd()}/libs/prisma-service/prisma/data/credebl-master-table/credebl-master-table.json`,
  'utf8'
);
const createPlatformConfig = async (): Promise<void> => {
  try {
    const existPlatformAdmin = await prisma.platform_config.findMany();

    if (0 === existPlatformAdmin.length) {
      const { platformConfigData } = JSON.parse(configData);
      const platformConfig = await prisma.platform_config.create({
        data: platformConfigData
      });

      logger.log(platformConfig);
    } else {
      logger.log('Already seeding in platform config');
    }
  } catch (error) {
    logger.error('An error occurred seeding platformConfig:', error);
    throw error;
  }
};

const createOrgRoles = async (): Promise<void> => {
  try {
    const { orgRoleData } = JSON.parse(configData);
    const roleNames = orgRoleData.map((role) => role.name);
    const existOrgRole = await prisma.org_roles.findMany({
      where: {
        name: {
          in: roleNames
        }
      }
    });

    if (0 === existOrgRole.length) {
      const orgRoles = await prisma.org_roles.createMany({
        data: orgRoleData
      });

      logger.log(orgRoles);
    } else {
      logger.log('Already seeding in org role');
    }
  } catch (error) {
    logger.error('An error occurred seeding orgRoles:', error);
    throw error;
  }
};

const createAgentTypes = async (): Promise<void> => {
  try {
    const { agentTypeData } = JSON.parse(configData);

    const agentType = agentTypeData.map((agentType) => agentType.agent);
    const existAgentType = await prisma.agents_type.findMany({
      where: {
        agent: {
          in: agentType
        }
      }
    });

    if (0 === existAgentType.length) {
      const agentTypes = await prisma.agents_type.createMany({
        data: agentTypeData
      });

      logger.log(agentTypes);
    } else {
      logger.log('Already seeding in agent type');
    }
  } catch (error) {
    logger.error('An error occurred seeding agentTypes:', error);
    throw error;
  }
};

const createOrgAgentTypes = async (): Promise<void> => {
  try {
    const { orgAgentTypeData } = JSON.parse(configData);
    const orgAgentType = orgAgentTypeData.map((orgAgentType) => orgAgentType.agent);
    const existAgentType = await prisma.org_agents_type.findMany({
      where: {
        agent: {
          in: orgAgentType
        }
      }
    });

    if (0 === existAgentType.length) {
      const orgAgentTypes = await prisma.org_agents_type.createMany({
        data: orgAgentTypeData
      });

      logger.log(orgAgentTypes);
    } else {
      logger.log('Already seeding in org agent type');
    }
  } catch (error) {
    logger.error('An error occurred seeding orgAgentTypes:', error);
    throw error;
  }
};

const createEcosystemRoles = async (): Promise<void> => {
  try {
    const { ecosystemRoleData } = JSON.parse(configData);

    const ecosystemRoleDetails = ecosystemRoleData.map((ecosystemRole) => ecosystemRole.name);
    const existEcosystemRole = await prisma.ecosystem_roles.findMany({
      where: {
        name: {
          in: ecosystemRoleDetails
        }
      }
    });

    if (0 === existEcosystemRole.length) {
      const ecosystemRoles = await prisma.ecosystem_roles.createMany({
        data: ecosystemRoleData
      });

      logger.log(ecosystemRoles);
    } else {
      logger.log('Already seeding in ecosystem roles');
    }
  } catch (error) {
    logger.error('An error occurred seeding ecosystemRoles:', error);
    throw error;
  }
};

const createPlatformUser = async (): Promise<void> => {
  try {
    const { platformAdminData } = JSON.parse(configData);
    platformAdminData.email = process.env.PLATFORM_ADMIN_EMAIL;
    platformAdminData.username = process.env.PLATFORM_ADMIN_EMAIL;

    const existPlatformAdminUser = await prisma.user.findMany({
      where: {
        email: platformAdminData.email
      }
    });

    if (0 === existPlatformAdminUser.length) {
      const platformUser = await prisma.user.create({
        data: platformAdminData
      });

      platformUserId = platformUser.id;

      logger.log(platformUser);
    } else {
      logger.log('Already seeding in user');
    }
  } catch (error) {
    logger.error('An error occurred seeding platformUser:', error);
    throw error;
  }
};

const createPlatformOrganization = async (): Promise<void> => {
  try {
    const { platformAdminOrganizationData } = JSON.parse(configData);
    platformAdminOrganizationData.createdBy = platformUserId;
    platformAdminOrganizationData.lastChangedBy = platformUserId;

    const existPlatformAdminUser = await prisma.organisation.findMany({
      where: {
        name: platformAdminOrganizationData.name
      }
    });

    if (0 === existPlatformAdminUser.length) {
      const platformOrganization = await prisma.organisation.create({
        data: platformAdminOrganizationData
      });

      logger.log(platformOrganization);
    } else {
      logger.log('Already seeding in organization');
    }
  } catch (error) {
    logger.error('An error occurred seeding platformOrganization:', error);
    throw error;
  }
};

const createPlatformUserOrgRoles = async (): Promise<void> => {
  try {
    const userId = await prisma.user.findUnique({
      where: {
        email: `${process.env.PLATFORM_ADMIN_EMAIL}`
      }
    });

    const orgId = await prisma.organisation.findFirst({
      where: {
        name: `${CommonConstants.PLATFORM_ADMIN_ORG}`
      }
    });

    const orgRoleId = await prisma.org_roles.findUnique({
      where: {
        name: `${CommonConstants.PLATFORM_ADMIN_ORG_ROLE}`
      }
    });

    if (!userId && !orgId && !orgRoleId) {
      const platformOrganization = await prisma.user_org_roles.create({
        data: {
          userId: userId.id,
          orgRoleId: orgRoleId.id,
          orgId: orgId.id
        }
      });
      logger.log(platformOrganization);
    } else {
      logger.log('Already seeding in org_roles');
    }
  } catch (error) {
    logger.error('An error occurred seeding platformOrganization:', error);
    throw error;
  }
};

const createLedger = async (): Promise<void> => {
  try {
    const { ledgerData } = JSON.parse(configData);

    const existingLedgers = await prisma.ledgers.findMany();

    if (0 === existingLedgers.length) {
      const createLedger = await prisma.ledgers.createMany({
        data: ledgerData
      });
      logger.log('All ledgers inserted:', createLedger);
    } else {
      const updatesNeeded = [];

      if (existingLedgers.length !== ledgerData.length) {
        updatesNeeded.push(ledgerData);
        if (0 < updatesNeeded.length) {
          await prisma.ledgers.deleteMany();

          const createLedger = await prisma.ledgers.createMany({
            data: ledgerData
          });
          logger.log('Updated ledgers:', createLedger);
        } else {
          logger.log('No changes in ledger data');
        }
      } else {
        logger.log('No changes in ledger data');
      }
    }
  } catch (error) {
    logger.error('An error occurred seeding createLedger:', error);
    throw error;
  }
};

const createLedgerConfig = async (): Promise<void> => {
  try {
    const { ledgerConfig } = JSON.parse(configData);

    const ledgerConfigList = await prisma.ledgerConfig.findMany();

    const checkDataIsEqual = (ledgerConfig, ledgerConfigList): boolean => {
      if (ledgerConfig.length !== ledgerConfigList.length) {
        return false;
      }

      for (let i = 0; i < ledgerConfig.length; i++) {
        const config1 = ledgerConfig[i];
        const config2 = ledgerConfigList.find(
          (item) => item.name === config1.name && JSON.stringify(item.details) === JSON.stringify(config1.details)
        );

        if (!config2) {
          return false;
        }
      }
      return true;
    };

    if (0 === ledgerConfigList.length) {
      const configDetails = await prisma.ledgerConfig.createMany({
        data: ledgerConfig
      });
      logger.log('Ledger config created:', configDetails);
    } else if (!checkDataIsEqual(ledgerConfig, ledgerConfigList)) {
      await prisma.ledgerConfig.deleteMany({});
      const configDetails = await prisma.ledgerConfig.createMany({
        data: ledgerConfig
      });
      logger.log('Existing ledger config deleted and new ones created:', configDetails);
    } else {
      logger.log('Already seeding in ledger config');
    }
  } catch (error) {
    logger.error('An error occurred while configuring ledger:', error);
    throw error;
  }
};

const createUserRole = async (): Promise<void> => {
  try {
    const { userRoleData } = JSON.parse(configData);

    const userRoleDetails = userRoleData.map((userRole) => userRole.role);
    const existUserRole = await prisma.user_role.findMany({
      where: {
        role: {
          in: userRoleDetails
        }
      }
    });

    if (0 === existUserRole.length) {
      const userRole = await prisma.user_role.createMany({
        data: userRoleData
      });

      logger.log(userRole);
    } else {
      logger.log('Already seeding in user role');
    }
  } catch (error) {
    logger.error('An error occurred seeding user role:', error);
    throw error;
  }
};

const migrateOrgAgentDids = async (): Promise<void> => {
  try {
    const orgAgents = await prisma.org_agents.findMany({
      where: {
        walletName: {
          not: 'platform-admin'
        }
      }
    });

    const orgDids = orgAgents.map((agent) => agent.orgDid).filter((did) => null !== did && '' !== did);
    const existingDids = await prisma.org_dids.findMany({
      where: {
        did: {
          in: orgDids
        }
      }
    });

    const filteredOrgAgents = orgAgents.filter((agent) => null !== agent.orgDid && '' !== agent.orgDid);

    // If there are org DIDs that do not exist in org_dids table
    if (orgDids.length !== existingDids.length) {
      const newOrgAgents = filteredOrgAgents.filter((agent) => !existingDids.some((did) => did.did === agent.orgDid));

      const newDidRecords = newOrgAgents.map((agent) => ({
        orgId: agent.orgId,
        did: agent.orgDid,
        didDocument: agent.didDocument,
        isPrimaryDid: true,
        createdBy: agent.createdBy,
        lastChangedBy: agent.lastChangedBy,
        orgAgentId: agent.id
      }));

      const didInsertResult = await prisma.org_dids.createMany({
        data: newDidRecords
      });

      logger.log(didInsertResult);
    } else {
      logger.log('No new DIDs to migrate in migrateOrgAgentDids');
    }
  } catch (error) {
    logger.error('An error occurred during migrateOrgAgentDids:', error);
    throw error;
  }
};

const addSchemaType = async (): Promise<void> => {
  try {
    const emptyTypeSchemaList = await prisma.schema.findMany({
      where: {
        OR: [{ type: null }, { type: '' }]
      }
    });
    if (0 < emptyTypeSchemaList.length) {
      const updatePromises = emptyTypeSchemaList.map((schema) =>
        prisma.schema.update({
          where: { id: schema.id },
          data: { type: 'indy' }
        })
      );
      await Promise.all(updatePromises);

      logger.log('Schemas updated successfully');
    } else {
      logger.log('No schemas to update');
    }
  } catch (error) {
    logger.error('An error occurred during addSchemaType:', error);
    throw error;
  }
};

const importGeoLocationMasterData = async (): Promise<void> => {
  try {
    const scriptPath = process.env.GEO_LOCATION_MASTER_DATA_IMPORT_SCRIPT;
    const dbUrl = process.env.DATABASE_URL;

    if (!scriptPath || !dbUrl) {
      throw new Error('Environment variables GEO_LOCATION_MASTER_DATA_IMPORT_SCRIPT or DATABASE_URL are not set.');
    }

    const command = `${process.cwd()}/${scriptPath} ${dbUrl}`;

    const { stdout, stderr } = await execPromise(command);

    if (stdout) {
      logger.log(`Shell script output: ${stdout}`);
    }
    if (stderr) {
      logger.error(`Shell script error: ${stderr}`);
    }
  } catch (error) {
    logger.error('An error occurred during importGeoLocationMasterData:', error);
    throw error;
  }
};

const encryptClientCredential = async (clientCredential: string): Promise<string> => {
  try {
    const encryptedToken = CryptoJS.AES.encrypt(
      JSON.stringify(clientCredential),
      process.env.CRYPTO_PRIVATE_KEY
    ).toString();

    return encryptedToken;
  } catch (error) {
    logger.error('An error occurred during encryptClientCredential:', error);
    throw error;
  }
};

const updateClientCredential = async (): Promise<void> => {
  try {
    const scriptPath = process.env.UPDATE_CLIENT_CREDENTIAL_SCRIPT;
    const dbUrl = process.env.DATABASE_URL;
    const clientId = process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET;

    if (!scriptPath || !dbUrl || !clientId || !clientSecret) {
      throw new Error(
        'Environment variables UPDATE_CLIENT_CREDENTIAL_SCRIPT or DATABASE_URL or clientId or clientSecret are not set.'
      );
    }

    const encryptedClientId = await encryptClientCredential(process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID);
    const encryptedClientSecret = await encryptClientCredential(process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET);

    const command = `${process.cwd()}/${scriptPath} ${dbUrl} ${encryptedClientId} ${encryptedClientSecret}`;

    const { stdout, stderr } = await execPromise(command);

    if (stdout) {
      logger.log(`Shell script output: ${stdout}`);
    }
    if (stderr) {
      logger.error(`Shell script error: ${stderr}`);
    }
  } catch (error) {
    logger.error('An error occurred during updateClientCredential:', error);
    throw error;
  }
};

export const updateClientId = async (): Promise<void> => {
  const { KEYCLOAK_MANAGEMENT_CLIENT_ID, CRYPTO_PRIVATE_KEY } = process.env;

  if (!KEYCLOAK_MANAGEMENT_CLIENT_ID || !CRYPTO_PRIVATE_KEY) {
    throw new Error('Missing required environment variables');
  }

  const OLD_CLIENT_ID = process.env.PLATFORM_ADMIN_OLD_CLIENT_ID;
  if (!OLD_CLIENT_ID) {
    logger.log('Skipping updateClientId script requires PLATFORM_ADMIN_OLD_CLIENT_ID');
    return;
  }
  // Encrypt once
  const newEncryptedClientId = CryptoJS.AES.encrypt(
    JSON.stringify(KEYCLOAK_MANAGEMENT_CLIENT_ID),
    CRYPTO_PRIVATE_KEY
  ).toString();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      clientId: true,
      firstName: true,
      email: true
    }
  });

  let updatedCount = 0;

  for (const user of users) {
    if (user.email === cachedConfig.platformEmail) {
      logger.log('⚠️ Skipping update of clientId for platform admin');
      continue;
    }
    let decryptedClientId: string;
    if (!user.clientId) {
      logger.warn(`⚠️ Skipping user ${user.id} - no clientId set`);
      continue;
    }
    try {
      const bytes = CryptoJS.AES.decrypt(user.clientId, CRYPTO_PRIVATE_KEY);
      decryptedClientId = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch {
      logger.warn(`⚠️ Could not decrypt clientId for user ${user.id}`);
      continue;
    }

    if (decryptedClientId === OLD_CLIENT_ID) {
      await prisma.user.update({
        where: { id: user.id },
        data: { clientId: newEncryptedClientId }
      });

      updatedCount++;
      logger.log(`✅ Updated user ${user.id} (${user.firstName})`);
    }
  }

  logger.log(`🎉 Finished. Updated ${updatedCount} users.\n`);
};

const updatePlatformUserRole = async (): Promise<void> => {
  logger.log('Executing update script for platform user org role');
  try {
    const userId = await prisma.user.findUnique({
      where: {
        email: `${cachedConfig.platformEmail}`
      }
    });

    const orgId = await prisma.organisation.findFirst({
      where: {
        name: `${CommonConstants.PLATFORM_ADMIN_ORG}`
      }
    });

    const orgRoleId = await prisma.org_roles.findUnique({
      where: {
        name: `${CommonConstants.PLATFORM_ADMIN_ORG_ROLE}`
      }
    });

    if (!userId || !orgId || !orgRoleId) {
      throw new Error(
        `Required entities not found please ensure record for user, org and orgRole exist of platform admin`
      );
    }

    const platformUserRole = await prisma.user_org_roles.findFirst({
      where: {
        userId: userId.id,
        orgId: orgId.id,
        orgRoleId: orgRoleId.id
      }
    });

    if (!platformUserRole) {
      const platformOrganization = await prisma.user_org_roles.create({
        data: {
          userId: userId.id,
          orgRoleId: orgRoleId.id,
          orgId: orgId.id
        }
      });
      logger.log(
        `✅ user org role for platform admin added successfully \n${JSON.stringify(platformOrganization, null, 2)}\n`
      );
    } else {
      logger.log('Already seeding in user_org_roles\n');
    }
  } catch (error) {
    logger.error('An error occurred seeding platformOrganization:', error);
    throw error;
  }
};

export async function getKeycloakToken(): Promise<string> {
  const { KEYCLOAK_DOMAIN, KEYCLOAK_REALM, PLATFORM_ADMIN_KEYCLOAK_ID, PLATFORM_ADMIN_KEYCLOAK_SECRET } = process.env;

  if (!KEYCLOAK_DOMAIN || !KEYCLOAK_REALM || !PLATFORM_ADMIN_KEYCLOAK_ID || !PLATFORM_ADMIN_KEYCLOAK_SECRET) {
    throw new Error('Missing Keycloak env vars');
  }

  const res = await fetch(
    `${process.env.KEYCLOAK_DOMAIN}realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: PLATFORM_ADMIN_KEYCLOAK_ID,
        client_secret: PLATFORM_ADMIN_KEYCLOAK_SECRET
      })
    }
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Keycloak token (${res.status}): ${data.error_description || data.error || 'Unknown error'}`
    );
  }
  if (!data.access_token) {
    throw new Error('Keycloak response missing access_token');
  }
  return data.access_token;
}

export async function createKeycloakUser(): Promise<void> {
  logger.log(`✅ Creating keycloak user for platform admin`);
  const { platformAdminData } = JSON.parse(configData);
  if (!platformAdminData?.password) {
    throw new Error('platformAdminData password is missing from credebl-master-table.json');
  }
  if (!cachedConfig) {
    throw new Error('failed to load platform config data from db');
  }

  const {
    KEYCLOAK_DOMAIN,
    KEYCLOAK_REALM,
    PLATFORM_ADMIN_KEYCLOAK_ID,
    PLATFORM_ADMIN_KEYCLOAK_SECRET,
    CRYPTO_PRIVATE_KEY
  } = process.env;

  if (
    !KEYCLOAK_DOMAIN ||
    !KEYCLOAK_REALM ||
    !PLATFORM_ADMIN_KEYCLOAK_ID ||
    !PLATFORM_ADMIN_KEYCLOAK_SECRET ||
    !CRYPTO_PRIVATE_KEY
  ) {
    throw new Error(
      'Missing required environment variables for either PLATFORM_ADMIN_USER_PASSWORD or KEYCLOAK_DOMAIN or KEYCLOAK_REALM or PLATFORM_ADMIN_KEYCLOAK_ID or PLATFORM_ADMIN_KEYCLOAK_SECRET or CRYPTO_PRIVATE_KEY'
    );
  }
  const decryptedPassword = CryptoJS.AES.decrypt(platformAdminData.password, CRYPTO_PRIVATE_KEY);
  const token = await getKeycloakToken();
  const user = {
    username: cachedConfig.platformEmail,
    email: cachedConfig.platformEmail,
    firstName: cachedConfig.platformName,
    lastName: cachedConfig.platformName,
    password: decryptedPassword.toString(CryptoJS.enc.Utf8)
  };
  const res = await fetch(`${KEYCLOAK_DOMAIN}admin/realms/${KEYCLOAK_REALM}/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      enabled: true,
      emailVerified: true,
      credentials: user.password
        ? [
            {
              type: 'password',
              value: user.password,
              temporary: false
            }
          ]
        : []
    })
  });

  if (HttpStatus.CONFLICT === res.status) {
    logger.log(`⚠️ User ${user.username} already exists`);
    return;
  }

  if (HttpStatus.CREATED !== res.status) {
    const errorText = await res.text();
    throw new Error(`Failed to create Keycloak user (${res.status}): ${errorText}`);
  }
  const location = res.headers.get('location');

  if (!location) {
    throw new Error('Keycloak did not return Location header');
  }

  const userId = location.split('/').pop();

  if (userId) {
    logger.log('Check if platform admin exists');
    const existingUser = await prisma.user.findUnique({
      where: { email: cachedConfig.platformEmail }
    });

    if (!existingUser) {
      throw new Error(`User with email ${cachedConfig.platformEmail} not found in database`);
    }
    logger.log(`✅ Platform admin found in database`);

    const encClientId = CryptoJS.AES.encrypt(JSON.stringify(PLATFORM_ADMIN_KEYCLOAK_ID), CRYPTO_PRIVATE_KEY).toString();

    const encClientSecret = CryptoJS.AES.encrypt(
      JSON.stringify(PLATFORM_ADMIN_KEYCLOAK_SECRET),
      CRYPTO_PRIVATE_KEY
    ).toString();

    await prisma.user.update({
      where: { email: cachedConfig.platformEmail },
      data: {
        keycloakUserId: userId,
        clientId: encClientId,
        clientSecret: encClientSecret
      }
    });
    logger.log(`✅ Platform admin added and updated to user's table sucessfully`);
  } else {
    throw new Error('Failed to extract user ID from Location header');
  }
}

type PlatformConfig = {
  platformUsername: string;
  platformEmail: string;
  platformName: string;
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  logger.log('Getting platform config');
  if (cachedConfig) {
    return cachedConfig;
  }

  const configFromDb = await prisma.user.findUnique({ where: { email: process.env.PLATFORM_ADMIN_EMAIL } });

  if (!configFromDb) {
    throw new Error('Platform config not found in DB');
  }

  if (!configFromDb.username || !configFromDb.email || !configFromDb.firstName) {
    throw new Error('Platform config table is missing required fields from user || email || firstName');
  }

  cachedConfig = {
    platformUsername: configFromDb.username, //this is the same as platform email
    platformEmail: configFromDb.email,
    platformName: configFromDb.firstName
  };

  return cachedConfig;
}

async function main(): Promise<void> {
  await createOrgRoles();
  await createAgentTypes();
  await createPlatformUser();
  await createPlatformOrganization();
  await createPlatformUserOrgRoles();
  await createOrgAgentTypes();
  await createEcosystemRoles();
  await createLedger();
  await createLedgerConfig();
  await createUserRole();
  await migrateOrgAgentDids();
  await addSchemaType();
  await importGeoLocationMasterData();
  await updateClientCredential();
  await createPlatformConfig();

  await getPlatformConfig();
  await updateClientId();
  await updatePlatformUserRole();
  await createKeycloakUser();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    logger.error(`In prisma seed initialize`, error);
    await prisma.$disconnect();
    process.exit(1);
  });
