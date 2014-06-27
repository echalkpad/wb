define(['query'], function(Query){

  var TopicMapQuery = Query.extend({
    className: 'TopicMapQuery',
    iri: function(iri){
      return this.where(function(topic_map){
        return topic_map.iri() === iri;
      });
    }
  });

  return TopicMapQuery;

});
