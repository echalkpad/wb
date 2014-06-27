if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['models/document', 'query/topic_map_query', 'basic_types'], function(Document, TopicMapQuery, BasicTypes){

  var TopicMap = Document.extend({
    className: 'TopicMap',
    client: function(){
      return this.options ? this.options.client : null;
    },
    inspect: function(){
      return {topic_map: this};
    },
    glossary: function(type){
      return this.topics().scope('types').isa(type).all();
    },
    embed_map: function(topic_map){
      if (topic_map.id === this.id) throw new CannotSelfEmbedError();
      var ids = _.clone(this.get('embedded_map_ids')).give(topic_map.id);
      this.set({embedded_map_ids: ids});
      this.topic_maps().each(function(tm){
        tm.trigger('change:embedded');
      });
      return this;
    },
    embedded_maps: function(options){
      options = _.defaults(options || {}, {recurse: false});
      var self = this, tms = this.get('embedded_map_ids').map(function(id){
        return self.db().topic_maps.get(id);
      }).compact().map(function(m){
        return options.recurse == true ? [m, m.embedded_maps(options)] : m;
      }).flatten().compact().uniq();
      tms.and_self = function(){
        return this.concat(self);
      };
      return tms;
    },
    embedded_map_ids: function(options){
      options = _.defaults(options || {}, {recurse: false});
      return this.embedded_maps().and_self().map(function(tm){
        return tm.id;
      });
    },
    domain: function(){
      return this.embedded_maps({recurse: true}).and_self();
    },
    domain_ids: function(){
      return this.domain().map(function(tm){
        return tm.id;
      });
    },
    topic_maps: function(){
      var self = this;
      var collection = function(){
        return [self, self.embedded_maps()].flatten();
      };
      return new TopicMapQuery({collection: collection, context: this});
    },
    property_method: function(type){
      var term = this.term(type);
      return term.types().contains('name_type') ? 'name' : 'occurrence';
    },
    supertypes: function(type){
      var self  = this;
      var types = this.term(type, false)._types;
      var sts   = [];
      var recursed = [];
      types.each(function(t){
        sts = t.get('supertypes');
        recursed = sts.map(function(st){
          return self.supertypes(st);
        });
      });
      return sts.concat(recursed).flatten().compact();
    }
  }).aspects({
    initialize: function($super, attributes, options){
      _.bindAll(this, 'datatype', 'ready', 'topic', 'embed_map');

      $super.call(this, attributes, options);

      var client = this.client();
      var bubble = function(action, serialized, access){
        client.trigger(access, action, serialized, access);
      };

      this.bind('granted', bubble);
      this.bind('denied' , bubble);

      this.ready();
    },
    export: function(){
      var serialize = function(tm){
        return tm.toJSON({pure: true, include: ['topics', 'associations']});
      };
      var json = this.embedded_maps().map(serialize);
      json.unshift(serialize(this));
      return json;
    },
    toJSON: function($super, options){
      options = _.defaults(options || {}, {include: []});
      var topics = options.include.contains('topics'), associations = options.include.contains('associations');
      var json = $super.call(this, {include: []}); //TODO: fix so that include works properly HERE and needn't be extracted below
      topics       && (json.topics       = this.topics(options).toJSON());
      associations && (json.associations = this.associations(options).toJSON());
      return json;
    }
  }).toystore()
    .attribute('iri')
    .attribute('config')
    .list('embedded_map_ids', TopicMap)
    .embeddedList('topics')
    .embeddedList('associations')
    .stamps();

  BasicTypes.list.each(function(type){
    TopicMap.prototype[type.pluralize()] = function(){
      return this.types(type);
    };
    TopicMap.prototype[type] = function(object, fn){
      var attrs = {type: type};
      if (_.isString(object)) {
        attrs.iid = object;
      } else {
        _.each(object, function(name, iid){
          attrs.iid = iid;
          attrs.name = name;
        });
      }
      return this.topic(attrs, fn);
    };
  });

  TopicMap.Query = TopicMapQuery;

  var CannotSelfEmbedError = function() {
    this.message = "Cannot embed a map within itself.";
  }

  CannotSelfEmbedError.prototype = new Error;
  TopicMap.CannotSelfEmbedError = CannotSelfEmbedError;

  return TopicMap;
});
