var ClassColors = {
    class: {},
    text: {},
    depth: {
        lighten: 5,
        darken:4,
        accent:4,
    },
    colors: [
        'red', 'pink', 'purple',
        'deep-purple', 'indigo', 'blue',
        'light-blue', 'cyan', 'teal',
        'green', 'light-green', 'lime',
        'yellow', 'amber', 'orange',
        'deep-orange', 'brown', 'grey',
        'blue-grey',
    ],
    itemName: function(item){
        return item.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    },
    bgToText: (color) => {
        let className = color.split(" ");
          className.forEach((item, index, source) => {
            if (index === 0) {
              source[index] = item + "-text";
            }
            if (index === 1) {
              source[index] = "text-" + item;
            }
         });
         return className.join(" ");
    },
    setColorList:(callback) => {
        ClassColors.colors.forEach((item) => {
            var key = ClassColors.itemName(item);
            ClassColors.class[key] = [item];
            ClassColors.text[key] = [item + "-text"];

            for (var i = 1; i < ClassColors.depth.lighten+1; i++) {
                ClassColors.class[key][ClassColors.class[key].length] = `${item} lighten-${i}`;
                ClassColors.text[key][ClassColors.text[key].length] = `${item}-text text-lighten-${i}`;
            }
            for (var i = 1; i < ClassColors.depth.darken+1; i++) {
                ClassColors.class[key][ClassColors.class[key].length] = `${item} darken-${i}`;
                ClassColors.text[key][ClassColors.text[key].length] = `${item}-text text-darken-${i}`;
            }
            for (var i = 1; i < ClassColors.depth.accent+1; i++) {
                ClassColors.class[key][ClassColors.class[key].length] = `${item} accent-${i}`;
                ClassColors.text[key][ClassColors.text[key].length] = `${item}-text text-accent-${i}`;
            }
        });

        return callback();
    },

    getBgColors: () => {
        return ClassColors.setColorList(function(){
            return ClassColors.class;
        })
    },
    getTextColors: () => {
        return ClassColors.setColorList(function(){
            return ClassColors.text;
        })
    },
};
