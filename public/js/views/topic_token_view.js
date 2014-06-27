define(['backbone'], function(Backbone){

  var TopicTokenView = Backbone.View.extend({
    tagName: 'a',
    tagClass: 'topic',
    initialize: function(options){
      _.bindAll(this);
      var topic = this.model;
      var self = this;
      topic.bind && topic.bind('renamed', this.render);
      topic.bind && topic.bind('remove', function(){
        self.$el.remove();
      });
    },
    render: function(){
      var model = this.options.model, label = this.options.label, tm = this.options.tm, $el = this.$el;

      if (_.isFunction(label))
        label = label();

      $el.empty()
        .attr({href: '#' + model.url(), 'data-types': model.types().join(' '), 'title': model.types().join(', ')})
        .html(label)
        .draggable({
          revert: false,
          opacity: .5,
          distance: 5,
          helper: 'clone',
          appendTo: 'body',
          start: function(e, ui){
            ui.helper.data({topic: model, dispose: false}); //TODO: only removing the first type.  should be all (or at least the "native" topics).  maybe pass term instead.
          }
        });

     if (model.isNative(tm))
        $el.addClass('native');
     if (model.isForeign(tm))
        $el.addClass('foreign');

      return this;
    }
  });

  return TopicTokenView;

});
