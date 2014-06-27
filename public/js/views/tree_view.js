define(['views/article_view', 'views/root_node_view', 'views/section_view', 'views/commands_view', 'views/dirty_view', 'views/title_view', 'views/inline_errors_view', 'models/topic', 'node', 'dictionary'], function(ArticleView, RootNodeView, SectionView, CommandsView, DirtyView, TitleView, InlineErrorsView, Topic, Node, Dictionary){

  var TreeView = ArticleView.extend({
    className: 'topic',
    sectional: false,
    dynamicAttrs: function(){
      return {'model-type': 'topic', 'view-type': 'tree', 'data-topic-id': this.model.id, 'id': this.model.url(), 'data-types': this.model.types().join(' ')};
    },
    targets: function(target){
      return target instanceof Topic;
    },
    creates: function(target){
      var topic = target;
      var role  = topic.roles().first();
      var node  = new Node(role);
      var controller = this.controllers.create(node);
      return new TreeView({model: topic, node: node, controller: controller});
    }
  },{
    template: new Dictionary()
  });
  
  (function(template){
    template.add('dirty', function(){
      return new DirtyView({model: this.model});
    });
    template.add('title', function(){
      return new TitleView({model: this.model});
    });
    template.add('commands', function(){
      return this.commands();
    });
    template.add('errors', function(){
      return new InlineErrorsView({model: this.model}).marks(this);
    });
    template.add('root_node', function(){
      return new RootNodeView({node: this.options.node, controller: this.options.controller});
    });
  })(TreeView.template);

  return TreeView;

});
