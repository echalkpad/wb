define(['backbone'], function(Backbone){

  var AssociationView = Backbone.View.extend({
    tagName: "article",
    className: "association",
    render: function(){
      var list = $("<ul/>").addClass("roles");
      var context = this.options.context;
      this.model.roles.each(function(role){
        var li = $(new RoleView({model: role}).render().el);
        if (role.topic() == context) {
          li.addClass('in-context');
        }
        list.append(li);
      });
      this.$el.append(list);
      return this;
    }
  });

  return AssociationView;

});
