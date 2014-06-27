define(['backbone'], function(Backbone){

  var RoleView = Backbone.View.extend({
    initialize: function(options){
      _.bindAll(this,"render");
      this.model.topic().bind("renamed",this.render);
    },
    tagName: "li",
    className: "role",
    render: function(){
      var role = this.model;
      var topic = role.topic();
      this.$el.empty().append($("<label/>").text(role.type())).append($("<a/>").attr({href: '#topics/' + topic.id}).text(topic.name()));
      return this;
    }
  });

  return RoleView;

});
