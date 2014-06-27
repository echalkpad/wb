define(['backbone', 'models/document'], function(Backbone, Document){

  var Documents = Backbone.Collection.extend({
    model: Document,
    initialize: function(models, options){
      var collection = this, lists = this.model.lists, indexes = collection.indexes = {};
      this.options = options;

      lists.each(function(list){

        var itemName     = list.singularize();
        var changeEvent  = "change:" + list;
        var addedEvent   = "item-added:" + itemName;
        var removedEvent = "item-removed:" + itemName;
        var index        = indexes[list] = {};

        var itemRegister = function(item, model){
          index[item] || (index[item] = []);
          index[item].give(model);
        };
        var itemUnregister = function(item, model){
          index[item].take(model);
          if (index[item].length === 0){
            delete index[item];
          }
        };
        var itemsRegister = function(model){
          model[list] && model[list]().each(function(item){
            itemRegister(item, model);
          });
        };
        var itemsUnregister = function(model){
          model[list] && model[list]().each(function(item){
            itemUnregister(item, model);
          });
        };

        collection.bind(changeEvent, function(model){ //TODO: bind at tm level? that is: reduce overall subscribers?
          var current  = model.attributes[list];
          var previous = model._previousAttributes[list] || [];
          var added    = current.difference(previous);
          var removed  = previous.difference(current);
          added.each(function(item){
            model.trigger(addedEvent, item, model);
          });
          removed.each(function(item){
            model.trigger(removedEvent, item, model);
          });
        });

        collection.bind("add", itemsRegister);
        collection.bind("remove", itemsUnregister);
        collection.bind(addedEvent, itemRegister);
        collection.bind(removedEvent, itemUnregister);
      });

      var childType = this.model.prototype.className.underscored();
      var childTypes = childType.pluralize();
      var bucketKey = '_' + childTypes;
      this.bind('add', function(model, models, options){
        var parent  = model.parent(); if (!parent) return;
        //var related = parent.related || (parent.related = {});
        //related[childTypes] = related[childTypes] || (related[childTypes] = []);
        //var children = parent[bucketKey] = related[childTypes];
        var children = parent[bucketKey] || (parent[bucketKey] = []);
        children.give(model);
        model.type && parent.trigger('add-child:' + childType + ':' + model.type(), model);
        parent.trigger('add-child:' + childType, model);
        parent.trigger('add-child', model);
        parent.trigger('change');
      });
      this.bind('remove', function(model, models, options){
        var parent = model.parent(); if (!parent) return;
        var children = parent[bucketKey];
        children.take(model);
        model.type && parent.trigger('remove-child:' + childType + ':' + model.type(), model);
        parent.trigger('remove-child:' + childType, model);
        parent.trigger('remove-child', model);
        parent.trigger('change');
      });
    },
    client: function(){
      return this.options.client;
    },
    query: function(){
      var TypedQuery = this.model.Query;
      return new TypedQuery({collection: this.models, context: this.client()});
    }
  });

  return Documents;
});
