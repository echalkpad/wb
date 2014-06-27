if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['models/embedded_document', 'models/topic', 'models/topic_map', 'query/property_query'], function(EmbeddedDocument, Topic, TopicMap, PropertyQuery){

  var Property = EmbeddedDocument.extend({
    topic: function(){
      return this.parent();
    },
    toString: function(){
      var value = this.value();
      return this.type() + ': ' + (_.isNull(value) ? 'null' : value.toString());
    }
  }).aspects({
    initialize: function($super, attributes, options){
      _.bindAll(this, 'check', 'type', 'topic', 'isa', 'value');
      $super.call(this, attributes, options);

      var that = this, parent = this.parent(); //TODO: test parent

      var parentChanged = function(){
        parent //inform the topic of the change.
          .trigger('change:' + that.type())
          .trigger('change');
      };

      var triggerCheck = function(){
        that.trigger("check");
      };

      parent.bind("check", triggerCheck);
      this.bind("change", parentChanged); //TODO: this causes the parent to recheck the child again.  sound all right?
      this.bind("add"   , parentChanged);
      this.bind("remove", parentChanged);
      this.one("remove", function(){
        parent.unbind("check", triggerCheck);
        that.unbind();
      });
    }
  }).toystore()
    .list('scopes')
    .attribute('type')
    .attribute('value');

  _.extend(Topic.prototype, {
    properties: function(){
      var self = this;
      var collection = function(){
        var names = self.names().all();
        var occurrences = self.occurrences().all();
        return names.concat(occurrences);
      };
      return new PropertyQuery({collection: collection, context: this});
    },
    property: function(data, fn){
      return this[this.parent().property_method(data.type)](data, fn);
    }
  });

  _.extend(TopicMap.prototype, {
    properties: function(){
      var self = this;
      var ids = this.domain_ids(); //var ids = this.embedded_map_ids(); TODO: fix -- toystore implementation may be overwriting property that is implemented in TopicMap.
      var collection = function(){
        var names = self.names().all();
        var occurrences = self.occurrences().all();
        return names.concat(occurrences);
      };
      return new PropertyQuery({collection: collection, context: this}).where(function(property){
        return ids.include(property.topic_map().id);
      });
    }
  });

  return Property;

});
