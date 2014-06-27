define(['constraint', 'constraints', 'models/topic', 'models/role', 'check'], function(Constraint, Constraints, Topic, Role, Check){

  var playsRole = function(rt, at, card) {
    var tt = this;
    return new TopicRoleConstraint(tt, rt, at, card).serialize();
  };

  var TopicRoleConstraint = Constraints.TopicRoleConstraint = Constraint.extend({
    init: function(topic_type, role_type, association_type, card){
      this._super(topic_type.topic_map());
      this.type = 'topic_role_constraint';
      this.topic_type = topic_type;
      this.role_type = role_type;
      this.association_type = association_type;
      this.card = card || [0, 1];
    },
    check: function(model){
      return null; //TODO: get rid of this method?
      var error = null;
      var role_type = this.role_type.iids().first();
      var association_type = this.association_type ? this.association_type.iids().first() : null;
      var topic_type = this.topic_type.iids().first();
      var matchRole = function(role){
        return role.isa(role_type) && (!association_type || role.association().isa(association_type));
      };

      if (model instanceof Topic) {
        var topic = model;
        var roles = topic.roles().select(matchRole);
        if (roles.length > 0 && !topic.isa(topic_type)) {
          error = {model: topic, message: 'cannot play the {0} role'.plug(role_type)};
        }
      }
      return error;
    },
    serialize: function(){
      var that = this, tm = this.topic_map();
      return this.constraint = tm.constraint(that.type, {card: that.card}, function(c){
        tm.constrained_topic_type(c, that.topic_type);
        tm.constrained_role(c, that.role_type);
        tm.constrained_statement(c, that.association_type);
      });
    }
  },{
    deserialize: function(constraint){
      var counterparts = constraint.roles().counterparts();
      var association_type = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_statement');
      }).topic();
      var topic_type = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_topic_type');
      }).topic();
      var role_type = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_role');
      }).topic();
      var card = constraint.get('card');
      return new TopicRoleConstraint(topic_type, role_type, association_type, card).source(constraint);
    }
  });

  _.extend(Topic.prototype, {
    topic_role_constraint: playsRole,
    topic_role_constraints: function(){
      return this.constraints('topic_role_constraint');
    }
  });

  //TODO: this is applied at the role level.  should it be applied at a higher level, like the association level?
  //  I'm thinking how to have a validation executed the fewest number of times.
  //  This problem gets harrier for constraints tying together various types, as this ties together rt, at, and tt.
  //  Need to develop some principles (a checklist!) for how to best handle multi-pronged constraints.
  //  A peculiarity: regardless of where the check is run it can return a message for some other model. (e.g. {model: model})
  //    This param is only be necessary if the model returned is not the same as the context of the check.  Is this okay?
  //    Actually, there is a reason for attaching model: nested checks.  When we run association checks we can also get role checks if our option params allow.
  //    Would it be better if the check could be run within each context?
  var PlayedByValidTopicTypeCheck = TopicRoleConstraint.PlayedByValidTopicTypeCheck = Check.extend({
    check: function(){
      var role = this, assoc = this.association(), topic = this.topic();
      var trcs = this.constraints('topic_role_constraint').deserialize();
      trcs = trcs.select(function(constraint){
        return assoc.isa(constraint.association_type.iids().first());
      }).select(function(constraint){
        return role.isa(constraint.role_type.iids().first());
      });
      var validTopicTypes = trcs.map(function(constraint){
        return constraint.topic_type;
      });
      var isValidTopic = validTopicTypes.length == 0 || validTopicTypes.any(function(tt){
        return topic.isa(tt.iids().first());
      });
      if (!isValidTopic) {
        return {model: role, message: '{topic_type} cannot play the {role_type} role'.plug({topic_type: topic.types().first(), role_type: this.type()})};
      }

      var message = trcs.map(function(constraint){
        var min = constraint.card[0], max = constraint.card[1];
        var rt = constraint.role_type.iids().first();
        var count = assoc.roles().type(rt).topic(topic).count();
        if (min > 0 && count < min) {
          return 'may not play fewer than {0} {1} {2}'.plug(min, rt, 'role'.cpluralize(min));
        }
        if (max > 0 && count > max) {
          return 'may not play more than {0} {1} {2}'.plug(max, rt, 'role'.cpluralize(max));
        }
      }).compact().uniq().first();

      if (message) {
        return {model: role, message: message};
      }

      return null;
    }
  });

  //It is sometimes necessary to perform some checks only once within the context of a particular model rather than from within the constraint itself (where it might be run multiple times).
  Role.checks.push(new PlayedByValidTopicTypeCheck());

  return TopicRoleConstraint;

});
