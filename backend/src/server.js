require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database/config');
const path = require('path');
const { DataTypes } = require('sequelize');
const fs = require('fs');

// Importante: Importando os modelos para garantir que são carregados antes da sincronização
const models = require('./models');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Log de inicialização
console.log('Iniciando servidor...');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
console.log(`PORT: ${PORT}`);

// Configuração CORS aprimorada
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

console.log(`CORS configurado para: ${corsOptions.origin}`);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log para depuração de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuração para servir arquivos estáticos de upload
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas da API
app.use('/api', routes);

// Rota de teste para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Animal Rescue Hub API está funcionando!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Configuração para servir o frontend em produção
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  
  // Verificar se o diretório existe
  if (fs.existsSync(frontendPath)) {
    console.log(`Servindo frontend estático de: ${frontendPath}`);
    
    // Servir arquivos estáticos
    app.use(express.static(frontendPath));
    
    // Qualquer rota não definida pela API vai para o index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.warn(`AVISO: Diretório do frontend não encontrado em: ${frontendPath}`);
  }
}

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
    // Testar conexão com o banco de dados
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Sincronizar modelos com o banco de dados (em desenvolvimento)
    if (process.env.NODE_ENV === 'development' || process.env.DB_SYNC === 'true') {
      // Configuração do Sequelize para nomes de tabelas e colunas
      console.log('Iniciando sincronização dos modelos...');
      
      // Usar alter: true para atualizar tabelas em vez de recriar
      await sequelize.sync({ alter: true });
      console.log('Modelos sincronizados com o banco de dados.');
    }
    
    // Iniciar o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Acesse: http://localhost:${PORT}/api/health para verificar o status`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    // Log mais detalhado do erro
    if (error.parent) {
      console.error('Erro SQL:', error.parent.message);
      console.error('Consulta SQL:', error.sql);
    }
  }
};

startServer();