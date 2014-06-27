define(['query/property_query'], function(PropertyQuery){

  var NameQuery = PropertyQuery.extend({
    className: 'NameQuery'
  });
  NameQuery.prototype.base = NameQuery;

  return NameQuery;

});
