require('dotenv').config();
const app = require('./app');
const config = require('./config');
const { connect } = require('./config/db');

connect()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port} (${config.env})`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
