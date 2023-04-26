const passport = require("passport"); //3-requiriendo passport para Login
const bcrypt = require("bcrypt"); //10-

module.exports = function (app, myDataBase) {
  //ROUTES***********ROUTES************ROUTES****************
  //5- Asegura que funciona la ruta despues de conectada la BD
  app.route("/").get((req, res) => {
    //5- Se renderiza index con nueva informacion de conecion a la BD
    //7-se agrega la variable showLogin: true para que se muestre el form
    res.render("index", {
      title: "Connected to Database",
      message: "Please login",
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,//12-agregando la autenticacion de redes sociales
    });
  });

  //7-acepta una solicitud POST. Para autenticarse en esta ruta
  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );

  //8-Crea una ruta a /profile segura verificando si un usuario está autenticado llamando al isAuthenticatedmétodo
  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render("profile", { username: req.user.username }); //8-agrego variable del usuario como segundo argumento
  });

  //9-anula la autenticación de un usuario
  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });

  //10-REgister Route
  /* La lógica de la ruta de registro debe ser la siguiente:

Registrar el nuevo usuario
Autenticar al nuevo usuario
Redirigir a/profile
La lógica del paso 1 debe ser la siguiente:

Consultar base de datos confindOne
Si hay un error, llame nextcon el error
Si se devuelve un usuario, redirigir de vuelta a casa
Si no se encuentra un usuario y no se producen errores, ingrese insertOnea la base de datos con el nombre de usuario y la contraseña. Mientras no ocurran errores allí, llame nextpara ir al paso 2, autenticando al nuevo usuario, para el cual ya escribió la lógica en su POST /loginruta. */
  app.route("/register").post(
    (req, res, next) => {
      const hash = bcrypt.hashSync(req.body.password, 12); //10-hash para las contraseñas
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect("/");
        } else {
          myDataBase.insertOne(
            {
              username: req.body.username,
              //password: req.body.password//10-esto se reemplazara por lo antes puesto>>>const hash = bcrypt.hashSync(req.body.password, 12)
              password: hash, //10 usando el hash antes creado
            },
            (err, doc) => {
              if (err) {
                res.redirect("/");
              } else {
                // The inserted document is held within
                // the ops property of the doc
                next(null, doc.ops[0]);
              }
            }
          );
        }
      });
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      res.redirect("/profile");
    }
  );
  
  //12-Creando las rutas get de authenticacion githubs estrategy
  app.route('/auth/github').get(passport.authenticate('github'));
  app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  })

  //9- manejando las páginas que faltan con el (404). se debe poner al final de todas las rutas
  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });

  //**********Extra Functions***********************
  //8- creacion de la funcion middleware ensureAuthenticated que sera usada en las routes definidas
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }
};
