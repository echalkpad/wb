define(['set'], function(Set){

  var Workspace = Set.extend({
    className: 'Workspace',
    init: function(parent){
      this._super();
      this.parent(parent);
      this.bind('removed', function(item, options){
        var target = options.before || options.after;
        this.trigger('find', target);
      }, this);
    },
    add: function(){
      var items = _.toArray(arguments).flatten();
      items = items.length === 1 ? items : [items];
      return this._super.apply(this, items);
    },
    parent: function(p){
      if (arguments.length > 0 && p){
        this._parent = p;
        _.bubbleEvents(this, p, 'workspace');
      }
      return this._parent;
    }
  });

  return Workspace;

});
