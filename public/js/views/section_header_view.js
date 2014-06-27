define(['backbone'], function(Backbone){

  var SectionHeaderView = Backbone.View.extend({
    tagName: "header",
    events: {
      'click': 'toggle'
    },
    render: function(){
      this.$el.empty().append($('<h2/>').text(this.options.title || ''));
      return this;
    },
    toggle: function(){
      this.$el.parent().toggleClass('collapsed');
    }
  });

  return SectionHeaderView;

});
