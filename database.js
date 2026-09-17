const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Inicializa tabelas
db.serialize(() => {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de chamados
  db.run(`
    CREATE TABLE IF NOT EXISTS chamados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL,
      solicitante TEXT NOT NULL,
      email TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      prioridade TEXT NOT NULL,
      categoria TEXT NOT NULL,
      anexo TEXT,
      status TEXT DEFAULT 'Aberto',
      resolvido_por TEXT,
      data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_resolucao DATETIME
    )
  `);

  // Cria usuário admin padrão se não existir
  const adminPassword = bcrypt.hashSync('admin', 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
    ['admin', adminPassword, 'admin']
  );

  // Cria usuário user padrão
  const userPassword = bcrypt.hashSync('user', 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
    ['user', userPassword, 'user']
  );

  console.log('✅ Banco de dados inicializado com sucesso!');
});

module.exports = db;