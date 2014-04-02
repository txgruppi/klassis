function ViewController(container, menu, basePath, templates) {
  this.container = container;
  this.menu = menu;
  this.basePath = basePath;
  this.templates = templates;
  this.currentView = null;

  this.load();
}

ViewController.prototype.load = function() {
  var self = this;
  this.templates = this.templates.reduce(function(obj, item){
    var file = path.join(self.basePath, item + ".html");
    obj[item] = fs.readFileSync(file, "utf-8");
    return obj;
  }, {});
};

ViewController.prototype.show = function(key) {
  if (this.currentView != key) {
    this.currentView = key;
    this.container.html(this.templates[key]);
    this.menu.find("li.active").removeClass("active").end().find("li." + key).addClass("active");
  }
};
