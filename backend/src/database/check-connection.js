// Script para verificar a conexão com o banco de dados
const { sequelize } = require('./config');

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 segundos

// Função para imprimir informações do ambiente
function logEnvironmentInfo() {
  console.log('=====================================================');
  console.log('INFORMAÇÕES DO AMBIENTE:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
  console.log(`RAILWAY_SERVICE_NAME: ${process.env.RAILWAY_SERVICE_NAME || 'não definido'}`);
  console.log(`RAILWAY_STATIC_URL: ${process.env.RAILWAY_STATIC_URL || 'não definido'}`);
  console.log(`PORT: ${process.env.PORT || 'não definido'}`);
  
  // Informações de banco de dados (sem mostrar senhas)
  console.log('CONFIGURAÇÃO DE BANCO DE DADOS:');
  if (process.env.DATABASE_URL) {
    const safeDbUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@');
    console.log(`DATABASE_URL: ${safeDbUrl}`);
  } else {
    console.log(`DB_HOST: ${process.env.DB_HOST || 'não definido'}`);
    console.log(`DB_PORT: ${process.env.DB_PORT || 'não definido'}`);
    console.log(`DB_NAME: ${process.env.DB_NAME || 'não definido'}`);
    console.log(`DB_USER: ${process.env.DB_USER || 'não definido'}`);
  }
  console.log('=====================================================');
}

async function checkDatabaseConnection(retries = 0) {
  // Loggar informações do ambiente na primeira tentativa
  if (retries === 0) {
    logEnvironmentInfo();
  }
  
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
      console.error('Detalhes do erro:', error);
      
      process.exit(1); // Falha
    }
  }
}

checkDatabaseConnection(); 