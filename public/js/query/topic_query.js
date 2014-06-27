define(['query', 'mixins'], function(Query, Mixins){

  var TopicQuery = Query.extend({
    className: 'TopicQuery',
    name: function(options){
      var type = options.type; delete options.type;
      return this.where(function(topic){
        return topic.names().isa(type).value(options).any();
      });
    },
    occurrence: function(options){
      var type = options.type; delete options.type;
      return this.where(function(topic){
        return topic.occurrences().isa(type).value(options).any();
      });
    },
    property: function(options){
      var type = options.type; delete options.type;
      return this.where(function(topic){
        return topic.properties().isa(type).value(options).any();
      });
    },
    association: function(options){
      var type = options.type;
      var hasType = type ? function(association){
        return association.isa(type);
      } : _.returnTrue;
      var filter = function(topic){
        return topic.associations().any(function(association){
          return hasType(association);
        });
      };
      return this.where(filter);
    },
    role: function(options){
      var type = options.type, topic = options.topic;
      var hasType = type ? function(role){
        return role.isa(type);
      } : _.returnTrue;
      var hasTopic = topic ? function(role){
        return role.topic() === topic;
      } : _.returnTrue;
      var filter = function(topic){
        return topic.roles().any(function(role){
          return hasType(role) && hasTopic(role);
        });
      };
      return this.where(filter);
    },
    named: function(value){
      return arguments.length === 0 ? this.where(function(topic){
        return !!topic.name();
      }) : this.name({value: value});
    },
    unnamed: function(){
      return this.where(function(topic){
        return !topic.name();
      });
    },
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
  });

  TopicQuery.prototype.base = TopicQuery;

  _.extend(TopicQuery.prototype, Query.Mixins.Identified);
  _.extendResult(TopicQuery.prototype, Query.Terminators, Mixins.promise('Topics'));

  return TopicQuery;
});
