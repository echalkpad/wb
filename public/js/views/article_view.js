define(['views/composite_view', 'views/section_view', 'views/commands_view', 'commands', 'views'], function(CompositeView, SectionView, CommandsView, Commands, Views){

  //TODO: coluld we make the SectionView the default wrapper for ArticleView where you have to explicitly omit it?  (once we get the ListView wraps method working)

  //NOTE: it can make sense to trigger events on the view rather than the model.
  // for example, triggering 'isolate' on the model would isolate that model inside all views.  isolate is meant to work within a single parent view only.

  var commands = new Commands(), views = new Views();

  var ArticleView = CompositeView.extend({
    tagName: "article",
    dynamicAttrs: function(){ //override
      return {};
    },
    refreshAttrs: function(){
      return this.dynamicAttrs && this.$el.attr(this.dynamicAttrs());
    },
    close: function(){
      //TODO: after close select the nearest model.  make sure to reset the url hash.  this logic probably belongs up in the workspace model.
      this.trigger('close');
      this.unbind();
      return this;
    },
    expand: function(){
      this.trigger('expand');
    },
    collapse: function(){
      this.trigger('collapse');
    },
    isolate: function(){
      this.trigger('isolate');
    },
    refresh: function(){
      this.render();
      this.$el.effect("highlight", {}, 1500);
    },
    header: function(title){
      return $('<header>').html($('<h1>').text(title));
    },
    section: function(options){
      options = _.defaults(options || {}, {parent: this, model: this.model, commands: commands});
      return new SectionView(options);
    },
    commands: function(options){
      options = _.defaults(options || {}, {className: "commands", collapsible: false, commands: commands, targets: [this.model, this]});
      var command_options = _.extract(options, 'commands', 'targets');
      options.contents = options.contents || new CommandsView(command_options)
      options.commands = {};
      return this.section(options);
    },
    transform: function(template){ //TODO: provide feedback while transform is taking place (seems slow).
      if (!template) {
        var candidates = views.targets(this.model);
        var idx = candidates.indexOf(this.__proto__.constructor); //TODO: is __proto__ cross-platform?
        var count = candidates.count();
        if (idx === -1) throw "cannot cycle";
        idx += 1;
        if (idx > count - 1) idx = 0;
        template = candidates.at(idx);
      }
      this.trigger('transform', template);
      return template;
    },
    setCursor: function(){
      var target = this.$el.find(":input:visible, li[data-attribute=types] input").not(":button").eq(0);
      target[0].select();
      target.focus();
    }
  },{
    commands: commands,
    views: views
  });

  _.aspect(ArticleView.prototype, 'initialize', function($super, options){
    $super.call(this, options);
    this.refreshAttrs();
  });

  return ArticleView;

});
