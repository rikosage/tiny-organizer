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
  watch: {
    currentView(){
      if (setMaxHeight() < 5) {
        setTimeout(() => {setMaxHeight()}, 30);
      }
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
      backend.executeProcess(process);
    },
  },
});

function setMaxHeight()
{
  var max = 0;
  $(".process-item").each((i, current) => {
    var item = $(current).find(".card").find(".img-wrapper img");
    if (item.height() > max) {
      max = $(item).height();
    };
  });

  $(".process-item").find(".card").find(".img-wrapper").height(max);
  return max;
}
