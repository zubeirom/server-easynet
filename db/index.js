const { Pool } = require('pg');

const pool = new Pool();

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),
};
