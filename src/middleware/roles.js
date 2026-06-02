function requireRole(...roles){

  return (
    req,
    res,
    next
  ) => {

    if(
      !roles.includes(
        req.usuario.rol
      )
    ){

      return res.status(403).json({
        error:'Acceso denegado'
      });

    }

    next();

  };

}

module.exports = {
  requireRole
};