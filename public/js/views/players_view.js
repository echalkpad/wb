define(['views/composite_view', 'views/topic_name_view', 'views/inline_errors_view'], function(CompositeView, TopicNameView, InlineErrorsView){

  var PlayersView = CompositeView.extend({
    tagName: 'ul',
    className: 'players',
    initialize: function(options){
      _.bindAll(this);
      var self = this, model = this.model;
      var associated = function(options){
        //the appropriate association table may not yet exist.  if not, re-render all association tables.
        if ($(self.el).find('table.' + options.association_type).length == 0){
          //self.render();
        }
      };
      model.bind("associated", associated);
      this.$el.one("remove", function(){
        model.unbind("associated", associated);
        self.unbind();
      });
    },
    counterparts: function(){
      var roles = this.options.roles, context = this.options.context;
      return roles.reject(function(role){
        return role.topic() === context;
      });
    },
    items: function(){
      var self = this, roles = this.options.roles, model = this.options.model, context = this.options.context;
      return roles.map(function(role){
        var li = $('<li>');
        var topic = role.topic();
        var inContext = topic === context;
        li.append(new TopicNameView({model: topic, role: role, inContext: inContext}).render().el);
        if (inContext) {
          li.append(new InlineErrorsView({model: model, target: 'association'}).marks(self.$el).render().el);
        }
        li.append(new InlineErrorsView({model: role}).marks(self.$el).render().el);
        li.append($('<img>').attr({src: '/images/close.png', title: 'remove player'}).click(function(e){
          role.destroy();
        }));
        return li;
      }).flatten();
    }
  });

  return PlayersView;

});
