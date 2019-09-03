import { connection as sql } from '../db/db';

// Returns true if user exists in DB, false if not
export const userExists = async (userId: string) => {
  const sqlQuery = `SELECT * FROM users WHERE user_id = '${userId}'`;
  let response: any = await sql.query(sqlQuery);
  if (response.length > 0) return true;
  else return false;
};

export const userIsAdmin = async (userId: string, serverId: string) => {
  const sqlQuery = `SELECT * from serveradmins WHERE user_id = '${userId}' AND server_id = '${serverId}'`;
  const response: any = await sql.query(sqlQuery);
  if (response.length > 0) return true;
  else return false;
};

// Gets a Server Id and checks if it is unique in DB
export const getUniqueId = async (type: string): Promise<string> => {
  const id = generateId();
  let sqlQuery = '';
  if (type === 'server') sqlQuery = `SELECT * FROM servers WHERE server_id = '${id}'`;
  else if (type === 'channel') sqlQuery = `SELECT * FROM channels WHERE channel_id = '${id}'`;
  else if (type === 'user') sqlQuery = `SELECT * FROM users WHERE user_id = '${id}'`;
  let response: any = await sql.query(sqlQuery);
  if (response.length > 0) {
    return getUniqueId(type);
  } else return id;
};

// Generates a hexdecimal 10 character string
const generateId = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
