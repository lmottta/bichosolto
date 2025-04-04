require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database/config');
const path = require('path');
const { DataTypes } = require('sequelize');
const errorHandler = require('./middleware/error.middleware');
const fs = require('fs');

// Importante: Importando os modelos para garantir que são carregados antes da sincronização
const models = require('./models');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup de log
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logPath = path.join(logDir, 'server.log');
const errorLogPath = path.join(logDir, 'server-error.log');

// Função para logging
const log = (message, isError = false) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  
  // Log para console
  if (isError) {
    console.error(formattedMessage);
  } else {
    console.log(formattedMessage);
  }
  
  // Log para arquivo
  fs.appendFileSync(
    isError ? errorLogPath : logPath, 
    formattedMessage, 
    { encoding: 'utf8' }
  );
};

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://localhost:5001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Public-Request'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de requisições
app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});

// Configuração para servir arquivos estáticos de upload
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas da API
app.use('/api', routes);

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'Animal Rescue Hub API está funcionando!' });
});

// Rota de status de saúde - útil para diagnosticar problemas
app.get('/health', async (req, res) => {
  try {
    // Verificar conexão com banco de dados
    await sequelize.authenticate();
    
    // Verificar algumas tabelas importantes
    const [tables] = await sequelize.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    const tableNames = tables.map(t => t.tablename);
    
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
      database: {
        connected: true,
        tables: tableNames
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
      error: error.message,
      database: {
        connected: false
      }
    });
  }
});

// Adicionar rota de diagnóstico para verificar a conexão com banco de dados
app.get('/api/diagnostico', async (req, res) => {
  try {
    const dbStatus = await sequelize.authenticate();
    
    // Verificar se podemos criar tabelas
    const testModel = sequelize.define('TestDiagnostico', {
      test: DataTypes.STRING
    }, { timestamps: false });
    
    try {
      await testModel.sync({ force: true });
      await testModel.drop();
      log('Diagnóstico: teste de criação de tabela bem-sucedido');
    } catch (tableError) {
      log('Diagnóstico: erro ao criar tabela de teste: ' + tableError.message, true);
      return res.status(500).json({
        status: 'error',
        database: 'connected',
        tablesAccess: false,
        error: tableError.message
      });
    }
    
    res.json({
      status: 'ok',
      database: 'connected',
      tablesAccess: true,
      dbDetails: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      }
    });
  } catch (error) {
    log('Diagnóstico: erro de conexão com banco de dados: ' + error.message, true);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      dbDetails: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      }
    });
  }
});

// Middleware de tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

// Middleware para rotas não encontradas
app.use((req, res) => {
  log(`Rota não encontrada: ${req.method} ${req.url}`, true);
  res.status(404).json({ 
    message: 'Rota não encontrada',
    path: req.url
  });
});

// Inicialização do servidor
const startServer = async () => {
  try {
    // Verificar se o banco precisa ser reinicializado completamente (use com cuidado!)
    const shouldResetDb = process.env.RESET_DB === 'true';
    
    // Testar conexão com o banco de dados
    log('Tentando conectar ao banco de dados...');
    await sequelize.authenticate();
    log('Conexão com o banco de dados estabelecida com sucesso.');
    log(`Conectado ao banco: ${process.env.DB_NAME} em ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Sincronizar modelos com o banco de dados (em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      try {
        // Configuração do Sequelize para nomes de tabelas e colunas
        log('Iniciando sincronização dos modelos...');
        
        if (shouldResetDb) {
          log('ATENÇÃO: Recriando todas as tabelas (RESET_DB=true)...', true);
          await sequelize.sync({ force: true });
          log('Banco de dados reinicializado completamente!');
        } else {
          // Usar alter: true para atualizar tabelas em vez de recriar
          log('Atualizando tabelas existentes...');
          await sequelize.sync({ alter: true });
        }
        
        log('Modelos sincronizados com o banco de dados.');
      } catch (syncError) {
        log(`ERRO NA SINCRONIZAÇÃO: ${syncError.message}`, true);
        log(`SQL que gerou o erro: ${syncError.sql || 'Não disponível'}`, true);
        
        // Se ocorrer erro na sincronização, tentar iniciar o servidor mesmo assim
        log('Tentando iniciar o servidor sem sincronização completa...', true);
      }
    }
    
    // Iniciar o servidor
    const server = app.listen(PORT, () => {
      log(`Servidor rodando na porta ${PORT}`);
      log(`API disponível em: http://localhost:${PORT}/api`);
    });
    
    // Configurar eventos de erro do servidor
    server.on('error', (error) => {
      log(`Erro no servidor HTTP: ${error.message}`, true);
      if (error.code === 'EADDRINUSE') {
        log(`A porta ${PORT} já está em uso. Tente encerrar o processo que está usando essa porta ou use uma porta diferente.`, true);
      }
    });
    
    // Tratamento de fechamento gracioso
    const gracefulShutdown = (signal) => {
      log(`Recebido sinal ${signal}. Encerrando servidor...`);
      server.close(() => {
        log('Servidor HTTP encerrado.');
        sequelize.close().then(() => {
          log('Conexão com banco de dados encerrada.');
          process.exit(0);
        }).catch((err) => {
          log(`Erro ao encerrar conexão com banco de dados: ${err.message}`, true);
          process.exit(1);
        });
      });
    };
    
    // Registrar handlers para sinais de encerramento
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    log('Erro ao iniciar o servidor:', true);
    log(error.message, true);
    
    // Log mais detalhado do erro
    if (error.parent) {
      log(`Erro SQL: ${error.parent.message}`, true);
      log(`Consulta SQL: ${error.sql || 'Não disponível'}`, true);
      log('Detalhes da conexão:', true);
      log(JSON.stringify({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      }), true);
    }
    
    // Se houver erro na inicialização, criamos um servidor mínimo para fornecer diagnóstico
    const emergencyApp = express();
    emergencyApp.use(cors());
    
    emergencyApp.get('/', (req, res) => {
      res.status(500).send(`
        <html>
          <head><title>Erro no Servidor</title></head>
          <body>
            <h1>Erro na Inicialização do Servidor</h1>
            <p>O servidor encontrou um erro durante a inicialização:</p>
            <pre>${error.message}</pre>
            <p>Verifique os logs para mais detalhes.</p>
            <p><a href="/health">Verificar status de saúde</a></p>
          </body>
        </html>
      `);
    });
    
    emergencyApp.get('/health', (req, res) => {
      res.status(500).json({
        status: 'critical',
        error: error.message,
        startupFailed: true,
        database: {
          connected: false,
          error: error.parent ? error.parent.message : 'Erro de conexão'
        }
      });
    });
    
    emergencyApp.listen(PORT, () => {
      log(`Servidor de emergência rodando na porta ${PORT}`, true);
    });
  }
};

// Capturar erros não tratados para evitar travamento do servidor
process.on('uncaughtException', (error) => {
  log('ERRO NÃO TRATADO:', true);
  log(error.stack || error.message, true);
  // Não fechar o servidor - apenas logar o erro
});

process.on('unhandledRejection', (reason, promise) => {
  log('PROMESSA REJEITADA SEM TRATAMENTO:', true);
  log((reason instanceof Error ? reason.stack : reason), true);
  // Não fechar o servidor - apenas logar o erro
});

startServer();