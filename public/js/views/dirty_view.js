define(['backbone'], function(Backbone){

  var DirtyView = Backbone.View.extend({
    className: 'dirty',
    initialize: function(){
      _.bindAll(this, 'render');
      var model = this.options.model;
      model.bind('change',this.render);
      model.bind('persisted',this.render);
    },
    render: function(){
      var model = this.options.model;
      var $el = this.$el.empty();
      if (model.isDirty())
        $('<img>').attr({src: '/images/dirty.png'}).appendTo($el);
      return this;
    }
  });

  return DirtyView;

});
