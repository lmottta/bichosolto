require('dotenv').config();
const { sequelize } = require('./config');
const fs = require('fs');
const path = require('path');

// Lista de modelos a verificar/corrigir - estes são nomes esperados de modelos
// (não os nomes de arquivo - baseados em convenções comuns do Sequelize)
const EXPECTED_MODELS = ['User', 'Report', 'Animal', 'Event', 'Donation', 'Volunteer'];

async function fixAllModels() {
  try {
    console.log('=== CORRIGINDO TABELAS DO BANCO DE DADOS ===');
    
    // Verificar conexão com banco de dados
    await sequelize.authenticate();
    console.log('✓ Conexão com banco de dados estabelecida');
    
    // Verificar tabelas existentes
    const [tables] = await sequelize.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    const tableNames = tables.map(t => t.tablename);
    console.log(`\nTabelas encontradas (${tableNames.length}):`, tableNames.join(', '));
    
    // Adicionar colunas de timestamp a todas as tabelas existentes
    let fixedTables = 0;
    let skippedTables = 0;
    let errorTables = 0;
    
    for (const tableName of tableNames) {
      console.log(`\n>> Verificando tabela: ${tableName}`);
      
      try {
        // Verificar se a tabela já tem timestamps
        const [columns] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
        `);
        
        const columnNames = columns.map(c => c.column_name);
        console.log(`   Colunas existentes: ${columnNames.join(', ')}`);
        
        const hasCreatedAt = columnNames.includes('createdAt');
        const hasUpdatedAt = columnNames.includes('updatedAt');
        
        if (!hasCreatedAt || !hasUpdatedAt) {
          console.log(`   ⚠️ Faltam colunas de timestamp: createdAt=${hasCreatedAt ? '✓' : '✗'}, updatedAt=${hasUpdatedAt ? '✓' : '✗'}`);
          
          // Adicionar colunas faltantes com um valor padrão
          let addedColumns = 0;
          
          if (!hasCreatedAt) {
            console.log(`   Adicionando coluna 'createdAt'...`);
            await sequelize.query(`
              ALTER TABLE "${tableName}" 
              ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE 
              DEFAULT CURRENT_TIMESTAMP
            `);
            addedColumns++;
          }
          
          if (!hasUpdatedAt) {
            console.log(`   Adicionando coluna 'updatedAt'...`);
            await sequelize.query(`
              ALTER TABLE "${tableName}" 
              ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE 
              DEFAULT CURRENT_TIMESTAMP
            `);
            addedColumns++;
          }
          
          console.log(`   ✅ Tabela corrigida! Adicionadas ${addedColumns} colunas.`);
          fixedTables++;
        } else {
          console.log(`   ✓ Tabela já tem colunas de timestamp`);
          skippedTables++;
        }
      } catch (error) {
        console.error(`   ✗ Erro ao corrigir tabela ${tableName}:`, error.message);
        errorTables++;
      }
    }
    
    // Verificar arquivos de modelo existentes
    console.log('\n=== VERIFICANDO ARQUIVOS DE MODELO ===');
    const modelsDir = path.join(__dirname, '..', 'models');
    const modelFiles = fs.readdirSync(modelsDir).filter(file => 
      file.endsWith('.js') && file !== 'index.js'
    );
    
    console.log(`Encontrados ${modelFiles.length} arquivos de modelo:`);
    modelFiles.forEach(file => console.log(`- ${file}`));
    
    // Verificar e corrigir cada arquivo de modelo
    let fixedModels = 0;
    let skippedModels = 0;
    let errorModels = 0;
    
    for (const file of modelFiles) {
      const modelPath = path.join(modelsDir, file);
      console.log(`\n>> Verificando modelo: ${file}`);
      
      try {
        // Ler conteúdo do arquivo
        let content = fs.readFileSync(modelPath, 'utf8');
        
        // Verificar se o modelo já define timestamps
        const hasCreatedAt = content.includes('createdAt:') || content.includes('createdAt :');
        const hasUpdatedAt = content.includes('updatedAt:') || content.includes('updatedAt :');
        
        if (!hasCreatedAt || !hasUpdatedAt) {
          console.log(`   ⚠️ Modelo não define timestamps explicitamente: createdAt=${hasCreatedAt ? '✓' : '✗'}, updatedAt=${hasUpdatedAt ? '✓' : '✗'}`);
          
          // Encontrar o local para adicionar as colunas
          const lastPropMatch = content.match(/(\w+)\s*:\s*{[^{}]*}\s*[,\n](?=[^\w{}]*([},]|$))/g);
          
          if (lastPropMatch) {
            const lastProp = lastPropMatch[lastPropMatch.length - 1];
            const insertPos = content.indexOf(lastProp) + lastProp.length;
            
            // Prepara as propriedades para adicionar
            let propsToAdd = '';
            if (!hasCreatedAt) {
              propsToAdd += `,\n  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }`;
            }
            if (!hasUpdatedAt) {
              propsToAdd += `,\n  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }`;
            }
            
            // Insere as propriedades
            content = content.slice(0, insertPos) + propsToAdd + content.slice(insertPos);
            
            // Certifica-se que timestamps: true está presente nas opções
            const timestampsOption = 'timestamps: true';
            const optionsMatch = content.match(/\{\s*hooks\s*:|tableName:/);
            
            if (optionsMatch && !content.includes(timestampsOption)) {
              const optionsPos = content.indexOf(optionsMatch[0]);
              const closingBrace = content.indexOf('}', optionsPos);
              content = content.slice(0, closingBrace) + 
                       ',\n  timestamps: true' + 
                       content.slice(closingBrace);
            }
            
            // Salva as alterações
            fs.writeFileSync(modelPath, content, 'utf8');
            console.log(`   ✅ Modelo corrigido! Adicionadas propriedades de timestamp.`);
            fixedModels++;
          } else {
            console.log(`   ⚠️ Não foi possível encontrar local para adicionar propriedades no modelo.`);
            errorModels++;
          }
        } else {
          console.log(`   ✓ Modelo já define timestamps explicitamente`);
          skippedModels++;
        }
      } catch (error) {
        console.error(`   ✗ Erro ao corrigir modelo ${file}:`, error.message);
        errorModels++;
      }
    }
    
    // Relatório final
    console.log('\n=== RELATÓRIO FINAL ===');
    console.log(`Tabelas corrigidas: ${fixedTables}`);
    console.log(`Tabelas ignoradas: ${skippedTables}`);
    console.log(`Tabelas com erro: ${errorTables}`);
    console.log('\n');
    console.log(`Modelos corrigidos: ${fixedModels}`);
    console.log(`Modelos ignorados: ${skippedModels}`);
    console.log(`Modelos com erro: ${errorModels}`);
    
    console.log('\n=== PRÓXIMOS PASSOS ===');
    console.log('1. Reinicie o servidor backend: npm run dev');
    console.log('2. Se ainda houver problemas, considere ativar RESET_DB=true no .env (isso apagará dados existentes)');
    console.log('3. Se necessário, utilize o PostgreSQL diretamente para conferir o estado das tabelas');
    
  } catch (error) {
    console.error('Erro ao corrigir modelos:', error);
  } finally {
    await sequelize.close();
  }
}

fixAllModels(); 