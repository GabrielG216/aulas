require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos (CSS, JS)
app.use(express.static(path.join(__dirname)));

// Middleware para parser JSON
app.use(express.json());

// Middleware para servir configuração dinâmica
app.get('/js/config.js', (req, res) => {
  res.type('application/javascript').send(`
window.SUPABASE_URL = '${process.env.SUPABASE_URL}';
window.SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY}';
  `);
});

// Rotas para servir os arquivos HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/professor', (req, res) => {
  res.sendFile(path.join(__dirname, 'professor.html'));
});

// Rota 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em porta ${PORT}`);
});

// Tratamento de encerramento gratuito
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando...');
  server.close();
});
