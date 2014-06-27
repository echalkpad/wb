define(['backbone', 'views/section_header_view', 'views/commands_view', 'commands'], function(Backbone, SectionHeaderView, CommandsView, Commands){

  var SectionView = Backbone.View.extend({
    tagName: "section",
    render: function(){
      var COLLAPSED   = "collapsed";
      var options     = _.defaults(_.clone(this.options || {}), {collapsible: true});
      var self        = this,
          title       = options.title,
          parent      = options.parent,
          contents    = options.contents,
          deferred    = !_.isUndefined(options.deferred) ? _.resolve(options.deferred) : _.isFunction(options.contents),
          className   = options.className,
          header      = _.$(options.header || new SectionHeaderView({title: title}), self),
          commands    = options.commands;

      this.$el.empty().addClass(className);

      if (title)
        header.appendTo(self.$el);

      var load = _.once(_.bind(function(){
        var views = contents = _.view(contents, self);
        var targets = [].concat(parent ? [] : [this.model]).concat(_.multiple(views)).compact();
        commands = _.resolve(commands, {context: targets}); //potential lazy resolution of commands
        commands && (commands = commands instanceof Commands || _.keys(commands).length > 0 ? new CommandsView({targets: targets, commands: commands}) : null);
        commands && _.$(commands, self).appendTo(self.$el);
        contents = _.$(contents, self).appendTo(self.$el);
        self.$el.toggleClass("blank", contents.html() === ''); //TODO: provide a customizable means of flagging blank? (e.g. if we have a request-bar but no data we're still blank)
      }, this));

      var expand = function(){
        load();
        self.$el.removeClass(COLLAPSED);
      };

      var collapse = options.collapsible ? function(){
        self.$el.addClass(COLLAPSED);
      } : _.doNothing;

      if (options.collapsed || deferred) collapse();

      parent && parent.bind('expand', expand);
      parent && parent.bind('collapse', collapse);

      if (deferred) {
        header.one("click", expand);
      } else {
        expand();
      }

      return this;
    },
  });

  return SectionView;

});
