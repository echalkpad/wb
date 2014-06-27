define(['views/composite_view', 'views/associations_view', 'backbone'], function(CompositeView, AssociationsView, Backbone){

  var AssociationsByTypeView = CompositeView.extend({
    initialize: function(options){
      _.bindAll(this);
      var self = this, model = this.model;
      var associated = function(options){
        //if there is not yet an association of the appropriate association type, re-render everything.
        if (self.$el.find('li[data-type=' + options.association_type + ']').length == 0){
          //self.render();
        }
      };
      model.bind("associated", associated);
      this.$el.one("remove", function(){
        model.unbind("associated", associated);
        self.unbind();
      });
    },
    tagName: 'ul',
    className: 'association-types',
    items: function(){
      var topic = this.model;
      return topic.association_types()
        .sortBy(function(association_type){
          return association_type;
        })
        .map(function(association_type){
          return new AssociationTypeView({model: topic, association_type: association_type});
        });
    }
  });

  var AssociationTypeView = Backbone.View.extend({
    tagName: 'li',
    render: function(){
      var association_type = this.options.association_type, model = this.options.model, tm = model.topic_map(), term = tm.term(association_type);
      this.$el.empty().
        attr({'data-type': association_type}).
        append($('<h2>').html($('<a>').attr({href: '#' + term.urls().first()}).text(association_type))).
        append(new AssociationsView({model: model, association_type: association_type}).render().el);
      return this;
    }
  });

  return AssociationsByTypeView;

});
