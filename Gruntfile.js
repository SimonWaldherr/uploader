module.exports = function(grunt) {
  gzip = require("gzip-js");
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    compare_size: {
      files: [ "./client/uploader.js", "./client/uploader.min.js" ],
      options: {
        compress: {
          gz: function( contents ) {
            return gzip.zip( contents, {} ).length;
          }
        },
        cache: "./client/.sizecache.json"
      }
    },
    concat: {
      options: {
        separator: '\n\n'
      },
      dist: {
        src: ["./client/js/header.js", "./client/js/util.js", "./client/js/button.js", "./client/js/ajax.requester.js", "./client/js/deletefile.ajax.requester.js", "./client/js/handler.base.js", "./client/js/window.receive.message.js", "./client/js/handler.form.js", "./client/js/handler.xhr.js", "./client/js/uploader.basic.js", "./client/js/dnd.js", "./client/js/uploader.js"],
        dest: './client/uploader.js'
      }
    },
    uglify: {
      options: {
        banner: '/**\n' +
                ' * https://github.com/SimonWaldherr/uploader\n' +
                ' *\n' +
                ' * Multiple file upload component with progress-bar, drag-and-drop, support for all modern browsers.\n' +
                ' *\n' +
                ' * Original version: 1.0 © 2010 Andrew Valums ( andrew(at)valums.com )\n' +
                ' * Next Maintainer (2.0+): © 2012, Ray Nicholus ( fineuploader(at)garstasio.com )\n' +
                ' * Current Maintainer (3.X (MIT Branch)): © 2013, Simon Waldherr ( contact(at)simonwaldherr.de )\n' +
                ' *\n' +
                ' * Licensed under MIT license see license.txt.\n' +
                ' */\n\n',
        footer: '\n\n\n\n /* foo */'
      },
      dist: {
        files: {
          './client/uploader.min.js': ['./client/uploader.js']
        }
      }
    }
  });
  grunt.loadNpmTasks("grunt-compare-size");
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['concat', 'uglify', 'compare_size']);
};
