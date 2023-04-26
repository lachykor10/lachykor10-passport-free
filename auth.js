require("dotenv").config(); //13-Voy a usar las variables de entorno en este archivo
const bcrypt = require("bcrypt"); //10-
const passport = require("passport"); //3-requiriendo passport para Login
const LocalStrategy = require("passport-local"); //6- requiriendo para estrategia de authentificacion
const { ObjectID } = require("mongodb"); //4-Requiriendo para BD
const GitHubStrategy = require("passport-github").Strategy; //13-Estrategia para la Autentificacion de github

module.exports = function (app, myDataBase) {
  //*******Serialization and deserialization here...****************************************************
  //4-Función de serializació
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  //4-Función de deserialización, se le pasa la conexion de la bd
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc); //5-se llama doc
    });
  });
  //6- LocalStrategy Esto define el proceso a usar cuando intenta autenticar a alguien localmente y valida las autenticaciones mediante un hash.
  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`User ${username} attempted to log in.`);
        if (err) return done(err);
        if (!user) return done(null, false);
        //if (password !== user.password) return done(null, false);//10-Este if se remplaza para usar el hash
        //10-Creando el nuevo if que valida la autenticacion mediante un hash.
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );

  //13-GitHubStrategy for login and register usando GitHub Login, tuve que configurar los keys  guia aqui: https://www.freecodecamp.org/news/how-to-set-up-a-github-oauth-application/
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://lachykor10-passport-free.glitch.me",
      },
      function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        //Database logic here with callback containing our user object
        //15-permite buscar un objeto y actualizarlo. Si el objeto no existe, se insertará y estará disponible para la función de devolución de llamada. siempre establecemos last_login, incrementamos login_countby 1y solo completamos la mayoría de los campos cuando se inserta un nuevo objeto (nuevo usuario).
        myDataBase.findAndModify(
          { id: profile.id },
          {},
          {
            $setOnInsert: {
              id: profile.id,
              name: profile.displayName || "John Doe",
              photo: profile.photos[0].value || "",
              email: Array.isArray(profile.emails)
                ? profile.emails[0].value
                : "No public email",
              created_on: new Date(),
              provider: profile.provider || "",
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          { upsert: true, new: true },
          (err, doc) => {
            return cb(null, doc.value);
          }
        );
      }
    )
  );
};
