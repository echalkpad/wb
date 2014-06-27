define(['constraint', 'constraints', 'models/topic', 'models/topic_map', 'mixins'], function(Constraint, ConstraintTypes, Topic, TopicMap, Mixins){

  var Constraints = Mixins.Constraints = {
    check: function(model){
      return this
        .map(function(constraint){
          return constraint.check;
        })
        .select(function(check){
          return check;
        })
        .map(function(check){
          return check(model);
        })
        .compact();
    },
    deserialize: function(){
      return this.map(function(constraint){
        var klass = constraint.types()
          .map(function(type){
            return ConstraintTypes[type.classify()];
          })
          .compact()
          .first() || Constraint;
        var deserialize = klass.deserialize;
        return deserialize(constraint);
      });
    }
  };

  _.extend(Constraints, Mixins.Topics); //constraints are also topics
  _.extendResult(Constraints, 'deserialize', Mixins.promise('Constraints'));

  _.extend(Topic.prototype, {
    topic_property_constraints: function(){
      return this.constraints('topic_name_constraint','topic_occurrence_constraint');
    }
  });
  _.extendResult(Topic.prototype, 'topic_property_constraints', Mixins.promise('Constraints'))

  _.extend(TopicMap.prototype,{
    constraint: function(type, attributes, fn){
      attributes || (attributes = {})
      var scopes = ['constraints'];
      return this.topic({scopes: scopes, types: [type]}, function(){
        var c = this;
        _.each(attributes, function(value, key){
          c.occurrence({type: key, value: value});
        });
        if (fn){
          fn.call(c, c);
        }
      });
    },
    constrained_statement: function(c, st){
      var scopes = ['constraints'];
      return this.association({scopes: scopes, type: 'constrained_statement'}, function(){
        this.role({scopes: scopes, type: 'constrained', topic: st});
        this.role({scopes: scopes, type: 'constraint' , topic: c });
      });
    },
    constrained_role: function(c, rt){
      var scopes = ['constraints'];
      return this.association({scopes: scopes, type: 'constrained_role'}, function(){
        this.role({scopes: scopes, type: 'constraint', topic: c});
        this.role({scopes: scopes, type: 'constrained', topic: rt});
      });
    },
    constrained_topic_type: function(c, tt){
      var scopes = ['constraints'];
      return this.association({scopes: scopes, type: 'constrained_topic_type'}, function(){
        this.role({scopes: scopes, type: 'constraint', topic: c});
        this.role({scopes: scopes, type: 'constrained', topic: tt});
      });
    }
  });

  return Constraints;

});
