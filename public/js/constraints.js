define(['models/topic', 'class', 'mixins'], function(Topic, Class, Mixins){

  var Constraints = {}; //TODO: drop global ns?

  _.extend(Topic.prototype, {
    constraints: function(){
      var types = _.toArray(arguments).flatten().compact();
      var topics = this.roles().counterparts().select(function(role){
          return role.get('scopes').contains('constraints') && role.isa('constraint');
        }).map(function(constraint){
          return constraint.topic();
        });
      return types.length == 0 ? topics : topics.select(function(constraint){
        return types.any(function(type){
          return constraint.isa(type);
        });
      });
    },
    constraint: function(){
      var args = _.toArray(arguments);
      var type = args.shift();
      var create = Constraints[type.classify()].create;
      return create.apply(this, args);
    },
    checkTypes: function(){
      return this.all_types(false);
    }
  });

  _.extendResult(Topic.prototype, 'constraints', Mixins.promise('Topics'), Mixins.promise('Constraints'));

  return Constraints;

});
