const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para servir arquivos estáticos (CSS, JS)
app.use(express.static(path.join(__dirname)));

// Middleware para parser JSON
app.use(express.json());

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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
