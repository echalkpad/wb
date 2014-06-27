define(['models/topic', 'query/topic_query'], function(Topic, TopicQuery){

  //tags are not native to topic maps but are generally useful for finding
  Topic.toystore().list('tags');

  _.extend(TopicQuery.prototype, {
    tagged: function(){
      var tags = _.toArray(arguments);
      return this.where(function(topic){
        var tagged = topic.tags();
        return tagged.length > 0 && tagged.all(function(tag){
          return tags.contains(tag);
        });
      });
    }
  });

  return Topic; //TODO: do amd modules have to return something?  we may only be extending what already exists.

});