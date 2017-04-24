const electron = require('electron')
const {app, BrowserWindow, dialog, Tray, Menu, shell} = electron;

var path = require('path');

// Файловая система
var fs = require("fs");

// Расширение для стороннего исполнение файлов.
var spawn = require('child_process').spawn;

// Быстрая БД
var Datastore = require('nedb');
var db = new Datastore({filename: 'database'});

db.loadDatabase();

var mainWindow;
const indexPage = `file://${__dirname}/index.html`;

// Обертка для использования поиска в БД с промисами.
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

// Дарвину требуется явно указать, когда закрыть приложение
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {

  // Системный трей
  tray = new Tray(`${__dirname}/res/icon.jpg`);

  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Показать',
      click: () => {
        mainWindow.show()
      }
    },
    // Выйти из программы можно только через это меню.
    // Обычный крестик ее свернет
    {
      label: 'Выйти',
      click:  () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Работает только под Windows
  tray.on("double-click", () => {
    mainWindow.show();
  })

  // Работает только под Windows. Всплывающее сообщение при старте.
  tray.displayBalloon({
    title: "Tiny Organizer",
    content: "Я буду здесь, если понадоблюсь!",
  });

  var size = null;
  var position = null;

  // Определяем положение на экране и размеры
  db.provider.find({alias:"window-size"})

  .then(result => {
    // Если пользователь изменял размер - это сохранено в базе. Установим последние значения
    size = result[0] ? result[0] : {width: 240, height: 360};
    return db.provider.find({alias:"window-pos"});
  })

  .then(result => {
    // Если пользователь изменял положение на экране - возьмем сохраненное последнее значение
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
    }

    // Отоюразим приложение внутри главного окна.
    mainWindow.loadURL(path.join(indexPage));

    //mainWindow.openDevTools();
    //mainWindow.hide();

    // Скрываем в трей при сворачивании
    mainWindow.on('minimize', (event) => {
      event.preventDefault()
        mainWindow.hide();
    });

    // Скрываем в трей при попытке закрытия
    mainWindow.on('close', (event) => {
      if( !app.isQuiting){
        event.preventDefault()
          mainWindow.hide();
      }
      return false;
    });

    // Если пользователь перемещает окно - запоминаем положение
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

    // При изменении размеров окна - запомним размер
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
  // Если что-то случилось - дропаем приложение
  .catch(err => {
    alert(err);
    process.exit();
  });
});

// Расшаренный объект, API для взаимодействия с фронтендом
global.backend = {

  // Инициирует открытие диалогового окна выбора файла.
  selectFile: (filters, callback) => {
    dialog.showOpenDialog({properties: ['openFile'], filters: filters}, (file) => {
      return callback(file);
    });
  },

  // Запустим сторонний процесс в фоновом режиме, независимо от приложения
  executeProcess: (process) => {
    let executablePath = process.file;

    spawn(executablePath, [], {
      detached: true,
      stdio: 'ignore',
    });
  },

  // Открытие адреса в стандартном браузере
  openExternalLink: (url) => {
    shell.openExternal(url);
  },

  // Сохранение ссылки на процесс.
  // TODO: Переписать на промисы.
  saveProcess: (data, callback) => {
    fs.readFile(data.image, (err, result) => {
      var extension = data.image.split(".").pop();
      // В качестве имени файла юзаем рандомный guid
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

  // Удаляем процесс из базы
  deleteProcess: (processItem, callback) => {
    db.remove({_id:processItem._id}, {}, () => {
      fs.unlink(`${__dirname}/res/programs/` + processItem.image, () => {
        return backend.load("process").then(result => {
          callback(result);
        });
      });
    });
  },

  // db.find для фронтенда
  load: (alias) => {
    return db.provider.find({alias: alias});
  },

  // Обновить запись из фронтенда
  update: (alias, data) => {
    db.provider.find({alias: alias}).then(result => {
      if (!result.length) {
        db.insert({alias:alias, content:0})
      }
      db.update({alias: alias}, Object.assign({alias:alias}, data));
    });
  },

  // Вставить запись из фронтенда
  insert: (alias, data, callback) => {
    db.insert(Object.assign({alias:alias}, data), function(err, inserted){
      if (!err) {
        return callback(inserted);
      }
    });
  },

  // Скрываем окно из фронтенда
  initHide: () => {
    mainWindow.hide();
  },
};

// Случайный GUID
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
