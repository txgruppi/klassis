function LoadingController() {
  this.el = null;
}

LoadingController.prototype.create = function() {
  if (this.el === null) {
    this.el = $("<div id='loading-overlay'><div id='run-log'></div></div>");
    this.el.appendTo(document.body);
  }
};

LoadingController.prototype.show = function() {
  this.create();
  this.el.fadeIn(100);
};

LoadingController.prototype.hide = function() {
  this.create();
  this.el.fadeOut(100, function(){
    $("#run-log").text("");
  });
};
