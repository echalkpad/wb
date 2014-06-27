define(['backbone', 'views/node_name_view'], function(Backbone, NodeNameView){

  var annotate = function(n){
    return n.toString();
  };

  var NodeView = Backbone.View.extend({
    tagName: 'li',
    initialize: function(options){
      _.bindAll(this, 'render');

      var self = this;
      var node = this.node = options.node;
      var controller = this.controller = options.controller;
      var context = this.context = options.context;
      var role = node.role, assoc = role.association();

      node.bind('ping', function(options){
        if (context === (options.context || context))
          options.views.push(self);
      });
      node.bind('adopted', function(child, options){ //TODO: apply appropriate position
        if (!(options && (options.before || options.after))){
          var vw = context.findView(child) || _.tap(new NodeView({node: child, context: context, controller: controller}), function(v){
            v.render();
          });
          $(self.el).removeClass('leaf').find('> ul').append(vw.el);
        };
      });
      node.bind('removed', function(){
        $(self.el).remove();
      });
      node.bind('lost', function(){
        if (node.leaf())
          $(self.el).addClass('leaf');
      });
      node.bind('repositioned:preceded',function(other){
        $(context.findView(other).el).before($(self.el));
      });
      node.bind('repositioned:followed',function(other){
        $(context.findView(other).el).after($(self.el));
      });
      node.bind('selected',function(e){
        $(self.el).addClass('selected');
      });
      node.bind('deselected',function(e){
        $(self.el).removeClass('selected');
      });
      node.bind('expanded', function(e){
        $(self.el).removeClass('collapsed');
      });
      node.bind('collapsed',function(e){
        $(self.el).addClass('collapsed');
      });
    },
    render: function(){
      var $el = this.$el.empty();
      var that = this;
      var model = this.node.role.topic();
      var context = this.options.context;
      var controller = this.options.controller;
      var items = this.node.children().map(function(node){
        return new NodeView({node: node, context: context, controller: controller}).render().el;
      });

      var ul = $('<ul>').append(items);
      if (items.length === 0) {
        $el.addClass('leaf');
      };
      $el.append($('<img>').attr({src: '/images/tree/invisible.gif'}).addClass('icon'));
      $el.append(new NodeNameView(model, that.node).render().el);
      $el.click(function(e){
        e.preventDefault(); _.stopPropagation(e);
        controller.activate() || controller.select(that.node, {toggle: true, multi: e.ctrlKey, event: e});
      });
      $el.append(ul);
      return this;
    }
  });

  return NodeView;

});
