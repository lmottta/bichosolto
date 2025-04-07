const fs = require('fs');
const path = require('path');
const { sequelize } = require('./config');

async function runFixScript() {
  try {
    console.log('Executando script de correção de tabelas...');
    
    // Ler o script SQL
    const sqlFilePath = path.join(__dirname, 'fix-tables.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Executar o script
    await sequelize.query(sqlScript);
    
    console.log('Script executado com sucesso!');
    
    // Verificar tabelas após correção
    const [tablesAfter] = await sequelize.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tabelas após correção:', tablesAfter.map(t => t.tablename).join(', '));
    
  } catch (error) {
    console.error('Erro ao executar script de correção:', error);
  } finally {
    await sequelize.close();
  }
}

runFixScript(); 