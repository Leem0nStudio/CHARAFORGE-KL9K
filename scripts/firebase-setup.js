require('dotenv').config();

const chalk = require('chalk'); // Using chalk for better terminal output visibility

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

console.log(chalk.yellow('\nChecking Server-Side Variables...'));

requiredServerVars.forEach(key => {
    const value = process.env[key];
    if (!value) {
        console.error(chalk.red(`[ERROR] Missing required environment variable: ${key}`));
        allKeysPresent = false;
    } else {
        try {
            // Check if it's a valid JSON object string
            const parsed = JSON.parse(value);
            if (Object.keys(parsed).length === 0) {
                 console.warn(chalk.yellowBright(`[WARN] ${key} is an empty JSON object '{}'. This is valid for starting the app but required for server features.`));
                 hasPlaceholderValues = true;
            } else {
                 console.log(chalk.green(`[OK] ${key} is set and is valid JSON.`));
            }
        } catch (e) {
            console.error(chalk.red(`[ERROR] ${key} is not a valid JSON string. Please ensure it's copied correctly.`));
            allKeysPresent = false;
        }
    }
});


console.log(chalk.blue.bold('\n--- Validation Summary ---'));

if (allKeysPresent && !hasPlaceholderValues) {
  console.log(chalk.green.bold('✅ All Firebase environment variables are correctly configured!'));
} else {
  console.error(chalk.red.bold('❌ Your Firebase configuration is incomplete.'));
  if (!allKeysPresent) {
      console.log('Please add all the missing variables listed above to your `.env` file.');
  }
  if (hasPlaceholderValues) {
      console.log('Please replace all placeholder values (like "changeme" or "{}") with your actual Firebase project credentials.');
  }
   console.log(chalk.cyan('\nRefer to the README.md for instructions on how to get your Firebase project credentials.'));
}

console.log(chalk.blue.bold('--- End of Validator ---\n'));

if (!allKeysPresent || hasPlaceholderValues) {
    process.exit(1); // Exit with an error code to fail CI/CD pipelines if needed
}
