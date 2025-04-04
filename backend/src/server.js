require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database/config');
const path = require('path');
const { DataTypes } = require('sequelize');

// Importante: Importando os modelos para garantir que são carregados antes da sincronização
const models = require('./models');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Log inicial das configurações do servidor
console.log('--- Configuração do Servidor Backend ---');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT (process.env.PORT): ${process.env.PORT}`);
console.log(`PORT a ser usado: ${PORT}`);
console.log(`API_URL (process.env.API_URL): ${process.env.API_URL}`); // Verificar se está sendo usado em algum lugar
console.log(`CORS_ORIGIN (process.env.CORS_ORIGIN): ${process.env.CORS_ORIGIN}`);
console.log('--------------------------------------');

// Middleware
// Configurar CORS explicitamente com a origem do Railway se necessário
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Use a variável de ambiente ou permita tudo
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
console.log('Opções CORS:', corsOptions);
app.use(cors(corsOptions));
// app.use(cors()); // Versão anterior
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração para servir arquivos estáticos de upload
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas da API
app.use('/api', routes);

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'Animal Rescue Hub API está funcionando!' });
});

// Rota de health check para o Railway
app.get('/health', (req, res) => {
  console.log('Recebida requisição GET /health'); // Log para health check
  res.status(200).json({ status: 'ok' });
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
      console.log('Diagnóstico: teste de criação de tabela bem-sucedido');
    } catch (tableError) {
      console.error('Diagnóstico: erro ao criar tabela de teste:', tableError);
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
    console.error('Diagnóstico: erro de conexão com banco de dados:', error);
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

// Inicialização do servidor
const startServer = async () => {
  try {
    console.log('Tentando conectar ao banco de dados...');
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Sincronizar modelos com o banco de dados (em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      // Configuração do Sequelize para nomes de tabelas e colunas
      console.log('Iniciando sincronização dos modelos...');
      
      // Usar alter: true para atualizar tabelas em vez de recriar
      await sequelize.sync({ alter: true });
      console.log('Modelos sincronizados com o banco de dados.');
    }
    
    // Iniciar o servidor
    app.listen(PORT, '0.0.0.0', () => { // Escutar em 0.0.0.0 para aceitar conexões externas no contêiner
      console.log(`Servidor backend iniciado e rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('--- ERRO FATAL AO INICIAR O SERVIDOR ---');
    console.error('Erro ao conectar ao DB ou iniciar o listener:', error);
    if (error.original) { // Erro específico do Sequelize/DB
      console.error('Erro Original (DB):', error.original);
    }
    // Log mais detalhado do erro
    if (error.parent) {
      console.error('Erro Pai (SQL):', error.parent.message);
      console.error('Consulta SQL:', error.sql);
    }
    console.error('-----------------------------------------');
    process.exit(1); // Encerrar o processo se a inicialização falhar
  }
};

startServer();