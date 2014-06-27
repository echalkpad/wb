define(['collections/properties', 'models/occurrence'], function(Properties, Occurrence){

  var Occurrences = Properties.extend({
    model: Occurrence
  });

  return Occurrences;

});
