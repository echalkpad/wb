define(['constraint', 'constraints', 'models/topic'], function(Constraint, Constraints, Topic){

  var hasLength = function(length){
    var st = this;
    return new LengthConstraint(st, length).serialize();
  };

  var LengthConstraint = Constraints.LengthConstraint = Constraint.extend({
    init: function(statement, length){
      this._super(statement.topic_map());
      this.type = 'length_constraint';
      this.statement = statement;
      this.length = length;
    },
    check: function(property){
      var value  = property.value();
      var min = this.length[0], max = this.length[1];
      var error = null;
      if (_.present(value)){
        if (max == 0 || value.length > max){
          error = {model: property, message: "has more than {0} {1}".plug(max, "character".cpluralize(max))};
        } else if (min == 0 || value.length < min){
          error = {model: property, message: "has fewer than {0} {1}".plug(min, "character".cpluralize(min))};
        }
      }
      return error;
    },
    serialize: function(){
      var that = this, tm = this.topic_map();
      return this.constraint = tm.constraint(that.type, {length: that.length}, function(c){
        tm.constrained_statement(c, that.statement);
      });
    }
  },{
    deserialize: function(constraint){
      var counterparts = constraint.roles().counterparts();
      var statement = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_statement');
      }).topic();
      var length = constraint.get('length');
      return new LengthConstraint(statement, length).source(constraint);;
    }
  });

  LengthConstraint.create = hasLength;

  _.extend(Topic.prototype, {
    length_constraint: hasLength,
    length_constraints: function(){
      return this.constraints('length_constraint');
    },
    lengths: function(value){
      return this.associates().type('length_constraint').values('length', value);
    }
  });

  return LengthConstraint;

});
