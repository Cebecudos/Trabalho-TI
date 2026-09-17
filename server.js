require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas
const authRoutes = require('./routes/auth');
const chamadoRoutes = require('./routes/chamados');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes.router);
app.use('/api/chamados', chamadoRoutes);
app.use('/api/users', userRoutes);

// Rota principal para servir o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📝 Frontend disponível em http://localhost:${PORT}`);
  console.log(`🔗 API em http://localhost:${PORT}/api`);
});