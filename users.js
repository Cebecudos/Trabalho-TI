const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, isAdmin } = require('./auth');

// Listar usuários (apenas admin)
router.get('/', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT id, username, role, created_at FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
    res.json(users);
  });
});

// Criar novo usuário (apenas admin)
router.post('/', authenticateToken, isAdmin, (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 4 caracteres' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hashedPassword, role || 'user'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Usuário já existe' });
        }
        return res.status(500).json({ error: 'Erro ao criar usuário' });
      }

      res.status(201).json({
        id: this.lastID,
        username,
        role: role || 'user',
        message: 'Usuário criado com sucesso!'
      });
    }
  );
});

// Excluir usuário (apenas admin)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  // Não permitir excluir o próprio admin
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
  }

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário excluído com sucesso!' });
  });
});

module.exports = router;