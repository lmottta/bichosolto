#!/usr/bin/env node

// Script para diagnosticar o ambiente do Railway
console.log('=== Railway Environment Diagnostic ===');

// Verificar versão do Node
console.log(`Node Version: ${process.version}`);

// Verificar variáveis de ambiente
console.log('\n=== Environment Variables ===');
const envVars = [
  'NODE_ENV',
  'PORT',
  'RAILWAY_STATIC_URL',
  'RAILWAY_PUBLIC_DOMAIN'
];

envVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] || 'not set'}`);
});

// Verificar comandos disponíveis
const { execSync } = require('child_process');

console.log('\n=== Command Availability ===');
const commands = ['node', 'npm', 'npx', 'serve'];

commands.forEach(cmd => {
  try {
    const result = execSync(`which ${cmd} || echo "not found"`).toString().trim();
    console.log(`${cmd}: ${result}`);
  } catch (error) {
    console.log(`${cmd}: Error checking - ${error.message}`);
  }
});

console.log('\n=== NPM Packages ===');
try {
  const packages = execSync('npm list --depth=0').toString();
  console.log(packages);
} catch (error) {
  console.log(`Error listing packages: ${error.message}`);
}

console.log('\n=== Directory Structure ===');
try {
  const dirStructure = execSync('ls -la').toString();
  console.log(dirStructure);
} catch (error) {
  console.log(`Error listing directory: ${error.message}`);
}

console.log('\n=== Diagnostic Complete ==='); 