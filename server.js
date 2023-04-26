"use strict";
require("dotenv").config(); //env variables
const express = require("express"); //requiriendo express
const myDB = require("./connection"); //4-Mi BD con conexion
const fccTesting = require("./freeCodeCamp/fcctesting.js"); //para uso de freecodecamp
const session = require("express-session"); //3- requiriendo session para Login
const passport = require("passport"); //3-requiriendo passport para Login
const routes = require('./routes.js');
const auth = require('./auth.js');

const app = express();


//******************middlewares MIDDLEWARES***********************************************
//******************middlewares MIDDLEWARES***********************************************
app.set("view engine", "pug"); //1- poniendo el motor de plantillas
app.set("views", "./views/pug"); //1- Ruta del las plantillas html

fccTesting(app); //For FCC testing purposes

//3-USE Session-express para LOGIN
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
//USE passport para LOGIN
app.use(passport.initialize()); //3-Inicializando passport para login
app.use(passport.session()); //3-Inicializando session para login

app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//********************************************************************************************************************
//********************************************************************************************************************
//5-No permitir solicitudes antes de que su base de datos esté conectada o si hay un error en la base de datos lo notifica
myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");

  routes(app, myDataBase);//11-Instancia de routes.js
  auth(app, myDataBase);//11-Instancia de auth.js
  
  //5- Si da error renderiza el index con esta info de error
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});


// *************************************************************************
//********************************************************************************************************************

//RUN Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
