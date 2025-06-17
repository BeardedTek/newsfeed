#!/usr/bin/env node

// Script to replace environment variable placeholders in env-config.js
const fs = require('fs');
const path = require('path');

// Path to the env-config.js file
const envConfigPath = path.join(process.cwd(), 'public', 'env-config.js');

// Read the template file
console.log(`Reading template from ${envConfigPath}`);
let content;
try {
  content = fs.readFileSync(envConfigPath, 'utf8');
} catch (error) {
  console.error('Error reading env-config.js template:', error);
  process.exit(1);
}

// Define the variables we want to expose to the frontend
// Format: [variable name with NEXT_PUBLIC_ prefix, variable name without prefix]
const envVarMappings = [
  ['NEXT_PUBLIC_CASDOOR_SERVER_URL', 'CASDOOR_SERVER_URL'],
  ['NEXT_PUBLIC_CASDOOR_CLIENT_ID', 'CASDOOR_CLIENT_ID'],
  ['NEXT_PUBLIC_CASDOOR_CLIENT_SECRET', 'CASDOOR_CLIENT_SECRET'],
  ['NEXT_PUBLIC_CASDOOR_APP_NAME', 'CASDOOR_APP_NAME'],
  ['NEXT_PUBLIC_CASDOOR_ORG_NAME', 'CASDOOR_ORG_NAME'],
  ['NEXT_PUBLIC_CASDOOR_REDIRECT_URI', 'CASDOOR_REDIRECT_URI'],
  ['NEXT_PUBLIC_CONTACT_FORM_ACTION', 'CONTACT_FORM_ACTION']
];

// Replace each placeholder with its actual environment variable value
envVarMappings.forEach(([nextPublicVar, plainVar]) => {
  const placeholder = `__${nextPublicVar}__`;
  
  // First try with NEXT_PUBLIC_ prefix, then without
  const value = process.env[nextPublicVar] || process.env[plainVar] || '';
  
  content = content.replace(placeholder, value);
  console.log(`Replaced ${placeholder} with ${value ? 'value' : 'empty string'}`);
});

// Write the updated content back to the file
try {
  fs.writeFileSync(envConfigPath, content, 'utf8');
  console.log('Successfully updated env-config.js with environment variables');
} catch (error) {
  console.error('Error writing updated env-config.js:', error);
  process.exit(1);
} 