define(['views/attributes_view', 'views/attribute_view', 'views/topic_map_attribute_view'], function(AttributesView, AttributeView, TopicMapAttributeView){

  var TopicHeaderView = AttributesView.extend({
    ordinals: function(){
      return this.model.constructor.headers;
    },
    items: function(){
      var model = this.model;
      return this.ordinals().map(function(attr){
        var view;
        if (attr === 'topic_map_id') {
          var tm = model.client().db.topic_maps.get(model.topic_map_id());
          view = new TopicMapAttributeView({model: tm, attribute: 'id'});
        } else {
          view = new AttributeView({model: model, attribute: attr});
        }
        return view;
      });
    }
  });

  return TopicHeaderView;

});
