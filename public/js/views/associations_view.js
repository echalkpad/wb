define(['views/list_view', 'views/association_view'], function(ListView, AssociationView){

  var AssociationsView = ListView.extend({
    initialize: function(options){
      _.bindAll(this);
      var association_type = options.association_type, associated = "associated:" + association_type, model = this.model, render = this.render, tm = this.model.topic_map(), term = this.term = tm.term(association_type);
      model.bind(associated, render);
      this.$el.one('remove', function(){
        model.unbind(associated, render);
      });
      if (tm === null){
        this.items = function(){
          return [];
        };
      };
    },
    items: function(){
      var topic = this.model;
      var self  = this;
      var association_type = this.options.association_type;
      var associations = topic.associations().type(association_type).all();

      var roles = associations
        .map(function(assoc){
          return assoc.roles().played().all();
        })
        .flatten();

      var my_role = this.my_role = this.my_role || roles.detect(function(role){
        return role.topic() === topic;
      });

      var used_role_types = roles
        .map(function(role){
          return role.type();
        })
        .uniq();

      var role_types = this.term.constrained_role_types().concat(used_role_types)
        .uniq()
        .sortBy(function(role_type){ //position "my role" in last spot
          return (my_role && role_type === my_role.type() ? 'Z' : 'A');
        });

      return associations.map(function(assoc){
        assoc.bind("dissociated", self.render);
        return new AssociationView({model: assoc, context: topic, role_types: role_types});
      });
    }
  });

  return AssociationsView;

});
