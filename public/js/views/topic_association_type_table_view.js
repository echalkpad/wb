define(['backbone', 'views/association_row_view'], function(Backbone, AssociationRowView){

  var TopicAssociationTypeTableView = Backbone.View.extend({
    initialize: function(options){
      _.bindAll(this, "render");
      var that = this, association_type = options.association_type, associated = "associated:" + association_type, model = this.model, render = this.render, tm = this.model.topic_map(), term = this.options.term = tm.term(association_type);
      model.bind(associated, render);
      this.$el.one("remove", function(){
        model.bind(associated, render);
      });
    },
    tagName: "li",
    render: function(){
      var tm = this.model.parent();

      if (tm == null){
        return this; //render only attached models
      }

      var topic = this.model;
      var view  = this;
      var association_type = this.options.association_type;
      var term  = this.options.term;
      var table = $("<table/>").addClass(association_type);
      var attrs = term.known() ? {href: '#' + term.urls().first()} : {}; //TODO: all urls?
      var associations = topic.associations().type(association_type).all();
      table.append($("<caption/>").html($("<a/>").attr(attrs).html(association_type)));

      var roles = associations
        .map(function(assoc){
          return assoc.roles().played().all();
        })
        .flatten();

      var my_role = this.my_role = this.my_role || roles.detect(function(role){
        return role.topic() == topic;
      });

      var used_role_types = roles
        .map(function(role){
          return role.type();
        })
        .uniq();

      var role_types = term.constrained_role_types().concat(used_role_types)
        .uniq()
        .sortBy(function(role_type){ //position "my role" in last spot
          return (my_role && role_type == my_role.type() ? 'Z' : 'A');
        });

      var button = $('<button/>').text('Add').addClass('add-association');
      button.click(function(){ //TODO: this is not causing a new row to appear
        topic.associate(association_type, {role_type: my_role.type()}); //TODO: properly set role_type
      });

      //table header
      var thead = $('<thead/>');
      var headings = $('<tr/>');
      role_types.each(function(role_type){
        var rt = tm.term(role_type);
        var a = $('<a/>').append(role_type);
        if (rt) {
          a.attr({href: '#' + rt.url()});
        }
        headings.append($('<th/>').append(a));
      });
      thead.append(headings);
      table.append(thead);

      associations.each(function(assoc){
        assoc.bind("dissociated", view.render);
        table.append(new AssociationRowView({model: assoc, context: topic, role_types: role_types}).render().el);
      });
      this.$el.empty().append(button).append(table);
      return this;
    }
  });

  return TopicAssociationTypeTableView;

});
