define(['query', 'query/topic_query', 'mixins'], function(Query, TopicQuery, Mixins){

  var RoleQuery = Query.extend({
    className: 'RoleQuery',
    topic: function(topic_or_id){
      var filter, topic_id;
      if (arguments.length === 0) {
        filter = function(role){
          return role.topic();
        }
      } else {
        topic_id = topic_or_id.id ? topic_or_id.id : topic_or_id;
        filter = function(role){
          return role.topic().id == topic_id;
        };
      }
      return this.where(filter);
    },
    played: function(type){
      var query = this.where(function(role){
        return role.topic();
      });
      return arguments.length === 0 ? query : query.where(function(role){
        return role.isa(type);
      });
    },
    topics: function(){
      var that = this;
      var collection = function(){
        return that.map(function(role){
          return role.topic();
        });
      };
      return new TopicQuery({collection: collection, context: this});
    },
    counterparts: function(){
      var that = this;
      var collection = function(){
        return that.all().counterparts();
      };
      return new RoleQuery({collection: collection, context: this});
    }
  });
  RoleQuery.prototype.base = RoleQuery;
  _.alias(RoleQuery.prototype, 'players', 'topics');

  _.extendResult(RoleQuery.prototype, Query.Terminators, Mixins.promise('Roles'), Mixins.promise('Typed'));

  return RoleQuery;
});
