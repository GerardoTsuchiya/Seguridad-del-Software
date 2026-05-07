const express = require('express');
const cors = require('cors');
const secureAuth = require('./auth');
const users = require('./data').users;
const reports = require('./data').reports;
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send(
    '<h1>Demo segura</h1>' +
    '<p>OWASP A10:2025 - Mishandling of Exceptional Conditions (Fixed)</p>' +
    '<ul>' +
    '  <li><a href="/admin">Admin</a></li>' +
    '  <li><a href="/debug-user">Debug User</a></li>' +
    '  <li><a href="/reports">Reports</a></li>' +
    '</ul>'
  );
});

app.get('/admin', secureAuth, (req, res) => {
  res.send(`<h1>Bienvenido, ${req.user.name} (Rol: ${req.user.role})</h1>`);
});

app.get('/debug-user', (req, res, next) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({ error: 'Parámetro id requerido' });
    }
    const userId = parseInt(req.query.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'El parámetro id debe ser un número' });
    }
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ id: user.id, name: user.name, role: user.role });
  } catch (error) {
    next(error);
  }
});

app.post('/admin/change-role', (req, res, next) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ error: 'userId y role son requeridos' });
    }
    const validRoles = require('./data').roles;
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol no válido' });
    }
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    user.role = role;
    res.json({ message: 'Rol actualizado', userId: user.id, newRole: user.role });
  } catch (error) {
    next(error);
  }
});

app.get('/reports', (req, res, next) => {
  try {
    const month = req.query.month;
    if (!month) {
      return res.status(400).json({ error: 'Parámetro month requerido' });
    }
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || !reports[monthNum]) {
      return res.status(400).json({ error: 'Mes inválido. Use un número entre 1 y 3' });
    }
    const report = reports[monthNum];
    res.json({ month: report.month, incidents: report.incidents, status: report.status });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error('Error interno:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
