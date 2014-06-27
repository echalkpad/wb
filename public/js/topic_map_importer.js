define(['backbone'], function(Backbone){

  //TODO: convert to class (update view to see if instanceof)
  var importer = {
    import: function(text){
      var data = JSON.parse(text);
      this.trigger('import', data);
      return this;
    },
    url: function(){
      return 'topic_map_importer';
    }
  };

  _.extend(importer, Backbone.Events);

  return importer;

});
