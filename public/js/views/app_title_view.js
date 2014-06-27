define(['backbone'], function(Backbone){

  var AppTitleView = Backbone.View.extend({
    attributes: {id: 'app-title'},
    tagName: 'h1',
    render: function(){
      this.$el.text("Thingy"); //TODO: use app variable in core
      return this;
    }
  });

  return AppTitleView;

});
