define(['query/property_query'], function(PropertyQuery){

  var OccurrenceQuery = PropertyQuery.extend({
    className: 'OccurrenceQuery'
  });
  OccurrenceQuery.prototype.base = OccurrenceQuery;

  return OccurrenceQuery;

});
