if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['models/document'], function(Document){

  var EmbeddedDocument = Document.extend({});

  return EmbeddedDocument;

});
