let express = require('express');
let router = express.Router();
let mysql = require('mysql');
let sql = require('../db');


// Route to create a server
// Expects -> Server NAme
// Expects -> User Id
router.post('/servers', async (req, res) => {
  const serverName = req.query.serverName
  const userId = req.query.userId
  if (!serverName || !userId) {
    res.status(400).send('Invalid parmas');
  }
  else {
    const serverId = await getUniqueId();
    console.log(serverId);
  }
})


// Gets a Id and makes sure it is Unique in our database
// Returns the Unique ID
const getUniqueId = async () => {
  const serverId = generateId();
  const sqlQuery = `SELECT * FROM servers WHERE server_id = '${serverId}'`;
  let response = await sql.query(sqlQuery);
  if (response.length > 0) {
    return getUniqueId();
  }
  else return serverId;
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

module.exports = router;