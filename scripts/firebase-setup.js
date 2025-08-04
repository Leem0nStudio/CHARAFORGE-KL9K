require('dotenv').config();
const chalk = require('chalk');

console.log(chalk.blue.bold('--- Firebase Environment Configuration Validator ---'));

const requiredClientVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const requiredServerVars = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
];

let allKeysPresent = true;
let hasPlaceholderValues = false;
let isServiceAccountValid = true;

console.log(chalk.yellow('\nChecking Client-Side (NEXT_PUBLIC_*) Variables...'));

requiredClientVars.forEach(key => {
  const value = process.env[key];
  if (!value) {
    console.error(chalk.red(`[ERROR] Missing required environment variable: ${key}`));
    allKeysPresent = false;
  } else if (value === 'changeme') {
    console.warn(chalk.yellowBright(`[WARN] Placeholder value found for: ${key}. You must replace this.`));
    hasPlaceholderValues = true;
  } else {
    console.log(chalk.green(`[OK] ${key} is set.`));
  }
});

console.log(chalk.yellow('\nChecking Server-Side (SECRET) Variables...'));

requiredServerVars.forEach(key => {
    const value = process.env[key];
    if (!value) {
        console.error(chalk.red(`[ERROR] Missing required environment variable: ${key}`));
        allKeysPresent = false;
        isServiceAccountValid = false;
    } else {
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed !== 'object' || !parsed.project_id || !parsed.private_key) {
                 console.error(chalk.red(`[ERROR] ${key} appears to be invalid. It should be a JSON object containing at least 'project_id' and 'private_key'.`));
                 isServiceAccountValid = false;
            } else {
                 console.log(chalk.green(`[OK] ${key} is set and is valid JSON.`));
            }
        } catch (e) {
            console.error(chalk.red.bold(`\n[CRITICAL ERROR] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY!`));
            console.error(chalk.red(`This usually means the key is not a valid, single-line JSON string in your .env file.`));
            console.error(chalk.red(`Error details: ${e.message}\n`));
            console.log(chalk.cyan('How to fix:'));
            console.log(chalk.cyan('1. Copy the entire contents of your service account JSON file.'));
            console.log(chalk.cyan('2. Ensure it is pasted as a single line for the FIREBASE_SERVICE_ACCOUNT_KEY value.'));
            console.log(chalk.cyan('3. There should be no line breaks within the value.\n'));
            allKeysPresent = false;
            isServiceAccountValid = false;
        }
    }
});

console.log(chalk.blue.bold('\n--- Validation Summary ---'));

if (allKeysPresent && !hasPlaceholderValues && isServiceAccountValid) {
  console.log(chalk.green.bold('✅ All Firebase environment variables are correctly configured!'));
} else {
  console.error(chalk.red.bold('❌ Your Firebase configuration has errors. Please review the messages above.'));
  if (!isServiceAccountValid) {
      console.log(chalk.yellowBright('The most critical issue is the FIREBASE_SERVICE_ACCOUNT_KEY. The application server will not start without it being correct.'));
  } else if (!allKeysPresent) {
      console.log('Please add all the missing variables listed above to your `.env` file.');
  } else if (hasPlaceholderValues) {
      console.log('Please replace all placeholder values (like "changeme") with your actual Firebase project credentials.');
  }
   console.log(chalk.cyan('\nRefer to the README.md for instructions on how to get your Firebase project credentials.'));
}

console.log(chalk.blue.bold('--- End of Validator ---\n'));

if (!allKeysPresent || !isServiceAccountValid) {
    process.exit(1);
}
