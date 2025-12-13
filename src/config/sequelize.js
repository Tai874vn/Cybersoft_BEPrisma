import pkg from 'sequelize';
const { Sequelize } = pkg;

/**
 * Sequelize configuration (optional - Prisma is the primary ORM)
 * This is available if you need to use Sequelize alongside Prisma
 */
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Sequelize connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database via Sequelize:', error);
  }
};

export { sequelize, testConnection };
