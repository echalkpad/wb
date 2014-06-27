define(['constraint', 'constraints', 'filtering', 'models/topic'], function(Constraint, Constraints, Filtering, Topic){

  var hasDatatype = function(dt){
    var ot = this;
    return new DatatypeConstraint(ot, dt).serialize();
  };

  var DatatypeConstraint = Constraints.DatatypeConstraint = Constraint.extend({
    init: function(occurrence_type, datatype){
      this._super(occurrence_type.topic_map());
      this.type = 'datatype_constraint';
      this.occurrence_type = occurrence_type;
      this.datatype = datatype;
    },
    check: function(occurrence){
      var parse  = Filtering.ParserFactory.get(this.datatype);
      var value  = occurrence.value();
      var parsed = parse(value)
      if (_.present(value) && (_.isUndefined(parsed) || _.isNaN(parsed))){
        return {model: occurrence, message: "value is improperly typed"};
      }
      return null;
    },
    serialize: function(){
      var that = this, tm = this.topic_map();
      return this.constraint = tm.constraint(that.type, {datatype: that.datatype}, function(c){
        tm.constrained_statement(c, that.occurrence_type);
      });
    }
  },{
    deserialize: function(constraint){
      var counterparts = constraint.roles().counterparts();
      var occurrence_type = counterparts.detect(function(role){
        return role.isa('constrained') && role.association().isa('constrained_statement');
      }).topic();
      var datatype = constraint.get('datatype');
      return new DatatypeConstraint(occurrence_type, datatype).source(constraint);
    }
  });

  DatatypeConstraint.create = hasDatatype;

  _.extend(Topic.prototype, {
    datatype_constraint: hasDatatype,
    datatype_constraints: function(){
      return this.constraints('datatype_constraint');
    },
    datatypes: function(value){
      return this.associates().type('datatype_constraint').values('datatype', value);
    },
    datatype: function(value){
      if (_.isUndefined(value)) {
        return this.datatypes().first(); //only one datatype makes sense
      } else {
        var updated = this.datatypes(value).length > 0;
        updated || this.datatype_constraint(value);
        return this;
      }
    }
  });

  return DatatypeConstraint;

});
