/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */

const {createInterface} = require('readline');

const { PrismaClient } = require('@prisma/client'); 
const { createClient } = require('@supabase/supabase-js'); 

// import { Logger } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// import {} from './data/'
const prisma = new PrismaClient();
// const supabaseService = new SupabaseService();

const clientInstance = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
    {
      auth: {
        persistSession: false //or true
      }
    }
);
// const logger = new Logger('Init seed DB');

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

const readLineAsync = msg => new Promise(resolve => {
    readline.question(msg, userRes => {
      resolve(userRes);
    });
  });

const createUser = async () => {
  const name = await readLineAsync('Enter user name: ');
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
        'firstName': name.toString(),
        'lastName': 'Tirang',
        'email': email.toString(),
        'username': email.toString(),
        'password': '####Please provide encrypted password using crypto-js###',
        'verificationCode': '',
        'isEmailVerified': true,
        'supabaseUserId': supaId
      }
    });
    console.log('User created:', user);
} catch (e) {
  console.error('An error occurred in createUser:', e);
}
};

const createOrganization = async () => {
  const organizationName = await readLineAsync('Enter organization name: ');

  // const organization = await prisma.organisation.create({
  //   data: {
  //     name: organizationName
  //   }
  // });
  console.log('Organization created:', organizationName);
};

  async function main() {

  const choice = await readLineAsync('Choose an action (1. Create user, 2. Create organization): ');

  if ('1' === choice) {
    await createUser();
  } else if ('2' === choice) {
    await createOrganization();
  } else {
    console.error('Invalid choice.');
  }

  // Close the Prisma client connection
  // await prisma.$disconnect();
  readline.close();
}

main().catch((e) => console.error(e));
