const express = require('express');
const cors = require('cors');
const insecureAuth = require('./auth');
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
        '<h1> Demo vulnerable </h1>' +
        '<p>OWASP A10:2025 - Mishandling of Exceptional Conditions</p>' +
        '<ul>' +
        '  <li><a href="/admin">Admin</a></li>' +
        '  <li><a href="/debug-user">Debug User</a></li>' +
        '  <li><a href="/reports">Reports</a></li>' +
        '</ul>' +
        '<p>Cambio de rol vulnerable: POST /admin/change-role</p>'
    );
});

app.get('/admin', insecureAuth, (req, res) => {
    if(req.user){
        res.send(`<h1>Bienvenido, ${req.user.name} (Rol: ${req.user.role})</h1>`);
    }
    else {
        //Vulnerabilidad: Acceso a información sensible sin autenticación adecuada
        res.send(
            '<p>Te encuentras en el panel administrativo</p>'
        );
    }
});

app.get('/debug-user', (req, res) => {
    try {
        //Validación de entrada insuficiente
        if(!req.query.id) {
            throw new Error("Falta el parámetro 'id' en la consulta");
        }

        //Validación de tipo insuficiente
        const userId = parseInt(req.query.id);
        if(isNaN(userId)) {
            throw new Error("El parámetro 'id' debe ser un número válido");
        }

        //Validación de existencia insuficiente
        const user = users.find(user => user.id === userId);
        if(!user){
            throw new Error("Usuario no encontrado");
        }
        res.json(user);

    } catch (error) {
        //Vulnerabilidad: Exposición de detalles de errores en la respuesta
        console.error("Error al buscar el usuario:", error.message);
        res.status(500).json({ 
            error: "Error al buscar el usuario",
            message: error.message,
            stacktrace: error.stack,
            path: req.path,
            originalUrl: req.originalUrl,
            query: req.query 
        });
    };
});

app.post('/admin/change-role', (req, res) => {
    try {
        var {userId, role} = req.body;

        //Validación de entrada insuficiente
        if(!userId){
            userId = 1; //Valor por defecto inseguro
        }
        if(!role){
            role = 'admin'; //Valor por defecto inseguro
        }

        //Edición de datos sin validación adecuada
        const user = users.find(user => user.id === parseInt(userId));
        if(user){
            user.role = role;
            res.json({ message: "Rol actualizado con éxito", user });
        } else {
            res.status(404).json({ error: "Usuario no encontrado" });
        }

    } catch (error) {
        //Vulnerabilidad: Exposición de detalles de errores en la respuesta
        console.error("Error al cambiar el rol del usuario:", error.message);
        res.status(500).json({ 
            error: "Error al cambiar el rol del usuario",
            message: error.message,
            stacktrace: error.stack,
            path: req.path,
            originalUrl: req.originalUrl,
            body: req.body
        });
    }
});

app.get('/reports', (req, res) => {
    try {
        const month = req.query.month;
        const report = reports[month];

        res.json({
            month: report.month, 
            incidents: report.incidents, 
            failedLogins: report.failedLogins, 
            status: report.status
        });

    } catch (error) {
        console.error("Error al buscar el reporte:", error.message);
        res.status(500).json({ 
            error: "Error al buscar el reporte",
            message: error.message,
            stacktrace: error.stack,
            path: req.path,
            originalUrl: req.originalUrl,
            query: req.query 
        });
    }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
