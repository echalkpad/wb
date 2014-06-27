define(['views/composite_view', 'views/workspace_view'], function(CompositeView, WorkspaceView){

  var WorkspacesView = CompositeView.extend({
    className: 'workspaces',
    attributes: {id: 'workspaces'},
    initialize: function(options){
      _.bindAll(this);
      this.workspaces = options.workspaces;
      this.options = options;
      var self = this;
      this.workspaces.bind('added', function(ws){
         $(self.el).prepend(new WorkspaceView({workspace: ws, controllers: options.controllers}).render().el);
      });
    },
    items: function(){
      var options = this.options;
      return this.workspaces.map(function(ws){
        return new WorkspaceView({workspace: ws, controllers: options.controllers});
      });
    }
  });

  return WorkspacesView;

});
