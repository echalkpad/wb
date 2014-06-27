define(['constraint', 'constraints', 'models/association', 'models/topic', 'mixins'], function(Constraint, Constraints, Association, Topic, Mixins){

  var hasRole = function(rt, card){
    var at = this;
    return new AssociationRoleConstraint(at, rt, card).serialize();
  };

  var AssociationRoleConstraint = Constraints.AssociationRoleConstraint = Constraint.extend({
    init: function(association_type, role_type, card){
      this._super(association_type.topic_map());
      this.type = 'association_role_constraint';
      this.association_type = association_type;
      this.role_type = role_type;
      this.card = card || [1, 0];
    },
    check: function(association){
      var error = null;
      if (association instanceof Association) {
        var association_type = this.association_type.iids().first();
        var role_type = this.role_type.iids().first();
        var min = this.card[0], max = this.card[1];
        if (association.isa(association_type)){
          var found = association.roles().type(role_type).count();
          if (min > 0 && found < min) {
            error = {model: association, message: "must have at least {0} {1} role".plug(min, role_type)};
          }
          if (max > 0 && found > max) {
            error = {model: association, message: "must have at most {0} {1} role".plug(max, role_type)};
          }
        }
      }
      return error;
    },
    playedBy: function(){
      var topic_role_constraint = this.role_type
        .roles()
        .counterparts()
        .map(function(role){
          return role.topic();
        })
        .select(function(topic){
          return topic.isa('topic_role_constraint');
        })
        .first();

      return topic_role_constraint ? topic_role_constraint
        .roles()
        .select(function(role){
          return role.association().isa('constrained_topic_type');
        })
        .map(function(role){
          return role.counterpart().topic();
        }) : [];
    },
    serialize: function(){
      var that = this, tm = this.topic_map();
      return this.constraint = tm.constraint(that.type, {card: that.card}, function(c){
        tm.constrained_statement(c, that.association_type);
        tm.constrained_role(c, that.role_type);
      });
    }
  },{
    deserialize: function(constraint){
      var counterparts = constraint.roles().counterparts();
      var role_type = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_role');
      }).topic();
      var association_type = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_statement');
      }).topic();
      var card = constraint.get('card');
      return new AssociationRoleConstraint(association_type, role_type, card).source(constraint);;
    }
  });

  AssociationRoleConstraint.create = hasRole;

  _.extend(Topic.prototype, {
    association_role_constraint: hasRole,
    association_role_constraints: function(){
      return this.constraints('association_role_constraint');
    },
    constrained_role_types: function(){
      return this.constraints('association_role_constraint')
        .deserialize()
        .map(function(constraint){
          return constraint.role_type.iids();
        })
        .flatten()
        .uniq();
    },
    constrained_association_types: function(){
      return this.association_role_constraints().deserialize().pluck('association_type');
    },
    associate: function(type, options){
      options = options || {};
      var tm = this.topic_map();
      if (!options.role_type) { //TODO: properly default role type.
        //TODO: first determine if topic already plays a role within the given association_type.  if so, use that role.
        var term = tm.term(type);
        options.role_type = term.constraints('association_role_constraint').deserialize().first().role_type.iids().first();
      }
      var topic = this;
      return tm.association({type: type}, function(){
        this.role({type: options.role_type, topic: topic});
      });
    }
  });

  _.extendResult(Topic.prototype, 'constrained_association_types', Mixins.promise('Topics'));

  return AssociationRoleConstraint;
});
