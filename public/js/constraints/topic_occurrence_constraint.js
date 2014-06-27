define(['constraint', 'constraints', 'models/topic', 'mixins'], function(Constraint, Constraints, Topic, Mixins){

  var hasOccurrence = function(ot, card) {
    var tt = this;
    return new TopicOccurrenceConstraint(tt, ot, card).serialize();
  };

  var TopicOccurrenceConstraint = Constraints.TopicOccurrenceConstraint = Constraint.extend({
    init: function(topic_type, occurrence_type, card){
      this._super(topic_type.topic_map());
      this.type = 'topic_occurrence_constraint';
      this.topic_type = topic_type;
      this.occurrence_type = occurrence_type;
      this.card = card || [0, 0];
    },
    check: function(topic){
      var error = null;
      if (topic instanceof Topic){
        var iids  = this.occurrence_type.iids();
        var type  = iids.first();
        var min = this.card[0], max = this.card[1];
        var found = topic.occurrences().select(function(occurrence){
          return iids.detect(function(iid){
            return occurrence.isa(iid);
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
        tm.constrained_statement(c, that.occurrence_type);
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
      return new TopicOccurrenceConstraint(topic_type, name_type, card).source(constraint);
    }
  });

  TopicOccurrenceConstraint.create = hasOccurrence;

  _.extend(Topic.prototype, {
    topic_occurrence_constraint: hasOccurrence,
    topic_occurrence_constraints: function(){
      return this.constraints('topic_occurrence_constraint');
    },
    constrained_occurrence_types: function(){
      return this.topic_occurrence_constraints().deserialize().pluck('occurrence_type');
    }
  });

  _.extendResult(Topic.prototype, 'constrained_occurrence_types', Mixins.promise('Topics'));

  return TopicOccurrenceConstraint;

});
