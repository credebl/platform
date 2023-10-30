/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */

// eslint-disable-next-line camelcase
const {createInterface} = require('readline');

const { PrismaClient } = require('@prisma/client'); 
const { createClient } = require('@supabase/supabase-js'); 

const prisma = new PrismaClient();

const clientInstance = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
    {
      auth: {
        persistSession: false //or true
      }
    }
);

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

const readLineAsync = msg => new Promise(resolve => {
    readline.question(msg, userRes => {
      resolve(userRes);
    });
  });

// eslint-disable-next-line camelcase
const getRole = async (roleName) => {
  try {
    const roleDetails = await prisma.org_roles.findFirst({
      where: {
        name: roleName
      }
    });
    return roleDetails;
  } catch (error) {
    console.error('An error occurred in getRole:', error);
  }
};

const createUserOrgRole = async(userId, roleId) => {
  try {
    const data = {
      orgRole: { connect: { id: roleId } },
      user: { connect: { id: userId } }
    };

    const saveResponse = await prisma.user_org_roles.create({
      data
    });

    return saveResponse;
  } catch (error) {
    console.error('An error occurred in createUserOrgRole:', error);
  }
};

const createUser = async () => {
  const firstName = await readLineAsync('Enter your first name: ');
  const lastName = await readLineAsync('Enter your last name: ');
  const email = await readLineAsync('Enter email address: ');
  const password = await readLineAsync('Enter your password: ');

  try {
    const supaUser = await clientInstance.auth.signUp({
      email: email.toString(),
      password: password.toString()
    });

    const supaId = supaUser.data?.user?.id;

    const user = await prisma.user.create({
      data: {
        'firstName': firstName.toString(),
        'lastName': lastName.toString(),
        'email': email.toString(),
        'username': email.toString(),
        'password': '',
        'verificationCode': '',
        'isEmailVerified': true,
        'supabaseUserId': supaId
      }
    });

    const platformRoleData = await getRole('platform_admin');
    
    await createUserOrgRole(user.id, platformRoleData['id']);
    
    console.log('Platform admin user created');

} catch (e) {
  console.error('An error occurred in createUser:', e);
}
};

async function main() {
  await createUser();
  readline.close();
}

main().catch((e) => console.error(e));
