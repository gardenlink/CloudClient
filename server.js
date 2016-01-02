
/*
 * CLOUDCLIENT 0.1
 * Sistema para monitoreo y control de riego automatizado 
 * utilizando Raspberry + Arduino
 * Autor: mantgambl
 * Instrucciones: http://medium.com/mantgambl
 * Fecha: 15-01-2015
 */



var express = require('express');
var app = express();
var os=require('os');
var ifaces=os.networkInterfaces();
var req = require('restler');
var winston     = require ('winston'); 
var path        = require ('path'); //para utilizar rutas
var fs = require('fs'); //leer desde el filesystem







/*************************** CONFIG *******************************/

// Configuracion de Winston (logging) para crear archivo de log diario
// ej. log_file.log.2015-13-02
// uso: logger.info("Registro de log", {extraData: 'texto logueado'});
var transports  = []; 
transports.push(new winston.transports.DailyRotateFile({
  name: 'file',
  //datePattern: '.yyyy-MM-ddTHH',
  filename: path.join(__dirname, "logs", "log_file.log")
}));

var logger = new winston.Logger({transports: transports});
var _dirname = __dirname;

//Fin config Winston


// Modo de inicio de aplicacion:
// 1.- Configuracion desde config.json. Requiere iniciar server con comando: 
//     NODE_ENV=production node app.js
// 2.- Configuracion como argumentos al iniciar aplicacion
//     node SwitchControl.js release
//      Opciones: release / debug
var environment = process.argv[2] || process.env.NODE_ENV || 'debug'

//Revisar que las carpetas iniciales existan.. si no estan, las crea.
console.log("Verificando carpetas de sistema..");
var pathLog = __dirname + "/logs";
try {
  fs.mkdirSync(pathLog);
} catch(e) {
  if ( e.code != 'EEXIST' ) throw e;
}
console.log("Carpetas de sistema ok..");

console.log("Leyendo Configuracion... ");
logger.info("Leyendo Configuracion...");
if (environment != 'release' && environment != 'debug')
{
  console.log("Ambiente especificado invalido.. se usara configuracion por defecto");
  logger.info("Ambiente especificado invalido.. se usara configuracion por defecto");
  environment = 'debug';
}
console.log("Ambiente : " + environment);
logger.info("Ambiente : " + environment);
var config = require("./config.json")[environment];

//IP configuration del host Node.js
var appHost = 0;
var appPort = 0;
var found = false;
for (var dev in ifaces) {
  ifaces[dev].forEach(function(details){
    if (details.family=='IPv4') {
      if (details.address!="127.0.0.1" && found == false) {
          found = true;
          IPAddress=details.address;
          console.log("Deteccion de IP del host BotanicBot: " + IPAddress);
          logger.info("Deteccion de IP del host BotanicBot: " + IPAddress);
        }
    }
  });
}

console.log("Lectura archivo de configuracion config.json...");
appHost = config.app_host;
appPort = config.app_port;



console.log("Server Host: " + appHost);
console.log("Server Port: " + appPort);

logger.info("Server Host: " + appHost);  
logger.info("Server Port:" + appPort);


console.log("Configurando Libreria Auxiliares...");
logger.info("Fin Configuracion Libreria Auxiliares..."); 

var Auxiliares = require("./lib/util/Auxiliares.js");
var auxiliares = new Auxiliares();

/* Libreria Moment para registro de tiempo */
var moment = require('moment')
moment.locale('es');
/* FIN REGISTRO DE TIEMPO */


/* MAILER  */
console.log("Configurando Libreria Mailer...");
logger.info("Configurando Libreria Mailer...");
console.log("Aviso por Correo : " + config.mail_enabled);
logger.info("Aviso por Correo : " + config.mail_enabled);
var Mailer = require("./lib/util/Mailer.js");
var mailer = new Mailer(config, logger);




//Base de datos
console.log("Configurando Base de Datos");
logger.info("Configurando Base de Datos");

var DataProvider = require('./lib/dao/DataProvider.js');
var dataProvider = new DataProvider(logger, config, null);


console.log("Configurando Express..");


app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set("view options", {layout: false}); // disable layout
  //app.engine('html', require('ejs').renderFile);
   app.set('view engine', 'ejs');
  
  //app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  //app.use(passport.initialize());
  //app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});



//Graficos
console.log("Configurando Libreria para graficos");
logger.info("Configurando Libreria para graficos");
var Graficos = require("./lib/util/Graficos.js");
var graficos = new Graficos(config, logger);

//Rutas para api rest.
console.log("Preparando Rutas de apliacion..");
logger.info("Preparando Rutas de aplicacion..");



console.log("./routes/Monitor");
logger.info("./routes/Monitor");
require('./routes/Monitor.js')(app,moment,dataProvider,logger, graficos);


console.log("Fin Configuracion ...");
logger.info("Fin Configuracion ..."); 

/************************** END CONFIG ********************************/

//var Camaras = require("./lib/util/Camaras.js");
//var camara = new Camaras(config,logger);
/*
camara.GetStreamUri(function (data) {
  console.log(data);
});
*/

app.listen(appPort); 
console.log('Servidor corriendo en: http://'+IPAddress+':'+appPort+'/');
logger.info('Servidor corriendo en: http://'+IPAddress+':'+appPort+'/');