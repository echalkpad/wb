define(['collections/documents', 'models/topic'], function(Documents, Topic){

  var Topics = Documents.extend({
    model: Topic
  });

  return Topics;

});
