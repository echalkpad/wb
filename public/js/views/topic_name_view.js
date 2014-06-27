define(['backbone'], function(Backbone){

  var TopicNameView = Backbone.View.extend({
    tagName: "a",
    initialize: function(options){
      _.bindAll(this, 'render');
      this.model.bind("renamed", this.render);
    },
    render: function(){
      var topic = this.model;
      var role  = this.options.role;
      var types = topic.types().join(' ');
      var a     = this.$el.empty().attr({title: types});
      var name  = [topic.name(), types].coalesce();
      var inContext = this.options.inContext;
      if (this.options.inContext){
        a.addClass('in-context');
        name = 'Me';
      }
      if (types == name) {
        a.addClass('unnamed');
      }
      a.text(name || '?').attr({href: '#' + topic.url()});
      this.$el.draggable({ //TODO: prevent the draggable from being dropped where it started
        revert: true,
        opacity: .5,
        distance: 5,
        helper: 'clone',
        appendTo: 'body',
        start: function(e, ui){
          ui.helper.data({topic: topic, role: role, dispose: false});
        },
        stop: function(e, ui){
          if (e.ctrlKey || ui.helper.data('dispose')) {
            role.detach({dissolve: inContext && !e.ctrlKey});
          }
        }
      });
      return this;
    }
  });

  return TopicNameView;

});
