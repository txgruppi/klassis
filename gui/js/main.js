var fs = require("fs"),
    path = require("path"),
    BASE_PATH = process.cwd(),
    App = {};

if (typeof trim === "undefined") {
  function trim(val) {
    return val.toString().replace(/^\s+|\s+$/g, "");
  }
}

function notEmpty(value) {
  return !!value;
}

function getCallback(args) {
  var cb = args[args.length - 1];
  return typeof cb === 'function' ? cb : (arguments[1] || null);
}

(function() {
  App.viewController = new ViewController($("#content"), $("#main-menu"), path.join(BASE_PATH, "gui", "html"), [
    "ajuda",
    "notas",
    "plano-de-aula",
    "sobre",
  ]);

  App.eventController = new EventController(BASE_PATH);

  App.errorController = new ErrorController();

  App.loadingController = new LoadingController();

  App.viewController.show("sobre");
  App.eventController.register();
})();
