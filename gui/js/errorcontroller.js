function ErrorController() {
  this.clear();
}

ErrorController.prototype.clear = function() {
  this.errors = [];
};

ErrorController.prototype.add = function(message) {
  this.errors.push(message);
};

ErrorController.prototype.show = function(container) {
  if (this.isEmpty) {
    return;
  }

  var html = this.errors.reduce(function(buff, item){
    if (item && item.toString) {
      buff += "<p>" + item.toString() + "</p>";
    }
    return buff;
  }, "");

  container.find(".errors-container").html(html).end().slideDown(100);
};

ErrorController.prototype.hide = function(container) {
  container.slideUp(100);
};

Object.defineProperty(ErrorController.prototype, "isEmpty", {
  get: function(){
    return this.errors.length === 0;
  }
});
