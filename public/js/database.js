define(['class', 'backbone', 'models', 'collections'], function(Class, Backbone, Models, Collections){

  var collections = ['topic_maps', 'topics', 'names', 'occurrences', 'associations', 'roles'].map(function(key){
    var type = Models[key.classify()];
    var collection = Collections[key.classify().pluralize()];
    var query = type.Query;
    return {key: key, type: type, collection: collection, query: query};
  });

  var Database = Class.extend({
    init: function(){
      var db = this;
      collections.each(function(item){
        this[item.key] = new item.collection([]);
      }, this);
      this.topic_maps.bind('add', function(tm, models, options){
        tm.bind("revise", function(type, action, model){
          db.trigger("revise", type, action, model);
        });
      });
    },
    each: function(fn){
      collections.each(function(item){
        fn.call(this[item.key], this[item.key], item.key);
      }, this);
    }
  },{
    collections: collections
  });

  _.extend(Database.prototype, Backbone.Events);

  return Database;

});
