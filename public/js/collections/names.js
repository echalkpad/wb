define(['collections/properties', 'models/name'], function(Properties, Name){

  var Names = Properties.extend({
    model: Name,
    toJSON: function(options){
      return _.toJSON(this.reject(function(name){ //we don't persist blank names //TODO: this logic needs to go in the document toJSON method.
        return _.absent(name.value());
      }), options);
    }
  }).aspects({
    initialize: function($super, models, options){
      $super.call(this, models, options);
      var renamed = function(name){
        name.parent().trigger('renamed');
      };
      this.bind('add',renamed);
      this.bind('remove',renamed);
      this.bind('add',function(name){
        name.bind('change:value',renamed)
        name.bind('change:type',renamed)
      });
      this.bind('remove',function(name){
        name.trigger('removed'); //occurs after other remove events are handled
      });
      this.bind('add',function(name){
        name.trigger('added'); //occurs after other add events are handled
      });
    }
  });

  return Names;

});
