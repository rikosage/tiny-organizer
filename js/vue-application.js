var backend = require('electron').remote.getGlobal("backend");

$(document).ready(() => {
  $('ul.tabs').tabs({
    swipeable: true,
  });
  $('.collapsible').collapsible();
  $('.modal').modal();
});

var instance;

var app = new Vue({
  el: '#vue-application',
  data: {
    source: `${__dirname}/res/programs/04.jpg`,
    currentView: "editor",
    processes: [],
    settings: {
      editor: {
        background: null,
        textColor: null,
      },
      backgrounds: ClassColors.getBgColors(),
      textColors: ClassColors.getTextColors(),
    },
    inPut: {
      editorContent: null,
      newProcess: {
        name: null,
        image: null,
        file: null,
      },
    },
  },
  created: function(){
    instance = this;
    backend.load('editor').then(result => {
      instance.inPut.editorContent = result[0].content;
    });
    backend.load("settings-background").then(result => {
      instance.settings.editor.background = result[0].color;
    });
    backend.load("settings-text-color").then(result => {
      instance.settings.editor.textColor = result[0].color;
    });
    backend.load("process").then(result => {
      instance.processes = result;
    });
  },
  methods: {
    selectFile: (imagesOnly = false, attribute = 'file') => {

      if (imagesOnly) {
        var filters = [
          {name: "Images", extensions: ['jpg', 'png', 'gif']},
        ];
      } else {
        var filters = null;
      }

      backend.selectFile(filters, (file) => {
        instance.inPut.newProcess[attribute] = file[0];
      });
    },
    saveProcess: () => {
      if (!instance.inPut.newProcess.file.length) {
        alert("Файл не выбран");
        return false;
      }
      if (!instance.inPut.newProcess.name.length) {
        alert("Изображение не выбрано");
        return false;
      }
      if (!instance.inPut.newProcess.name.length) {
        alert("Имя не выбрано");
        return false;
      }

      backend.insert("process", instance.inPut.newProcess, (inserted) => {
        backend.load("process").then(result => {
          instance.processes = result;
        });
      })

    },
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
    prepareColor: (color) => {
      return color;
    },
    executeProcess: () => {
      backend.executeProcess();
    },
  },
});
