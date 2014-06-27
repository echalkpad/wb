define(['views/topic_token_view', 'views/list_view', 'result_set'], function(TopicTokenView, ListView, ResultSet){

  //TODO: create term mode, fetch-topics mode (use dropdown command button?).
  var BasicTypeView = ListView.extend({
    className: 'basic_types',
    /*events: {
      'click a': 'fetchTopics'
    }, */
    query: function(type){
      var method = {topic_type: 'isa', name_type: 'name', occurrence_type: 'occurrence', association_type: 'association', role_type: 'role'}[this.options.basic_type];
      return this.model.topics()[method]({type: type});
    },
    items: function(){
      var tm = this.model;
      return this.list.map(function(topic){
        return topic.iids().map(function(iid){
          return {iid: iid, topic: topic};
        });
      }).flatten().sortBy(function(item){
        return item.iid;
      }).map(function(item){ //tm.term(iid);
        return new TopicTokenView({tm: tm, model: item.topic, label: item.iid});
      });
    },
    fetchTopics: function(e){
      e.preventDefault(); _.stopPropagation(e)
      var type = $(e.target).html();
      var query = this.query(type);
      var topics = query.all();
      var results = new ResultSet(topics, query.matches, this.model, type.titleize().pluralize());
      this.model.trigger('searched', results);
      return this;
    }
  });

  _.aspect(BasicTypeView.prototype, 'initialize', function($super, options){
    var self = this;
    var tm = this.model, method = options.basic_type.pluralize();
    var query = tm.topics().type(options.basic_type).where(function(topic){
      return topic.iids().length > 0;
    });
    var types = query.all(); //TODO: bug -- this gets hit twice. why?
    var results = new ResultSet(types, query.matches, this.model, method.humanize().titleize());
    $super.call(this, _.defaults(options, {list: results}));
    results.bind('added', function(model){
      self.append(model.iids().map(function(iid){
        return new TopicTokenView({tm: tm, model: model, label: iid});
      }));
    });
  });

  return BasicTypeView;

});
