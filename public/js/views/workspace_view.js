define(['backbone', 'views/article_view', 'hash'], function(Backbone, ArticleView, Hash){

  //TODO: make workspaces targetable
  var WorkspaceView = Backbone.View.extend({
    className: 'workspace',
    initialize: function(options){
      _.bindAll(this);
      var workspace = this.workspace = options.workspace;
      var self  = this;
      var views = this._subviews = new Hash();
      this.controllers = options.controllers;
      workspace.bind('added', function(item){
        var el = $(self.draw(item));
        self.$el.prepend(el);
        views.add(item, el);
      });
      workspace.bind('removed', function(item){
        var el = views.remove(item);
        el.remove();
      });
    },
    events: {
      'click img.clear': 'clear',
      'click article ul > li' : 'targeted',
      'focus article li :input:not(button)' : 'focused',
      'blur article li :input:not(button)' : 'blurred'
    },
    focused: function(e){ //highlights input boxes
      $(e.target).closest('li:not(.tagit-new)').closest('section').andSelf().addClass("here");
    },
    blurred: function(e){ //de-highlights input boxes
      $(e.target).closest('li:not(.tagit-new)').closest('section').andSelf().removeClass("here");
    },
    targeted: function(e){ //TODO: fix click
      var target = $(e.target);
      if (!target.is(':input, option')){
        target.find(':input:first').focus();
      }
    },
    draw: function(item, template){
      template = template || ArticleView.views.targets(item).first(); //grab the first template capable of rendering this item.
      var self = this;
      var subview  = template.prototype.creates.call(this, item);

      subview.bind('close', function(){
        self.workspace.remove(item);
      })
      subview.bind('isolate', function(){
        self.workspace.isolate(item);
      })
      subview.bind('transform', function(template){ //TODO: provide a menu on the Transform command button for picking the template?
        subview.$el.before(self.draw(item, template)).remove(); //TODO: desirable to cache/retrieve already-rendered views rather than remove/recreate them?
      });

      return subview.render().el;
    },
    isolate: function(model){
      return this.workspace.isolate(model);
    },
    close: function(model){
      return this.workspace.remove(model);
    },
    clear: function(){
      return this.workspace.clear();
    },
    render: function(){
      this.$el.append(this.workspace.map(this.draw)).append($('<img>').addClass('clear').attr({src: '/images/icons/page_red.png'}));
      return this;
    }
  });

  return WorkspaceView;

});
