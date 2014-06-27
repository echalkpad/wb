define(['constraint', 'constraints', 'models/topic'], function(Constraint, Constraints, Topic){

  var hasChoices = function(choices){
    var st = this;
    return new ChoiceConstraint(st, choices).serialize();
  };

  var ChoiceConstraint = Constraints.ChoiceConstraint = Constraint.extend({ //TODO: eliminate Constraints ns?
    init: function(statement, choices){
      this._super(statement.topic_map());
      this.type = 'choice_constraint';
      this.statement = statement;
      this.choices = choices;
    },
    check: function(occurrence){
      var value = occurrence.value();
      var error = null;
      if (_.present(value) && !this.choices.contains(value)){
        error = {model: occurrence, message: "not a valid choice"};
      }
      return error;
    },
    serialize: function(){
      var that = this, tm = this.topic_map();
      return this.constraint = tm.constraint(that.type, {choices: that.choices}, function(c){
        tm.constrained_statement(c, that.statement);
      });
    }
  },{
    deserialize: function(constraint){
      var counterparts = constraint.roles().counterparts();
      var statement = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_statement');
      }).topic();
      var choices = constraint.get('choices');
      return new ChoiceConstraint(statement, choices).source(constraint);;
    }
  });

  ChoiceConstraint.create = hasChoices;

  _.extend(Topic.prototype, {
    choice_constraint: hasChoices,
    choice_constraints: function(){
      return this.constraints('choice_constraint');
    },
    choices: function(value){
      return this.associates().type('choice_constraint').values('choice', value); //TODO: test - I doubt this will work since this doesn't follow the pattern.
    }
  });

  return ChoiceConstraint;

});
