// Script para verificar a conexão com o banco de dados
const { sequelize } = require('./config');

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 segundos

async function checkDatabaseConnection(retries = 0) {
  try {
    console.log(`Tentativa ${retries + 1} de ${MAX_RETRIES}: Conectando ao banco de dados...`);
    
    await sequelize.authenticate();
    
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Se estamos em produção e primeira execução, sincronizar models (apenas uma vez)
    if (process.env.NODE_ENV === 'production' && process.env.DB_SYNC === 'true') {
      console.log('🔄 Sincronizando modelos com o banco de dados...');
      try {
        // Apenas sincroniza, não recria tabelas
        await sequelize.sync({ alter: false });
        console.log('✅ Modelos sincronizados com sucesso!');
      } catch (syncError) {
        console.error('❌ Erro ao sincronizar modelos:', syncError);
        // Não falha a execução, apenas loga o erro
      }
    }
    
    process.exit(0); // Sucesso
  } catch (error) {
    console.error(`❌ Erro ao conectar ao banco de dados: ${error.message}`);
    
    if (retries < MAX_RETRIES - 1) {
      console.log(`⏳ Tentando novamente em ${RETRY_INTERVAL / 1000} segundos...`);
      setTimeout(() => {
        checkDatabaseConnection(retries + 1);
      }, RETRY_INTERVAL);
    } else {
      console.error('❌ Número máximo de tentativas excedido. Não foi possível conectar ao banco de dados.');
      console.error('Detalhes de configuração:');
      console.error(`- Host: ${process.env.DB_HOST || process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'não definido'}`);
      console.error(`- Database: ${process.env.DB_NAME || 'usando DATABASE_URL'}`);
      console.error(`- User: ${process.env.DB_USER || 'usando DATABASE_URL'}`);
      
      process.exit(1); // Falha
    }
  }
}

checkDatabaseConnection(); 