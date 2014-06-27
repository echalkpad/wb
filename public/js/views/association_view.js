define(['views/composite_view', 'views/list_view', 'views/players_view', 'views/topic_name_view', 'views/inline_errors_view'], function(CompositeView, ListView, PlayersView, TopicNameView, InlineErrorsView){

  var AssociationView = CompositeView.extend({
    initialize: function(options){
      _.bindAll(this);
      var model = this.model, render = this.render;
      if (model) {
        model.bind("associated" , render);
        model.bind("dissociated", render);
      }
    },
    className: 'association',
    tagName: 'ul',
    items: function(){
      var assoc   = this.model, tm = assoc.topic_map();
      var context = this.options.context;

      return this.options.role_types.map(function(role_type){
        var roles = assoc ? assoc.roles().played(role_type).all() : [];
        var li  = $('<li>').addClass(role_type);
        var term = tm.term(role_type);
        var droppable = li.droppable({
          accept: '.topic, a, h1',
          hoverClass: 'drophover'
        });
        droppable.bind("drop", function(e, ui){
          _.stopPropagation(e);
          var topic = ui.helper.data('topic');
          var role  = ui.helper.data('role');
          if (e.ctrlKey) {
            ui.draggable.data('dispose', true);
          }
          console.log('dropped', {topic: topic, assoc_type: assoc.type(), role_type: role_type});
          assoc.role({type: role_type, topic: topic});
        });

        var title = $('<h3>').html($('<a>').attr({href: '#' + term.urls().first()}).text(role_type));
        var players = new PlayersView({model: assoc, roles: roles, context: context});
        li.attr({'data-counterparts': players.counterparts().length.toString()});
        li.append(title);
        li.append(players.render().el);
        //TODO: add 'me' class if in context.  use event on players view.
        return li;
      });
    }
  });

  return AssociationView;

});
