define(['constraint', 'constraints', 'models/topic'], function(Constraint, Constraints, Topic){

  var hasFormat = function(regexp){
    var st = this;
    return new RegularExpressionConstraint(st, regexp).serialize();
  };

  //TODO: define constraints using a factory so that we can register at same time?
  var RegularExpressionConstraint = Constraints.RegularExpressionConstraint = Constraint.extend({
    init: function(statement, regexp){
      this._super(statement.topic_map());
      this.type = 'regular_expression_constraint';
      this.statement = statement;
      this.regexp = regexp;
    },
    check: function(occurrence){
      var value  = occurrence.value();
      var format = new RegExp(this.regexp);
      var error  = null;
      if (_.present(value) && !format.test(value)){
        error = {model: occurrence, message: "not a valid format"};
      }
      return error;
    },
    serialize: function(){
      var that = this, tm = this.topic_map();
      return this.constraint = tm.constraint(that.type, {regexp: that.regexp}, function(c){
        tm.constrained_statement(c, that.statement);
      });
    }
  },{
    deserialize: function(constraint){
      var counterparts = constraint.roles().counterparts();
      var statement = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_statement');
      }).topic();
      var regexp = constraint.get('regexp');
      return new RegularExpressionConstraint(statement, regexp).source(constraint);
    }
  });

  RegularExpressionConstraint.create = hasFormat;

  _.extend(Topic.prototype, {
    regular_expression_constraint: hasFormat,
    regular_expression_constraints: function(){
      return this.constraints('regular_expression_constraint');
    },
    formats: function(value){
      return this.associates().type('regular_expression_constraint').values('regexp', value);
    },
    format: function(value){
      if (_.isUndefined(value)) {
        return this.formats().first(); //only one format makes sense
      } else {
        var updated = this.formats(value).length > 0;
        updated || this.regular_expression_constraint(value);
        return this;
      }
    }
  });

  return RegularExpressionConstraint;

});
