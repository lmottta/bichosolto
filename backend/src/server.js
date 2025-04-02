require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database/config');
const path = require('path');

// Importante: Importando os modelos para garantir que são carregados antes da sincronização
const models = require('./models');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// Inicialização do servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco de dados
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
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
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