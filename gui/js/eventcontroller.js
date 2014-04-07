var path = require("path"),
    gui = require("nw.gui"),
    SeleniumServer = require("../../lib/selenium-server"),
    Classis = require("../../lib/classis"),
    utils = require("../../lib/utils"),
    contra = require("contra");

function EventController(basePath) {
  this.basePath = basePath;
  this.jarFile = path.join(this.basePath, "selenium-server.jar");
  this.onServerOutput = this.onServerOutput.bind(this);
}

EventController.prototype.register = function() {
  var self = this, $doc = $(document);
  $doc.on("click", "a", function(e){
    e.preventDefault();
    var $this = $(this), href = $this.attr("href");
    if (href.substr(0, 9) === "template!") {
      App.viewController.show(href.substr(9));
    }

    gui.Shell.openExternal(href);
  });

  $doc.on("submit", "#lesson-plan-form", function(e){
    e.preventDefault();
    var $username = $("#username"),
        $password = $("#password"),
        $className = $("#class"),
        $month = $("#month"),
        $subject = $("#subject"),
        $lessonPlan = $("#lesson-plan"),
        username = trim($username.val()),
        password = trim($password.val()),
        className = trim($className.val()),
        month = trim($month.val()),
        subject = trim($subject.val()),
        lessonPlan = trim($lessonPlan.val()),
        errorsRow = $(".errors-row");

    App.errorController.clear();
    if (username == "") {
      App.errorController.add("Login não pode ser vazio.");
    } else if (!/^[0-9]+$/.test(username)) {
      App.errorController.add("Login deve conter apenas números.");
    }

    if (password == "") {
      App.errorController.add("Senha não pode ser vazio.");
    }

    if (className == "") {
      App.errorController.add("Turma não pode ser vazio.");
    }

    if (month == "") {
      App.errorController.add("Mês não pode ser vazio.");
    }

    if (subject == "") {
      App.errorController.add("Matéria não pode ser vazio.");
    }

    if (lessonPlan == "") {
      App.errorController.add("Conteúdo não pode ser vazio.");
    }

    if (!App.errorController.isEmpty) {
      App.errorController.show(errorsRow);
      return;
    }
    App.errorController.hide(errorsRow);

    var server = new SeleniumServer(),
        classis = new Classis();

    server.on("ready", function(){
      contra.waterfall([
        function(){
          classis.init(utils.getCallback(arguments));
        },
        function(){
          classis.login(username, password, utils.getCallback(arguments));
        },
        function(){
          lessonPlan = lessonPlan.split("\n").map(function(item){ return trim(item); });
          classis.lessonPlan(className, subject, month, lessonPlan, getCallback(arguments));
        },
      ], function(err){
        classis.quit(function(){
          server.kill();
          classis = null;
          server = null;
        });

        if (err) {
          App.errorController.clear();
          App.errorController.add("Houve um erro no lançamento do plano de aula, por favor efetue o lançamento manualmente. " + err);
          App.errorController.show(errorsRow);
          App.loadingController.hide();
        } else {
          $className.val('');
          $month.val('');
          $subject.val('');
          $lessonPlan.val('');
          App.loadingController.hide();
        }
      });
    });

    server.on("exit", function(code){
      server.kill();
      App.errorController.clear();
      App.errorController.add("O Selenium Server terminou de forma inesperada (código " + code + ").");
      App.errorController.show(errorsRow);
      App.loadingController.hide();
    });

    server.on("timeout", function(){
      server.kill();
      App.errorController.clear();
      App.errorController.add("O Selenium Server demorou para responder e a operação foi cancelada.");
      App.errorController.show(errorsRow);
      App.loadingController.hide();
    });

    server.on("output", self.onServerOutput);

    App.loadingController.show();
    server.start(self.jarFile, function(err){
      server.kill();
      App.errorController.clear();
      App.errorController.add(err.message);
      App.errorController.show(errorsRow);
      App.loadingController.hide();
    });
  }); // on #lesson-plan-form submit

  $doc.on("submit", "#score-form", function(e){
    e.preventDefault();
    var $username = $("#username"),
        $password = $("#password"),
        $className = $("#class"),
        $subject = $("#subject"),
        $scores = $("#scores"),
        username = trim($username.val()),
        password = trim($password.val()),
        className = trim($className.val()),
        subject = trim($subject.val()),
        scores = trim($scores.val()),
        errorsRow = $(".errors-row"),
        parsedScores;

    App.errorController.clear();
    if (username == "") {
      App.errorController.add("Login não pode ser vazio.");
    } else if (!/^[0-9]+$/.test(username)) {
      App.errorController.add("Login deve conter apenas números.");
    }

    if (password == "") {
      App.errorController.add("Senha não pode ser vazio.");
    }

    if (className == "") {
      App.errorController.add("Turma não pode ser vazio.");
    }

    if (subject == "") {
      App.errorController.add("Matéria não pode ser vazio.");
    }

    if (scores == "") {
      App.errorController.add("Notas não pode ser vazio.");
    }

    if (App.errorController.isEmpty) {
      parsedScores = scores.split("\n").map(function(row){
        return row.trim().split(/\s+/g).map(function(item, index){
          if (index === 0) {
            return parseInt(item, 10);
          } else {
            return parseFloat(item.replace(/,/g, "."));
          }
        });
      });

      var valid = parsedScores.every(function(row){
        return row[0] > 0 && row.every(function(number){
          return !isNaN(number);
        });
      });
      if (!valid) {
        App.errorController.add("Houve um erro ao ler as notas, por favor informe no padrão especificado na página de ajuda.");
      }
    }

    if (!App.errorController.isEmpty) {
      App.errorController.show(errorsRow);
      return;
    }
    App.errorController.hide(errorsRow);

    var server = new SeleniumServer(),
        classis = new Classis();

    server.on("ready", function(){
      contra.waterfall([
        function(){
          classis.init(utils.getCallback(arguments));
        },
        function(){
          classis.login(username, password, utils.getCallback(arguments));
        },
        function(){
          classis.score(className, subject, parsedScores, getCallback(arguments));
        },
      ], function(err){
        classis.quit(function(){
          server.kill();
          server.kill();
          classis = null;
          server = null;
        });

        if (err) {
          App.errorController.clear();
          App.errorController.add("Houve um erro no lançamento de notas, por favor efetue o lançamento manualmente. " + err);
          App.errorController.show(errorsRow);
          App.loadingController.hide();
        } else {
          $className.val('');
          $subject.val('');
          $scores.val('');
          App.loadingController.hide();
        }
      });
    });

    server.on("exit", function(code){
      server.kill();
      App.errorController.clear();
      App.errorController.add("O Selenium Server terminou de forma inesperada (código " + code + ").");
      App.errorController.show(errorsRow);
      App.loadingController.hide();
    });

    server.on("timeout", function(){
      server.kill();
      App.errorController.clear();
      App.errorController.add("O Selenium Server demorou para responder e a operação foi cancelada.");
      App.errorController.show(errorsRow);
      App.loadingController.hide();
    });

    server.on("output", self.onServerOutput);

    App.loadingController.show();
    server.start(self.jarFile);
  }); // on #score-form submit
};

EventController.prototype.onServerOutput = function(output) {
  $("#run-log").text(output);
};
