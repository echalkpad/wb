define(['backbone', 'views/association_view'], function(Backbone, AssociationView){

  var TopicAssociationsView = Backbone.View.extend({
    tagName: "ul",
    className: "associations",
    render: function(){
      var $el = this.$el;
      var model = this.model;
      var associations = this.model.associations().all();
      var association_types = this.model.association_types();
      association_types.each(function(association_type){
        var at = $("<fieldset/>").addClass(association_type);
        at.append($("<legend/>").text(association_type));
        model.associations().type(association_type).each(function(assoc){
          at.append(new AssociationView({model: assoc, context: model}).render().el);
        });
        $el.append(at);
      });
      return this;
    }
  });

  return TopicAssociationsView;

});
