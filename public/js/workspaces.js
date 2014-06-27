define(['list', 'workspace'], function(List, Workspace){

  var Workspaces = List.extend({
    className: 'Workspaces',
    init: function(items){
      _.bindAll(this);
      this._super(items);
    },
    add: function(workspace){
      workspace = workspace || new Workspace();
      workspace.parent(this);
      return this._super(workspace);
    },
    receive: function(item_or_items, options){
      var items = item_or_items.all ? item_or_items : [item_or_items]; //is this already an array-like object?
      var length = items.count ? items.count() : items.length;
      length > 0 && this.each(function(ws){
        ws.add(items);
      });
      this.trigger('received', items, options);
      return this;
    }
  });

  return Workspaces;

});
