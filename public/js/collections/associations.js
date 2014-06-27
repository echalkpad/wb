define(['collections/documents', 'models/association'], function(Documents, Association){

  var Associations = Documents.extend({
    model: Association,
    comparator: function(association) {
      return association.type();
    }
  });

  return Associations;

});
