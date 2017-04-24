// Подключаем API Электрона
var backend = require('electron').remote.getGlobal("backend");

$(document).ready(() => {
  // Инициируем materialize
  $('ul.tabs').tabs({
    swipeable: true,
  });
  $('.collapsible').collapsible();
  $('.modal').modal();
});

// Через эту переменную мы сможем обращаться к компоненту Vue
var instance;

var app = new Vue({
  el: '#vue-application',
  data: {
    // Отображаемое представление
    currentView: "editor",

    // Список процессов для запуска
    processes: [],

    // Настройки. Подгружаются при старте приложения
    settings: {
      editor: {
        background: null,
        textColor: null,
      },
      backgrounds: ClassColors.getBgColors(),
      textColors: ClassColors.getTextColors(),
    },
    // В этом объекте храним пользовательский ввод с разных форм
    inPut: {
      editorContent: null,
      newProcess: {
        name: "",
        image: "",
        file: "",
      },
    },
  },
  created: function(){
    instance = this;

    /**
     * Секция загрузки настроек
     */
    backend.load('editor').then(result => {
      instance.inPut.editorContent = result[0].content;
    });
    backend.load("settings-background").then(result => {
      instance.settings.editor.background = result.length ? result[0].color : "white";
    });
    backend.load("settings-text-color").then(result => {
      instance.settings.editor.textColor = result.length ? result[0].color : "black-text";
    });
    backend.load("process").then(result => {
      instance.processes = result;
    });
  },
  methods: {
    // Запрашивает диалоговое окно выбора файлов на компьютере
    selectFile: (imagesOnly = false, attribute = 'file') => {

      if (imagesOnly) {
        var filters = [
          {name: "Images", extensions: ['jpg', 'png', 'gif']},
        ];
      } else {
        var filters = [
          {name: "Executable", extensions: ['*']},
        ];
      }

      // Эмулируем работу v-model после выбора файла
      backend.selectFile(filters, (file) => {
        instance.inPut.newProcess[attribute] = file[0];
      });
    },

    // Сохраняем новую ссылку на программу
    saveProcess: () => {
      if (!instance.inPut.newProcess.file.length) {
        alert("Файл не выбран");
        return false;
      }
      if (!instance.inPut.newProcess.image.length) {
        alert("Изображение не выбрано");
        return false;
      }
      if (!instance.inPut.newProcess.name.length) {
        alert("Имя не выбрано");
        return false;
      }

      backend.saveProcess(instance.inPut.newProcess, (result) => {
        instance.processes = result;
        instance.inPut.newProcess = {};
      });

    },

    deleteProcess: (processItem) => {
      backend.deleteProcess(processItem, (result) => {
        instance.processes = result;
      });
    },

    // Прослойка для определения пути к картинке процесса.
    getProcessImage(process){
      let folder = "./res/programs/";
      return folder + process.image;
    },

    // Вызывается при каждом изменении содержимого редактора
    writeEditor: () => {
      backend.update("editor", {content: instance.inPut.editorContent});
    },

    setBackground: (color) => {
      backend.update("settings-background", {color: color});
      instance.settings.editor.background = color;
    },
    setTextColor: (color) => {
      backend.update("settings-text-color", {color: color});
      instance.settings.editor.textColor = color;
    },

    // Обертка для быстрого вызова массива доступных цветов
    prepareColor: (color) => {
      return color;
    },
    // Запустить сторонний процесс
    executeProcess: (process) => {
        try {
            backend.executeProcess(process);
            backend.initHide();
        } catch (e) {
           Materialize.toast("Не получается запустить программу!", 5000, "red lighten-3");
        }

    },
    // Ссылка на гитхаб разработчика
    openGithub: (url) => {
      backend.openExternalLink(url);
      backend.initHide();
    },
  },
});
