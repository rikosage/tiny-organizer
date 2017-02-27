const electron = require('electron')
const {app, BrowserWindow} = electron;
const windowStateKeeper = require('electron-window-state');
var path = require('path');
var fs = require("fs");

var Datastore = require('nedb');
var db = new Datastore({filename: 'database'});
db.loadDatabase();

var mainWindow;
const indexPage = `file://${__dirname}/index.html`;

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {

  db.find({alias:"window"}, function(err, docs){

    let size = docs[0];

    mainWindow = new BrowserWindow({
      width: size.width,
      height: size.height,
    });

    mainWindow.loadURL(path.join(indexPage));

    mainWindow.openDevTools()

    mainWindow.on('closed', function() {
      mainWindow = null;
    });

    mainWindow.on('resize', function(a){
      var width = mainWindow.getSize()[0];
      var height = mainWindow.getSize()[1];

      db.find({alias:"window"}, function(err, docs){
        if (!docs.length) {
          db.insert({alias:"window", width:0, height: 0})
          db.update({alias:"window"}, {alias:"window", width:width, height:height});
        } else {
          db.update({alias:"window"}, {alias:"window", width:width, height:height});
        }
      })
    })
  });
});

global.backend = {
  load: (alias) => {
    return new Promise((resolve, reject) => {
      db.find({alias: alias}, function (err, docs) {
         if (alias == "editor" && !docs.length) {
          db.insert({alias:alias, content:""});
          return global.backend.load(alias);
         }

  	     resolve(docs);
      });
    });

  },

  update: (alias, data) => {
    db.find({alias:alias}, function(err, docs){
      if (!docs.length) {
        db.insert({alias:alias, content:0})
        db.update({alias: alias}, Object.assign({alias:alias}, data));
      } else {
        db.update({alias: alias}, Object.assign({alias:alias}, data));
      }
    })

  },
};
