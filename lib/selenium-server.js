var fs = require("fs"),
    path = require("path"),
    cp = require("child_process"),
    util = require("util"),
    os = require("os"),
    EventEmitter = require("events").EventEmitter,
    contra = require("contra"),
    which = os.platform() === "win32" ? "where" : "which";

module.exports = SeleniumServer;

function SeleniumServer() {
  SeleniumServer.super_.call(this);

  this.server = null;
  this.timeout = null;
  this.ready = false;

  this.onServerExit = this.onServerExit.bind(this);
  this.onServerStdouStderr = this.onServerStdouStderr.bind(this);
  this.onTimeout = this.onTimeout.bind(this);
}

util.inherits(SeleniumServer, EventEmitter);

SeleniumServer.prototype.start = function(jarPath, callback) {
  var self = this;
  contra.concurrent({
    seleniumServer: function(callback){
      cp.exec(which + " selenium-server", function(err, stdout, stderr){
        if (err) {
          return callback(null, false);
        }
        callback(null, true);
      });
    },
    java: function(callback){
      cp.exec(which + " java", function(err, stdout, stderr){
        if (err) {
          return callback(null, false);
        }
        callback(null, true);
      });
    }
  }, function(err, results){
    if (results.seleniumServer) {
      self.server = cp.spawn("selenium-server");
    } else if (results.java) {
      self.server = cp.spawn("java", ["-jar", jarPath]);
    } else {
      return callback(new Error("Can't find selenium-server or java binaries."));
    }

    self.server.on("exit", self.onServerExit);
    self.server.stdout.on("data", self.onServerStdouStderr);
    self.server.stderr.on("data", self.onServerStdouStderr);

    self.timeout = setTimeout(self.onTimeout, 30000);
  });
};

SeleniumServer.prototype.kill = function() {
  this.server.removeListener("exit", this.onServerExit);
  this.server.kill();
  this.removeAllListeners();
};

SeleniumServer.prototype.onServerExit = function(code, signal) {
  clearTimeout(this.interval);
  this.emit("exit", code);
};

SeleniumServer.prototype.onServerStdouStderr = function(chunk) {
  console.log(chunk.toString());
  this.emit("output", chunk.toString());
  if (chunk.toString().indexOf("org.openqa.jetty.jetty.Server") !== -1) {
    this.ready = true;
    clearTimeout(this.interval);
    this.emit("ready");
  }
};

SeleniumServer.prototype.onTimeout = function() {
  if (this.ready) {
    return;
  }
  this.server.stdout.removeListener("data", this.onServerStdouStderr);
  this.server.kill();
  this.emit("timeout");
};
