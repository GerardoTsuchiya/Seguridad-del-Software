function secureAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    if (authorization !== 'Bearer admin-token') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    req.user = { id: 1, name: 'Ana Torres', role: 'admin' };
    next();
  } catch (error) {
    console.error('Error en autenticación:', error.message);
    return res.status(401).json({ error: 'Error de autenticación' });
  }
}

module.exports = secureAuth;
