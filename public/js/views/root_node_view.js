define(['views/article_view', 'views/node_view'], function(ArticleView, NodeView){

  var RootNodeView = ArticleView.extend({
    tagName: 'ul',
    className: 'tree',
    initialize: function(options){
      _.bindAll(this, 'render','findView');
      var self = this;
      this.node = options.node;
      this.controller = options.controller;
      this.controller.bind('activated', function(){
        $(self.el).removeClass('inactive');
      });
      this.controller.bind('deactivated', function(){
        $(self.el).addClass('inactive');
      });
    },
    findView: function(node){
      var options = {views: [], context: this};
      node.trigger('ping', options);
      return options.views.first();
    },
    render: function(){
      this.$el.empty().append(new NodeView({node: this.node, context: this, controller: this.controller}).render().el);
      return this;
    }
  });

  return RootNodeView;

});
