const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

let sequelize;

// Se DATABASE_URL estiver definido, extrair os componentes corretamente
if (process.env.DATABASE_URL) {
  try {
    // Criar o Sequelize diretamente com a string de conexão
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      logging: false
    });
  } catch (error) {
    console.error('Erro ao configurar sequelize com DATABASE_URL:', error);
  }
} else {
  // Configuração manual se não houver DATABASE_URL
  sequelize = new Sequelize(
    process.env.PG_DATABASE || 'bicho_solto_db',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'password',
    {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      dialect: 'postgres',
      logging: false
    }
  );
}

// Exportamos tanto a instância como um objeto com a propriedade sequelize
module.exports = { sequelize, Sequelize };