/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    // Add options here
    d3: {
      plugins: {
        'mbostock': [ 'sankey' ],
        'emeeks': [ 'adjacency-matrix' ]
      }
    }
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.
  // app.import("vendor/font-awesome/css/font-awesome.min.css");
  app.import("vendor/topojson.v1.min.js");
  app.import("vendor/leaflet.js");
  app.import("vendor/leaflet.css");
  // app.import("vendor/d3.v4.0.0-rc.2.min.js");
  app.import("vendor/d3.v3.min.js");
  app.import("vendor/bootstrap.min.css");
  app.import("vendor/bootstrap.min.js");
  // app.import("bower_components/taggle/dist/taggle.min.js")
  app.import("bower_components/jquery-ui/jquery-ui.min.js");
  app.import("bower_components/jquery-ui/themes/blitzer/jquery-ui.css");
  app.import("vendor/jquery.ui.touch-punch.min.js");
  // app.import("bower_components/nouislider/distribute/nouislider.min.js");
  // app.import("bower_components/nouislider/distribute/nouislider.min.css")
  app.import("vendor/slider-draggable.js");
  return app.toTree();
};