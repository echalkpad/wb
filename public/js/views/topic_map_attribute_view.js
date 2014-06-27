define(['views/attribute_view'], function(AttributeView){

  var TopicMapAttributeView = AttributeView.extend({
    render: function(){
      var that = this;
      var label = $("<label/>").html("topic map");
      var input = $('<a>').attr({'href': "#topic_maps/" + this.model.get("id")}).text(this.model.iri())
      this.$el.empty()
        .append(label)
        .append(input)
        .attr({'data-attribute': 'topic_map_id'});
      return this;
    }
  });

  return TopicMapAttributeView;

});
