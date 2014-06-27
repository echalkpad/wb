define(['query', 'query/topic_query'], function(Query, TopicQuery){

  var PropertyQuery = Query.extend({
    className: 'PropertyQuery',
    values: function(){
      return this.map(function(property){
        return property.value();
      });
    },
    present: function(){
      return this.where(function(property){
        return _.present(property.value());
      })
    },
    absent: function(){
      return this.where(function(property){
        return _.absent(property.value());
      })
    },
    topics: function(){
      var that = this;
      var collection = function(){
        return that.all().map(function(property){
          return property.topic();
        }).uniq();
      }
      return new TopicQuery({collection: collection, context: this});
    }
  });

  PropertyQuery.prototype.base = PropertyQuery;
  _.extend(PropertyQuery.prototype, Query.Mixins.Valued);

  return PropertyQuery;

});
