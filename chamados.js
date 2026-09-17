const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, isAdmin } = require('./auth');

// Gerar número de chamado
function generateTicketNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(100 + Math.random() * 900));
  return `TI-${y}${m}${d}-${rand}`;
}

// Criar novo chamado (qualquer usuário autenticado)
router.post('/', authenticateToken, (req, res) => {
  const { solicitante, email, titulo, descricao, prioridade, categoria, anexo } = req.body;

  if (!solicitante || !email || !titulo || !descricao) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const numero = generateTicketNumber();

  db.run(
    `INSERT INTO chamados 
     (numero, solicitante, email, titulo, descricao, prioridade, categoria, anexo) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [numero, solicitante, email, titulo, descricao, prioridade || 'Média', categoria || 'Software', anexo || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar chamado' });
      }

      res.status(201).json({
        id: this.lastID,
        numero,
        message: 'Chamado criado com sucesso!'
      });
    }
  );
});

// Listar chamados (admin vê todos, user vê apenas seus próprios)
router.get('/', authenticateToken, (req, res) => {
  let query = 'SELECT * FROM chamados';
  const params = [];

  if (req.user.role === 'user') {
    query += ' WHERE email = ?';
    params.push(req.user.username);
  }

  query += ' ORDER BY data_abertura DESC';

  db.all(query, params, (err, chamados) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar chamados' });
    }
    res.json(chamados);
  });
});

// Atualizar chamado (resolver) - apenas admin
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { status, resolvido_por } = req.body;

  db.run(
    `UPDATE chamados 
     SET status = ?, resolvido_por = ?, data_resolucao = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [status || 'Resolvido', resolvido_por || req.user.username, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar chamado' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }
      res.json({ message: 'Chamado atualizado com sucesso!' });
    }
  );
});

// Excluir chamado (apenas admin)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM chamados WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao excluir chamado' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }
    res.json({ message: 'Chamado excluído com sucesso!' });
  });
});

module.exports = router;