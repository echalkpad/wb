define(['views/list_view', 'views/topic_map_token_view'], function(ListView, TopicMapTokenView){

  var EmbeddedMapsView = ListView.extend({
    className: 'embedded-maps-list',
    draw: function(topic_map){
      return new TopicMapTokenView({tm: this.model, model: topic_map, label: topic_map.iri()});
    },
    items: function(){
      return this.model.embedded_maps().map(this.draw);
    }
  });

  _.aspect(EmbeddedMapsView.prototype, 'initialize', function($super, options){
    $super.call(this, options);
    var model = this.model, render = this.render;
    model.bind("change:embedded_map_ids", render);
    this.$el.one("remove", function(){
      model.unbind("change:embedded_map_ids", render);
    });
  });

  return EmbeddedMapsView;

});