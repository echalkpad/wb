define(['mixins', 'models/topic'], function(Mixins, Topic){

  var Topics = Mixins.Topics = {
    values: function(occurrence_type, value) { //getter/setter
      return this
        .map(function(topic){
          return topic.occurrences().isa(occurrence_type).all();
        })
        .flatten()
        .compact()
        .map(function(occurrence){
          if (!_.isUndefined(value)) { //setter?
            occurrence.value(value);
          }
          return occurrence.value();
        });
    }
  };

  Topic.lists.each(function(list){
    Topics[list] = function(){
      return this.invoke(list).flatten().uniq();
    };
  });

  return Topics;

});
