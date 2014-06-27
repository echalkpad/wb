define(['backbone'], function(Backbone){

  var TopicMapTokenView = Backbone.View.extend({
    tagName: 'a',
    tagClass: 'topic-map',
    initialize: function(options){
      _.bindAll(this);
      var topic_map = this.model;
      var self = this;
      topic_map.bind && topic_map.bind('renamed', this.render);
      topic_map.bind && topic_map.bind('remove', function(){
        self.$el.remove();
      });
    },
    render: function(){
      var model = this.options.model, label = _.resolve(this.options.label), tm = this.options.tm, $el = this.$el;
      
      $el.empty()
        .attr({href: '#' + model.url(), 'title': label})
        .html(label);

      return this;
    }
  });

  return TopicMapTokenView;

});