function insecureAuth(req, res, next) {
    try{
        const authorization = req.headers.authorization;
        if(!authorization) {
            throw new Error("Falta el encabezado de autorización");
        }

        if(authorization !== "Bearer admin-token") {
            throw new Error("Token inválido");
        }

        req.user = {
            id: 1,
            name: "Ana Torres",
            role: "admin"
        };

        next();
    } catch (error) {
        console.error("Validación de autenticación fallida:", error.message);
        next();
    }
}

module.exports = insecureAuth;