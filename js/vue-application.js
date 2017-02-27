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
  },
  methods: {
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
      console.log("ok");
    },
  },
});
