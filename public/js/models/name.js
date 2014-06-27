if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['models/property', 'models/topic_map', 'models/topic', 'query/name_query'], function(Property, TopicMap, Topic, NameQuery){

  var Name = Property.extend({
    className: 'Name',
    defaults: {
      type: 'name',
      scopes: []
    },
    validate: function(attrs){
      attrs || (attrs = {});
      if (!_.isUndefined(attrs.value)){
        var value = attrs.value.trim();
        if (value.length === 0){
          return {attribute: "value", message: "must be present"};
        }
      }
    },
    toString: function(){
      return [this.type() || '?', this.value() || '?'].join(': ').enclose("name{","}");
    }
  },{
    checks: []
  });

  _.extend(TopicMap.prototype, {
    names: function(){
      var ids = this.domain_ids(); //TODO: fix: var ids = this.embedded_map_ids();
      return new NameQuery({collection: this.db().names, context: this}).where(function(name){
        return ids.include(name.topic_map().id);
      });
    }
  });

  _.extend(Topic.prototype, {
    names: function(){
      return new NameQuery({collection: this._names || [], context: this});
    },
    name: function(data, fn){
      var n = new Name(data, {parent: this}).bubbleEvents(this);
      this.db().names.add(n);
      fn && fn.call(n, n);
      n.isNew() && n.created();
      return n;
    },
    ranked_names: function(){
      var term = this.term();
      var types = term.suggested_name_types().map(function(type){
        return type.iids().first();
      });
      return this.names().all().sortBy(function(name){
        var idx = types.indexOf(name.type());
        return idx < 0 ? 999 : idx;
      });
    },
    default_name: function(){
      return this.ranked_names().first();
    }
  });

  _.aspects(Topic.prototype, {
    name: function($super, type, fn){
      if (_.isObject(type)) return $super.call(this, type, fn);
      if (type) return this.names().isa(type).first();
      var names = [this.names().first()].compact(); //TODO: fix performance of: this.ranked_names();
      return names.length > 0 ? names.first().value() : this.iids().first(); //TODO: should we be using iids?
    }
  });

  Name.Query = NameQuery;

  return Name;

});
