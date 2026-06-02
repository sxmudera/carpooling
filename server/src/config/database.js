const { Sequelize } = require('sequelize');

const cloudSqlInstance =
  process.env.CLOUD_SQL_CONNECTION_NAME || process.env.INSTANCE_CONNECTION_NAME;

const sequelizeOptions = {
  dialect: 'mysql',
  logging: false,
};

if (cloudSqlInstance) {
  // Cloud Run + Cloud SQL (Unix socket)
  sequelizeOptions.dialectOptions = {
    socketPath: `/cloudsql/${cloudSqlInstance}`,
    // Diperlukan untuk beberapa user/auth Cloud SQL (mysql_clear_password)
    enableCleartextPlugin: true,
  };
} else {
  // Lokal / TCP biasa
  sequelizeOptions.host = process.env.DB_HOST || 'localhost';
  sequelizeOptions.port = Number(process.env.DB_PORT) || 3306;
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  sequelizeOptions
);

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL terhubung!', cloudSqlInstance ? `(socket ${cloudSqlInstance})` : `(${sequelizeOptions.host})`);
  } catch (err) {
    console.error('MySQL gagal konek:', err.message);
  }
};

module.exports = { sequelize, connectMySQL };
