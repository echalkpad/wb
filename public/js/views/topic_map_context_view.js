define(['views/list_view', 'views/topic_map_token_view'], function(ListView, TopicMapTokenView){

  var TopicMapContextView = ListView.extend({
    className: "maps",
    initialize: function(options){
      _.bindAll(this);
      this.mediator = options.mediator;
      this.mediator.bind('change:topic_map', this.render);
    },
    items: function(){
      var tm = this.mediator.topic_map();
      tm && tm.bind('change:embedded', this.render);
      return tm ? tm.topic_maps().map(function(topic_map){
        return new TopicMapTokenView({tm: tm, model: topic_map, label: topic_map.iri()})
      }) : [];
    }
  });

  return TopicMapContextView;

});