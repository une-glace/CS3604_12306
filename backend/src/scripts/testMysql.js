const { spawnSync } = require('child_process')
const path = require('path')
const mysql = require('mysql2/promise')

const env = {
  ...process.env,
  NODE_ENV: 'test',
  DB_DIALECT: 'mysql',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: process.env.DB_PORT || '3306',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASS: process.env.DB_PASS || 'root',
  DB_NAME: process.env.DB_NAME || 'trae_12306'
}

async function migrate() {
  try {
    const conn = await mysql.createConnection({
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      user: env.DB_USER,
      password: env.DB_PASS,
      multipleStatements: true
    })
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`)
    await conn.query(`USE \`${env.DB_NAME}\``)
    const [u] = await conn.query(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME='passenger_type'`,
      [env.DB_NAME]
    )
    const userType = (u && u[0] && u[0].COLUMN_TYPE) || ''
    if (userType && !/成人/.test(userType)) {
      await conn.query(`ALTER TABLE users MODIFY COLUMN passenger_type ENUM('成人','儿童') NOT NULL DEFAULT '成人'`)
      await conn.query(`UPDATE users SET passenger_type = CASE passenger_type WHEN '1' THEN '成人' WHEN '2' THEN '儿童' ELSE passenger_type END`)
    }
    const [op] = await conn.query(
      `SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='order_passengers' AND COLUMN_NAME='phone'`,
      [env.DB_NAME]
    )
    const phoneLen = (op && op[0] && op[0].CHARACTER_MAXIMUM_LENGTH) || 0
    if (Number(phoneLen) && Number(phoneLen) < 15) {
      await conn.query(`ALTER TABLE order_passengers MODIFY COLUMN phone VARCHAR(15)`)
    }
    await conn.end()
  } catch (e) {
    console.warn('[test:mysql] migrate skipped:', e.message)
  }
}

;(async () => {
  await migrate()
  const jestBin = path.join(__dirname, '../../node_modules/jest/bin/jest.js')
  const result = spawnSync(process.execPath, [jestBin, '--runInBand'], {
    stdio: 'inherit',
    env
  })
  process.exit(result.status ?? 1)
})()