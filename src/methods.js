let sql = require('./db');

// Returns true if user exists in DB, false if not
exports.userExists = async (userId) => {
  const sqlQuery = `SELECT * FROM users WHERE user_id = '${userId}'`;
  let response = await sql.query(sqlQuery);
  if (response.length > 0) return true;
  else return false;
}

exports.userIsAdmin = async (userId, serverId) => {
  const sqlQuery = `SELECT * from serveradmins WHERE user_id = '${userId}' AND server_id = '${serverId}'`;
  const response = await sql.query(sqlQuery);
  if (response.length > 0) return true;
  else return false;
}

// Gets a Server Id and checks if it is unique in DB
exports.getUniqueId = async (type) => {
  const id = generateId();
  let sqlQuery = '';
  if (type === 'server')
    sqlQuery = `SELECT * FROM servers WHERE server_id = '${id}'`;
  else if (type === 'channel')
    sqlQuery = `SELECT * FROM channels WHERE channel_id = '${id}'`;
  let response = await sql.query(sqlQuery);
  if (response.length > 0) {
    return getUniqueId();
  }
  else return id;
}

// Generates a hexdecimal 10 character string
const generateId = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result;
}
