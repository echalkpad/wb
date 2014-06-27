define(['constraint', 'constraints', 'models/topic', 'mixins'], function(Constraint, Constraints, Topic, Mixins) {

  var hasName = function(nt, card) {
    var tt = this;
    return new TopicNameConstraint(tt, nt, card).serialize();
  };

  var TopicNameConstraint = Constraints.TopicNameConstraint = Constraint.extend({
    init: function(topic_type, name_type, card){
      this._super(topic_type.topic_map());
      this.type = 'topic_name_constraint';
      this.topic_type = topic_type;
      this.name_type = name_type;
      this.card = card || [0, 0];
    },
    check: function(topic){
      var error = null;
      if (topic instanceof Topic){
        var iids  = this.name_type.iids();
        var type  = iids.first();
        var min = this.card[0], max = this.card[1];
        var found = topic.names().select(function(name){
          return iids.detect(function(iid){
            return name.isa(iid);
          });
        }).length;
        if (found < min && min > 0){
          error = {model: topic, message: "must have at least {0} {1}".plug(min, type.cpluralize(min))};
        }
        if (found > max && max > 0){
          error = {model: topic, message: "must have no more than {0} {1}".plug(max, type.cpluralize(max))};
        }
      }
      return error;
    },
    serialize: function(){
      var that = this, tm = this.topic_map();
      return this.constraint = tm.constraint(that.type, {card: that.card}, function(c){
        tm.constrained_topic_type(c, that.topic_type);
        tm.constrained_statement(c, that.name_type);
      });
    }
  },{
    deserialize: function(constraint){
      var counterparts = constraint.roles().counterparts();
      var topic_type = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_topic_type');
      }).topic();
      var name_type = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_statement');
      }).topic();
      var card = constraint.get('card');
      return new TopicNameConstraint(topic_type, name_type, card).source(constraint);;
    }
  });

  TopicNameConstraint.create = hasName;

  _.extend(Topic.prototype, {
    topic_name_constraint: hasName,
    topic_name_constraints: function(){
      return this.constraints('topic_name_constraint');
    },
    constrained_name_types: function(){
      return this.topic_name_constraints().deserialize().pluck('name_type');
    }
  });

  _.extendResult(Topic.prototype, 'constrained_name_types', Mixins.promise('Topics'));

  return TopicNameConstraint;

});
