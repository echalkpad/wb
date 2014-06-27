define(['views/composite_view', 'views/add_association_view', 'views/topic_association_type_table_view'], function(CompositeView, AddAssociationView, TopicAssociationTypeTableView){

  var TopicAssociationTypesTablesView = CompositeView.extend({
    tagName: 'ul',
    initialize: function(options){
      _.bindAll(this, "render");
      var that = this, model = this.model;
      var associated = function(options){
        //the appropriate association table may not yet exist.  if not, re-render all association tables.
        if ($(that.el).find('table.' + options.association_type).length == 0){
          that.render();
        }
      };
      model.bind("associated", associated);
      this.$el.one("remove", function(){
        model.unbind("associated", associated);
        that.unbind();
      });
    },
    items: function(){
      var topic = this.model;
      return topic.association_types()
        .sortBy(function(association_type){
          return association_type;
        })
        .map(function(association_type){
          return new TopicAssociationTypeTableView({model: topic, association_type: association_type});
        });
    },
    addAssociation: function(button){
      var target = this.$el.closest('section').find('ul.commands').first();
      $(new AddAssociationView({model: this.model, onClose: function(){$(button).show();}}).render().el).appendTo(target).find(':input:first').focus();
      $(button).hide();
    },
  });

  return TopicAssociationTypesTablesView;

});
