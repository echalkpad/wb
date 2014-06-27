define(['models/topic_map', 'collections/documents'], function(TopicMap, Documents){

  var TopicMaps = Documents.extend({
    model: TopicMap
  });

  return TopicMaps;

});
