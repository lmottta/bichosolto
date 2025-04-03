require('dotenv').config();
const { sequelize } = require('./config');

async function fixDatabaseTables() {
  console.log('=== INICIANDO CORREÇÃO DO BANCO DE DADOS ===');
  
  try {
    // Verificar se existe conexão
    await sequelize.authenticate();
    console.log('Conexão com banco de dados estabelecida.');

    // Verificar tabelas existentes
    const [tables] = await sequelize.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tabelas encontradas no banco:', tables.map(t => t.tablename).join(', '));

    // Verificar se existem tabelas duplicadas (Maiúsculas e minúsculas)
    const tableNames = tables.map(t => t.tablename.toLowerCase());
    const duplicates = tableNames.filter((item, index) => tableNames.indexOf(item) !== index);

    if (duplicates.length > 0) {
      console.log('Tabelas duplicadas encontradas (diferença de capitalização):');
      for (const duplicate of duplicates) {
        const variants = tables
          .map(t => t.tablename)
          .filter(name => name.toLowerCase() === duplicate);
        
        console.log(`- ${duplicate}: ${variants.join(', ')}`);
      }

      // Verificar se há dados nas tabelas
      for (const tableName of tables.map(t => t.tablename)) {
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`Tabela "${tableName}" tem ${count[0].count} registros.`);
        
        // Se for uma tabela Users/users, vamos exibir detalhes
        if (tableName.toLowerCase() === 'users') {
          const [columns] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${tableName}'
          `);
          console.log(`Colunas da tabela "${tableName}":`, columns.map(c => c.column_name).join(', '));
        }
      }

      // Sugerir correção
      console.log('\n=== SUGESTÃO DE CORREÇÃO ===');
      console.log('Execute os seguintes comandos SQL para resolver o problema:');
      
      // Para cada duplicata
      for (const duplicate of [...new Set(duplicates)]) {
        const variants = tables
          .map(t => t.tablename)
          .filter(name => name.toLowerCase() === duplicate);
        
        // Verificar qual variante tem dados
        let hasDataVariants = [];
        for (const variant of variants) {
          const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM "${variant}"`);
          if (parseInt(count[0].count) > 0) {
            hasDataVariants.push({name: variant, count: parseInt(count[0].count)});
          }
        }
        
        if (hasDataVariants.length === 0) {
          // Se nenhuma tem dados, manter apenas a versão correta para o Sequelize
          const correctVariant = duplicate.charAt(0).toUpperCase() + duplicate.slice(1).toLowerCase();
          const incorrectVariants = variants.filter(v => v !== correctVariant);
          
          for (const incorrectVariant of incorrectVariants) {
            console.log(`-- Remover tabela vazia: ${incorrectVariant}`);
            console.log(`DROP TABLE IF EXISTS "${incorrectVariant}";`);
          }
        } else if (hasDataVariants.length === 1) {
          // Se só uma tem dados, manter essa e excluir as outras
          const correctVariant = hasDataVariants[0].name;
          const correctName = duplicate.charAt(0).toUpperCase() + duplicate.slice(1).toLowerCase();
          
          if (correctVariant !== correctName) {
            console.log(`-- Renomear tabela com dados para formato correto`);
            console.log(`ALTER TABLE "${correctVariant}" RENAME TO "${correctName}_temp";`);
            console.log(`DROP TABLE IF EXISTS "${correctName}";`);
            console.log(`ALTER TABLE "${correctName}_temp" RENAME TO "${correctName}";`);
          }
          
          // Remover outras variantes vazias
          const incorrectVariants = variants.filter(v => v !== correctVariant);
          for (const incorrectVariant of incorrectVariants) {
            console.log(`-- Remover tabela vazia: ${incorrectVariant}`);
            console.log(`DROP TABLE IF EXISTS "${incorrectVariant}";`);
          }
        } else {
          // Caso complexo: mais de uma tabela com dados
          console.log(`-- ATENÇÃO: Múltiplas tabelas para "${duplicate}" contêm dados:`);
          for (const variant of hasDataVariants) {
            console.log(`--   * "${variant.name}" tem ${variant.count} registros`);
          }
          console.log(`-- Recomendamos migrar os dados manualmente antes de resolver`);
        }
      }
    } else {
      console.log('Não foram encontradas tabelas duplicadas.');
    }

    console.log('\n=== FINALIZADO DIAGNÓSTICO ===');
  } catch (error) {
    console.error('Erro ao corrigir banco de dados:', error);
  } finally {
    await sequelize.close();
  }
}

fixDatabaseTables(); 