define(['views/list_view', 'views/topic_token_view', 'result_set'], function(ListView, TopicTokenView, ResultSet){

  var TopicListView = ListView.extend({
    className: 'topic-list',
    draw: function(topic){
      return new TopicTokenView({tm: this.model, model: topic, label: topic.name});
    },
    items: function(){
      var results = this.list.all();
      return results.sortBy(function(topic){
        return topic.name();
      }).map(this.draw);
    }
  });

  _.aspects(TopicListView.prototype, {
    initialize: function($super, options){
      var self = this;
      var query = this.model.topics().named().where(function(topic){
        return !topic.isBasicType();
      });
      var named_topics = query.all();
      var results = new ResultSet(named_topics, query.matches, this.model, 'Named Topics');
      $super.call(this, _.defaults(options, {list: results}));
      results.bind('added', function(topic){
        self.append(self.draw(topic));
      });
    }
  });

  return TopicListView;

});