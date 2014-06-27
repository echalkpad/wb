define(['mixins'], function(Mixins){

  var Roles = Mixins.Roles = {
    topics: function(){
      return this
        .map(function(role){
          return role.topic();
        });
    },
    counterparts: function(){
      return this
        .map(function(role){
          return role.counterparts();
        })
        .flatten();
    }
  };

  _.extendResult(Roles, 'topics'      , Mixins.promise('Typed'));
  _.extendResult(Roles, 'counterparts', Mixins.promise('Typed'), Mixins.promise('Roles'));

  return Roles;

});
