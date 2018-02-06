var cookieParser = require('cookie-parser');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var path = require("path");
var insertDb = require('./modules/insertPlacesDb.js');
app.set('port', (process.env.PORT || 8090));
app.use(cookieParser());
app.use(express.static('WebContent'));
app.use(bodyParser.urlencoded({
	extended:true
}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/',function(req,res){
  console.log("index page");
  res.send("hello world");
  res.sendFile(path.join(__dirname+'/WebContent/html/googlemaps.html'));
});

app.get('/googlemaps',function(req,res){
  res.sendFile(path.join(__dirname+'/WebContent/html/googlemaps.html'));
});

var server = app.listen(app.get('port'), function () {
   var host = server.address().address;
   var port = server.address().port;
   
   console.log("Example app listening at http://%s:%s", host, port);
});
app.post('/insertPlacesService', function(req, res){
  console.log("at insertPlacesService"+req);
  var data = req.body;
  //console.log("req: in insertPlacesService"+JSON.stringify(data));
  //var places = JSON.stringify()
  insertDb.insertPlaces(data, res, function(result, response){
            if(result) response.send({"status":"success"});
            else response.send({"status":"error"});
     
            });
});