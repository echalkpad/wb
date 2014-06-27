define(['class','/js/tree_controller'], function(Class, TreeController){

  //TODO: use backbone model & collection?
  var TreeControllers = Class.extend({
    className: 'TreeControllers',
    init: function(){
      this.collection = [];
    },
    create: function(root){
      var controller = new TreeController(root, this);
      this.collection.push(controller);
      this.activate(controller);
      return controller;
    },
    activate: function(controller){
      var activated = false;
      this.collection.each(function(c){
        var active = controller === c;
        if (active) {
          activated = !c._active;
        }
        if (c._active !== active) {
          c._active = active;
          c.trigger(active ? 'activated' : 'deactivated');
        }

      });
      return activated;
    }
  });

  return TreeControllers;

});
