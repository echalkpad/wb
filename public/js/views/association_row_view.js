define(['backbone', 'views/topic_name_view', 'views/inline_errors_view'], function(Backbone, TopicNameView, InlineErrorsView){

  var AssociationRowView = Backbone.View.extend({
    initialize: function(options){
      _.bindAll(this, "render");
      if (this.model) {
        this.model.bind("associated", this.render);
        this.model.bind("dissociated", this.render);
      }
    },
    tagName: "tr",
    render: function(){
      var row = this.$el.empty();
      var assoc = this.model;
      var context = this.options.context;

      this.options.role_types.each(function(role_type){
        var roles = assoc ? assoc.roles().played(role_type).all() : [];
        var cell  = $('<td/>').addClass(role_type);
        var droppable = cell.droppable({
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

        if (roles.length == 0){
          cell.html("&nbsp;");
        }
        roles.each(function(role){
          var topic = role.topic();
          var inContext = topic == context;
          var name = new TopicNameView({model: topic, role: role, inContext: inContext}).render().el;
          var errors = new InlineErrorsView({model: assoc, target: 'association'}).marks(cell).render().el;
          cell.append(name);
          if (inContext) {
            cell.append(errors);
          }
          errors = new InlineErrorsView({model: role}).marks(cell).render().el;
          cell.append(errors);
        });
        row.append(cell);
      });
      return this;
    }
  });

  return AssociationRowView;

});
