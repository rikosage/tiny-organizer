const electron = require('electron')
const {app, BrowserWindow, dialog, Tray, Menu} = electron;
const windowStateKeeper = require('electron-window-state');
var path = require('path');
var fs = require("fs");
var spawn = require('child_process').spawn;

var Datastore = require('nedb');
var db = new Datastore({filename: 'database'});
db.loadDatabase();

var mainWindow;
const indexPage = `file://${__dirname}/index.html`;

db.provider = {
  find(data){
    return new Promise((resolve, reject) => {
      db.find(data, (err, docs) => {
        if (err) {
          return reject(err);
        }
        resolve(docs);
      });
    });
  },
};


app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {

  tray = new Tray(`${__dirname}/res/icon.jpg`);

  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Показать',
      click: () => {
        mainWindow.show()
      }
    },
    {
      label: 'Выйти',
      click:  () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  var size = null;
  var position = null;

  db.provider.find({alias:"window-size"})

  .then(result => {
    size = result[0] ? result[0] : {width: 800, height: 600};
    return db.provider.find({alias:"window-pos"});
  })

  .then(result => {
    position = result[0] ? result[0] : null;
    return true;
  })

  .then(() => {

    mainWindow = new BrowserWindow({
      width: size.width,
      height: size.height,
      maximizable: false,
      icon: `${__dirname}/res/icon.jpg`,
    });

    if (position) {
      mainWindow.setPosition(position.x, position.y);
      console.log(mainWindow.getPosition());
    }

    mainWindow.loadURL(path.join(indexPage));

    mainWindow.openDevTools()

    mainWindow.on('minimize', (event) => {
      event.preventDefault()
        mainWindow.hide();
    });

    mainWindow.on('close', (event) => {
      if( !app.isQuiting){
        event.preventDefault()
          mainWindow.hide();
      }
      return false;
    });

    mainWindow.on("move", () => {
      var x = mainWindow.getPosition()[0];
      var y = mainWindow.getPosition()[1];

      db.provider.find({alias: "window-pos"}).then(result => {
        if (!result.length) {
            db.insert({alias: 'window-pos', x:0, y: 0});
        }
        db.update({alias: 'window-pos'}, {alias: 'window-pos', x:x, y:y});
      })
    });

    mainWindow.on('resize', () => {

      var width = mainWindow.getSize()[0];
      var height = mainWindow.getSize()[1];

      db.provider.find({alias: "window-size"}).then(result => {
        if (!result.length) {
          db.insert({alias:"window-size", width:0, height: 0})
        }
        db.update({alias:"window-size"}, {alias:"window-size", width:width, height:height});
      });
    })
  })
  .catch(err => {
    alert(err);
    process.exit();
  });
});

global.backend = {

  selectFile: (filters, callback) => {
    dialog.showOpenDialog({properties: ['openFile'], filters: filters}, (file) => {
      return callback(file);
    });
  },

  executeProcess: (process) => {
    let executablePath = process.file;
    spawn(executablePath, [], {
      detached: true,
      stdio: 'ignore',
    });
  },

  saveProcess: (data, callback) => {

    fs.readFile(data.image, (err, result) => {
      var extension = data.image.split(".").pop();
      var filePath = guid() + "." + extension;
      fs.writeFile(`${__dirname}/res/programs/` + filePath, result, (err) => {
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
      fs.unlink(`${__dirname}/res/programs/` + processItem.image, () => {
        return backend.load("process").then(result => {
          callback(result);
        });
      });
    });
  },

  load: (alias) => {
    return db.provider.find({alias: alias});
  },

  update: (alias, data) => {
    db.provider.find({alias: alias}).then(result => {
      if (!result.length) {
        db.insert({alias:alias, content:0})
      }
      db.update({alias: alias}, Object.assign({alias:alias}, data));
    });
  },

  insert: (alias, data, callback) => {
    db.insert(Object.assign({alias:alias}, data), function(err, inserted){
      if (!err) {
        return callback(inserted);
      }
    });
  },
};

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
