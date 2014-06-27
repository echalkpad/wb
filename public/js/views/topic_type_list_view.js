define(['views/list_view'], function(ListView){

  var TopicTypeListView = ListView.extend({
    events: {
      'click button': 'findTopics'
    },
    items: function(){
      return this.options.tm.topic_types().map(function(topic_type){
        return $('<button/>').attr({'data-topic-type': topic_type}).text(topic_type);
      });
    },
    findTopics: function(e){
      var tm = this.options.tm;
      var topic_type = $(e.target).attr('data-topic-type');
      tm.topics().isa(topic_type).each(topic.locate);
    }
  });

  return TopicTypeListView;

});
