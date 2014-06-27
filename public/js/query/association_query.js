define(['query', 'query/role_query'], function(Query, RoleQuery){

  var AssociationQuery = Query.extend({
    className: 'AssociationQuery',
    roles: function(){
      var query = this;
      var roles = function(){
        return query.map(function(assoc){
          return assoc.roles().all();
        }).flatten();
      };
      return new RoleQuery({collection: roles, context: this});
    },
    plays: function(topic){
      return this.where(function(association){
        return association.plays(topic);
      });
    }
  });

  AssociationQuery.prototype.base = AssociationQuery;

  return AssociationQuery;
});
