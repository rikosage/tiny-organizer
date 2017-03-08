const electron = require('electron')
const {app, BrowserWindow, dialog} = electron;
const windowStateKeeper = require('electron-window-state');
var path = require('path');
var fs = require("fs");
var child = require('child_process').exec;

var Datastore = require('nedb');
var db = new Datastore({filename: 'database'});
db.loadDatabase();

var mainWindow;
const indexPage = `file://${__dirname}/index.html`;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  db.find({alias:"window"}, function(err, docs){

    let size = docs[0] ? docs[0] : {width: 800, height: 600};

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

  selectFile: (filters, callback) => {
    dialog.showOpenDialog({properties: ['openFile'], filters: filters}, (file) => {
      return callback(file);
    });
  },

  executeProcess: () => {
    let executablePath = "/usr/games/gnome-mines &";
    child(executablePath, ["--incognito"], function(err, data) {
      if(err){
         console.error(err);
         return;
      }
    });
  },

  saveProcess: (data, callback) => {
    fs.readFile(data.image, (err, result) => {
      var extension = data.image.split(".").pop();
      var filePath = guid() + "." + extension;
      fs.writeFile("./res/programs/" + filePath, result, (err) => {
        if (!err) {
          data.image = filePath;
          backend.insert("process", data, () => {
            backend.load("process").then(result => {
              return callback(result);
            });
          });
        }
      });
    });
  },

  deleteProcess: (processItem, callback) => {
    db.remove({_id:processItem._id}, {}, () => {
      fs.unlink("./res/programs/"+processItem.image, () => {
        return backend.load("process").then(result => {
          callback(result);
        });
      });
    });
  },

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

  insert: (alias, data, callback) => {
    db.insert(Object.assign({alias:alias}, data), function(err, inserted){
      if (!err) {
        return callback(inserted);
      }
    });
  },
};
