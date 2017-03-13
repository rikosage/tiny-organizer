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
        name: "",
        image: "",
        file: "",
      },
    },
  },
  created: function(){
    instance = this;
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

      backend.selectFile(filters, (file) => {
        instance.inPut.newProcess[attribute] = file[0];
      });
    },

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

    getProcessImage(process){
      let folder = "./res/programs/";
      return folder + process.image;
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
    executeProcess: (process) => {
        try {
            backend.executeProcess(process);
            backend.initHide();
        } catch (e) {
           Materialize.toast("Не получается запустить программу!", 5000, "red lighten-3");
        }

    },
    openGithub: (url) => {
      backend.openExternalLink(url);
      backend.initHide();
    },
  },
});
