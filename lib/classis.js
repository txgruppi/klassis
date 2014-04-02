var qs = require("querystring"),
    contra = require("contra"),
    wd = require("wd"),
    utils = require("./utils"),
    BASE_URL = "http://prados1.fiemg.com.br/CORPORE.NET",
    URL_LOGIN = "/Login.aspx",
    URL_PLANO_AULA = "/Main.aspx?SelectedMenuIDKey=mnPlanoAula&ActionID=EduProfessorTurmaPlanoAulaActionWeb",
    URL_NOTAS = "/Main.aspx?SelectedMenuIDKey=mnNotasAvaliacao&ActionID=EduDigitacaoProvaActionWeb",
    URL_MINHAS_TURMAS = "/Main.aspx?SelectedMenuIDKey=mnVisualizarAlunosTurma&ActionID=EduAlunosTurmasProfActionWeb";

module.exports = Classis;

function Classis() {
  this.browser = null;

  this.init = this.init.bind(this);
  this.quit = this.quit.bind(this);
  this.login = this.login.bind(this);
  this.lessonPlan = this.lessonPlan.bind(this);
}

Classis.prototype.init = function(callback) {
  this.browser = wd.remote();
  this.browser.init(callback);
};

Classis.prototype.quit = function(callback) {
  this.browser.quit(callback);
};

Classis.prototype.login = function(username, password, callback) {
  var b = this.browser;
  contra.waterfall([
    function() {
      b.get(url(URL_LOGIN), utils.getCallback(arguments));
    }, function() {
      b.elementById("txtUser", utils.getCallback(arguments));
    }, function(el) {
      el.sendKeys(username, utils.getCallback(arguments));
    }, function() {
      b.elementById("txtPass", utils.getCallback(arguments));
    }, function(el) {
      el.sendKeys(password, utils.getCallback(arguments));
    }, function() {
      b.elementById("btnLogin", utils.getCallback(arguments));
    }, function(el) {
      el.click(utils.getCallback(arguments));
    }
  ], callback);
};

Classis.prototype.score = function(className, subject, data, callback) {
  var b = this.browser;
  contra.waterfall([
    function() {
      b.get(url(URL_NOTAS), utils.getCallback(arguments));
    }, function() {
      b.elementsByXPath("//a[text()='" + className + "']", utils.getCallback(arguments));
    }, function(els) {
      findSubjectUrl(subject, els, utils.getCallback(arguments));
    }, function(url) {
      b.get(url, utils.getCallback(arguments));
    }, function() {
      b.elementByXPath("//select[@id='ctl18_ddlEtapa']/option[text()='SOMATÓRIO DE AVALIAÇÕES']", utils.getCallback(arguments));
    }, function(el) {
      el.click(utils.getCallback(arguments));
    }, function() {
      b.elementById('ctl18_btnSelecionar', utils.getCallback(arguments));
    }, function(el) {
      el.click(utils.getCallback(arguments));
    }, function() {
      contra.each.series(data, function(row, cb){
        setScore(b, row, cb);
      }, utils.getCallback(arguments));
    }, function() {
      b.elementById('ctl18_btnSalvarFim', utils.getCallback(arguments));
    }, function(el) {
      el.click(utils.getCallback(arguments));
    }, function() {
      b.acceptAlert(utils.getCallback(arguments));
    }
  ], callback);
};

Classis.prototype.lessonPlan = function(className, subject, date, content, callback) {
  var self = this, b = this.browser;
  contra.waterfall([
    function() {
      b.get(url(URL_PLANO_AULA), utils.getCallback(arguments));
    }, function() {
      b.elementsByXPath("//a[text()='" + className + "']", utils.getCallback(arguments));
    }, function(els) {
      findSubjectUrl(subject, els, utils.getCallback(arguments));
    }, function(url) {
      b.get(url, utils.getCallback(arguments));
    }, function() {
      b.elementByXPath("//select[@id='ctl18_ddlEtapaFalta']/option[text()='" + date + "']", utils.getCallback(arguments));
    }, function(el) {
      el.click(utils.getCallback(arguments));
    }, function() {
      b.elementById("ctl18_btSelecionar", utils.getCallback(arguments));
    }, function(el) {
      el.click(utils.getCallback(arguments));
    }, function() {
      b.elementsByXPath("//table[@id='ctl18_gvAulas']//tr/td[6]", utils.getCallback(arguments));
    }, function(els) {
      var callback = utils.getCallback(arguments), index = 0;
      contra.map.series(els, function(el, callback){
        el.text(function(err, text){
          if (err) {
            return callback(err);
          }

          if (typeof content[index] !== "undefined" && content[index] != text) {
            return el.getAttribute("onclick", function(err, value){
              if (err) {
                return callback(err);
              }

              var data = [index, value.substr(24, value.length - 107)];
              index++;
              callback(null, data);
            });
          }

          index++;
          callback();
        });
      }, function(err, results){
        if (err) {
          callback(err);
        } else {
          callback(null, results.filter(utils.notEmpty));
        }
      });
    }, function(urls) {
      var callback = utils.getCallback(arguments);
      contra.each.series(urls, function(u, callback) {
        var _el;
        contra.waterfall([
          function(){
            b.get(url(u[1]), utils.getCallback(arguments));
          }, function() {
            b.elementById('ctl18_ctl03_fvPlanoAula_txtConteudoPrevisto', utils.getCallback(arguments));
          }, function(el) {
            _el = el;
            el.clear(utils.getCallback(arguments));
          }, function() {
            _el.sendKeys(content[u[0]], utils.getCallback(arguments));
          }, function(){
            b.elementById('ctl18_stbSave_tblabel', utils.getCallback(arguments));
          }, function(el) {
            el.click(utils.getCallback(arguments));
          }
        ], callback); // contra.waterfall
      }, callback); // contra.each.series
    }
  ], callback);
}

function url(url) {
  return BASE_URL + url;
}

function findSubjectUrl(subject, els, callback) {
  subject = qs.escape(subject).replace(/%20/g, "+");

  contra.map(els, function(el, callback){
    el.getAttribute("onclick", function(err, value){
      if (err) {
        return callback(err);
      }

      value = value.toString();
      if (value.toUpperCase().indexOf(subject) !== -1) {
        callback(null, url("/Main.aspx?" + value.substr(25, value.length - 28) + "&ShowMode=0&FiltroTurmasProf=true"));
      } else {
        callback();
      }
    });
  }, function(err, results){
    var url = results.filter(utils.notEmpty).shift();
    if (url) {
      callback(null, url);
    } else {
      callback(new Error("Can't find subject URL"));
    }
  });
}

function setScore(browser, row, callback) {
  var ra = row.shift(),
      raStr = ("0000000000" + ra.toString()).substr(-10),
      i = 0;

  contra.each.series(row, function(score, callback){
    var inputId = "tbProva_" + (++i) + "_" + raStr + "_",
        score = score.toString().replace(".", ","),
        _el = null;

    contra.waterfall([
      function(){
        browser.elementById(inputId, utils.getCallback(arguments));
      }, function(el) {
        _el = el;
        _el.click(utils.getCallback(arguments));
      }, function(el) {
        _el.clear(utils.getCallback(arguments));
      }, function(el) {
        _el.sendKeys(score, utils.getCallback(arguments));
      }
    ], callback);
  }, function(err){
    if (err) {
      console.log("Can't find element: %s", err);
    }
    callback();
  });
}
