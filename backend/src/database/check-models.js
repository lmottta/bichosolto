require('dotenv').config();
const { sequelize } = require('./config');
const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');

async function checkModels() {
  try {
    console.log('=== VERIFICANDO MODELOS E TABELAS ===');
    
    // Verificar conexão com banco de dados
    await sequelize.authenticate();
    console.log('✓ Conexão com banco de dados estabelecida');
    
    // Verificar tabelas no banco de dados
    const [tables] = await sequelize.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log(`\nTabelas existentes (${tables.length}):`);
    tables.forEach(t => console.log(`- ${t.tablename}`));
    
    // Verificar modelos no diretório
    const modelsDir = path.join(__dirname, '..', 'models');
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js') && file !== 'index.js');
    
    console.log(`\nModelos encontrados (${modelFiles.length}):`);
    modelFiles.forEach(file => console.log(`- ${file}`));
    
    // Carregar todos os modelos
    console.log('\nVerificando cada modelo:');
    for (const file of modelFiles) {
      const modelName = file.replace('.js', '');
      console.log(`\n>> Modelo: ${modelName}`);
      
      // Tentar obter tabela correspondente
      const modelPath = path.join(modelsDir, file);
      const model = require(modelPath);
      
      if (!model) {
        console.log(`✗ Modelo ${modelName} não exportado corretamente`);
        continue;
      }
      
      const tableName = model.getTableName();
      console.log(`   Tabela: ${tableName}`);
      
      // Verificar se a tabela existe
      const tableExists = tables.some(t => t.tablename.toLowerCase() === tableName.toLowerCase());
      if (tableExists) {
        console.log(`   ✓ Tabela existe no banco de dados`);
        
        // Verificar colunas timestamp
        try {
          const [columns] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = '${tableName}'
            ORDER BY ordinal_position
          `);
          
          const hasCreatedAt = columns.some(c => c.column_name === 'createdAt');
          const hasUpdatedAt = columns.some(c => c.column_name === 'updatedAt');
          
          console.log(`   Timestamps: createdAt=${hasCreatedAt ? '✓' : '✗'}, updatedAt=${hasUpdatedAt ? '✓' : '✗'}`);
          
          if (!hasCreatedAt || !hasUpdatedAt) {
            console.log(`   ⚠️ ALERTA: Tabela ${tableName} não tem colunas de timestamp ou usa nome diferente`);
            console.log(`   💡 SOLUÇÃO: Adicione as colunas 'createdAt' e 'updatedAt' ao modelo ${modelName}.js manualmente`);
            console.log(`   Exemplo:
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }`);
          }
          
          // Verificar modelo explicitamente
          const hasCreatedAtAttribute = model.rawAttributes && model.rawAttributes.createdAt;
          const hasUpdatedAtAttribute = model.rawAttributes && model.rawAttributes.updatedAt;
          
          if (!hasCreatedAtAttribute || !hasUpdatedAtAttribute) {
            console.log(`   ⚠️ ALERTA: Modelo ${modelName} não define explicitamente os atributos de timestamp`);
          }
          
        } catch (error) {
          console.error(`   ✗ Erro ao verificar colunas: ${error.message}`);
        }
      } else {
        console.log(`   ✗ Tabela não existe no banco de dados`);
      }
    }
    
    console.log('\n=== DIAGNÓSTICO COMPLETO ===');
    console.log('Recomendações:');
    console.log('1. Certifique-se de que todos os modelos definam explicitamente createdAt e updatedAt');
    console.log('2. Verifique se as tabelas existentes têm essas colunas');
    console.log('3. Se necessário, defina RESET_DB=true no .env para recriar todas as tabelas (isso apagará os dados)');
    
  } catch (error) {
    console.error('Erro ao verificar modelos:', error);
  } finally {
    await sequelize.close();
  }
}

checkModels(); 