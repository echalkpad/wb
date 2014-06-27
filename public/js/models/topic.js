if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['models/document', 'models/topic_map', 'query/topic_query', 'basic_types', 'mixins'], function(Document, TopicMap, TopicQuery, BasicTypes, Mixins){

  var Topic = Document.extend({
    className: 'Topic',
    url: function(){
      return 'topics/' + this.id;
    },
    clone: function(options){
      options = _.defaults(options || {}, {silent: false}); //SOMEDAY: add associations option?
      var source = this;
      var tm = this.topic_map();
      var attributes = _.clone(this.attributes); attributes.source_id = attributes.id;
      delete attributes.id; delete attributes.created_at; delete attributes.creator_id; delete attributes.updated_at; delete attributes.updater_id;
      var embedded_lists = this.constructor.embeddedLists;
      embedded_lists.each(function(list){
        attributes[list] = source[list]().map(function(item){
          return _.tap(item.toJSON(), function(json){
            delete json.id; //allow original ids to be generated
          });
        });
      });
      var clone = tm.topic(attributes);
      options.silent || this.trigger('clone', clone, source);
      return clone;
    },
    topic: function(){ //as possible, allow both docs/embedded docs to return their topic
      return this;
    },
    inspect: function(){ //TODO: do away with this in favor of a command-line command.
      return {topic: this, associations: this.associations().all()};
    },
    isBasicType: function(){
      return BasicTypes.check(this.types());
    },
    constrained_property_types: function(){
      return this.constrained_name_types().concat(this.constrained_occurrence_types());
    },
    isNative: function(tm){
      return tm ? this.topic_map_id() === tm.id : null;
    },
    isForeign: function(tm){
      return tm ? this.topic_map_id() !== tm.id : null;
    },
    counterparts: function() {
      return this.roles().counterparts();
    },
    associates: function(){
      var self = this;
      var collection = function(){
        return self.counterparts().topics().all();
      };
      return new TopicQuery({collection: collection, context: self});
    },
    associated: function(){
      return !this.isolated();
    },
    isolated: function() {
      return this.associates().count() === 0;
    },
    stranded: function(){ //TODO: hit db (if necessary) to see if we're stranded.
      return this.isNew() && this.isolated();
    },
    standard_properties: function(){ //properties defined by the ontology
      return this.term().constrained_property_types().invoke('iids').flatten();
    },
    custom_properties: function(){ //properties not defined by the ontology
      return _.difference(this.assigned_properties(), this.standard_properties());
    },
    required_properties: function(){
      return this.filter_properties(function(constraint){
        return constraint.card.first() > 0;
      });
    },
    optional_properties: function(){
      return this.filter_properties(function(constraint){
        return constraint.card.first() === 0;
      });
    },
    multi_properties: function(){
      return this.filter_properties(function(constraint){
        return constraint.card.last() > 1;
      });
    },
    suggested_properties: function(){
      return _.difference(this.standard_properties(), this.assigned_properties());
    },
    assigned_properties: function(){ //currently set properties
      return this.properties().invoke('type').flatten().uniq();
    },
    all_properties: function(){
      return _.union(this.standard_properties(), this.custom_properties());
    },
    filter_properties: function(fn){
      return this.term()
        .constraints('topic_name_constraint','topic_occurrence_constraint')
        .deserialize()
        .select(fn)
        .map(function(constraint){
          return (constraint.name_type || constraint.occurrence_type).iids();
        })
        .flatten();
    },
    property_type: function(property){
      return this.topic_map().term(property).types().contains('name_type') ? 'name' : 'occurrence';
    },
    defaults: {
      topic_map_id: null //assigned during add to collection
    },
    isa: function(type){
      return this.all_types().contains(type);
    },
    values: function(type){
      return this.properties().isa(type).values();
    },
    value: function(type){
      var vals = this.values(type);
      vals.push(null);
      return vals.first();
    },
    all_types: function(supertypes){
      return this.labeled_types(supertypes).map(function(info){return info.type}).uniq();
    },
    labeled_types: function(types){ //array or bool
      if (_.isBoolean(types)) {
        types = _.clone(Topic.Types).without(types ? '' :'super');
      } else {
        types = types || Topic.Types;
      };
      var fetch = {topic: types.include('topic'), role: types.include('role'), basic: types.include('basic'), 'super': types.include('super')};
      var fetched = {topic: [], role: [], basic: [], 'super': []};
      if (fetch['basic']) fetched['basic'] = this.basic_types().sort();
      if (fetch['topic'] || fetch['super']) fetched['topic'] = this.topic_types().sort();
      if (fetch['super']) fetched['super'] = this.super_types(fetched['role'].concat(fetched['topic'])).sort();
      if (fetch['role' ] || fetch['super']) fetched['role' ] = this.role_types().sort();

      return Topic.Types.map(function(label){
        return fetch[label] ? fetched[label].map(function(type){return {type: type, label: label};}) : [];
      }).flatten().compact(); //TODO: consider grouping by label.
    },
    basic_type: function(){ //TODO: enforce hard validation that a topic has only one basic type
      return this.basic_types().first();
    },
    basic_types: function(){
      return this.types(function(basic){return basic;});
    },
    topic_types: function(){
      return this.types(function(basic){return !basic;});
    },
    super_types: function(source_types){ //TODO: pass in types to avoid extra hits;
      source_types = source_types || this.topic_types().concat(this.role_types());
      var tm = this.topic_map();
      return source_types
        .map(function(type){
          return tm.supertypes(type);
        })
        .flatten()
        .uniq();
    },
    //TODO: I'm seriously questioning if we ever validate Backbone style.  Failed Backbone validations block us from updating models in the client.  I just want to block persistence at the server.
    //Rather just validate the integrity of the topic, that it has its various parts and they're all properly typed.
    //Put this at the document level.
    /*
    validate: function(attrs){
      attrs || (attrs = {});
      var tm = this.topic_map(), proposed = _.extend(_.clone(this.attributes), _.clone(attrs));
    }, */
    toString: function(){
      return [this.types().join(', '), [this.name(), '?'].coalesce()].compact().join(': ').enclose("topic{","}");
    }
  },{
    checks: [ //TODO: flag error severity so that certain severities will not be persisted.
      function(options){
        if (this.supertypes().length > 0 && !this.isBasicType()) {
          return {attribute: "supertypes", message: "valid only on basic types"};
        }
      },
      function(options){
        if (this.iids().length == 0 && this.isBasicType()) {
          return {attribute: "iids", message: "a type must have an identifier"};
        }
      },
      function(options){
        var result = this.name_types().map(function(nt){
          var names = this.values(nt), duplicates = names.uniq().length < names.length;
          if (duplicates)
            return {name_type: nt, message: "duplicate names"};
        }, this).compact().first();
        return result;
      }
    ]
  }).aspects({
    preinitialize: function($super, attributes, options){
      $super.call(this, attributes, options);
      this._associations = []; //internal use only.  not persistable.  may sometimes be temporarily out of sync.
    },
    initialize: function($super, attributes, options){
      _.bindAll(this, 'occurrence', 'name', 'check');

      $super.call(this, attributes, options);

      var tm = this.topic_map(), topic = this;

      tm.ready(function(){
        //topic.bind("add", function(){
        //  topic.setDefault('topic_map_id', function(){return tm.get('id');});
        //});
        topic.bind("change", function(){
          topic.check().publish();
        });
        topic.bind("change:iids", function(){
          topic.trigger("renamed");
        });
        topic.bind("change:types", function(){
          topic.trigger("retyped");
        });
        topic.bind("change", function(){
          tm.trigger("revise", "topic", "update", topic);
        });
        topic.bind("add", function(){
          tm.trigger("revise", "topic", "insert", topic);
        });
        topic.bind("remove", function(){
          tm.trigger("revise", "topic", "delete", topic);
        });
        topic.bind("associated", function(){
          topic.trigger('change');
        });
        topic.bind("dissociated", function(){
          topic.trigger('change');
        });
      });

      this.ready();
    }
  }).toystore()
    .attribute('topic_map_id', {readonly: true})
    .list('types')
    .list('iids', {label: 'Item Identifiers'})
    .list('supertypes')
    .list('scopes')
    .embeddedList('names')
    .embeddedList('occurrences')
    .stamps()
    .setter('name', function(value){
       this.name({value: value});
    })
    .setter('datatype', function(value){
      this.datatype(value);
    });

  _.using(Topic.prototype, function(proto){
    ['name', 'occurrence', 'association', 'role'].each(function(type){
      var types = type.pluralize();
      proto[type + '_types'] = function(){
        return this[types]().types();
      };
    });
  });

  _.aspect(Topic.prototype, 'types', function($super, types){
    var result;
    if (_.isFunction(types)) {
      var fn = types;
      result = $super.call(this).filter(function(type){
        return fn(BasicTypes.check(type));
      });
    } else {
      result = $super.call(this, types);
    }
    return result;
  });

  _.extend(TopicMap.prototype, {
    topics: function(options){
      options = _.defaults(options || {}, {pure: false});
      var self = this;
      var collection = options.pure ? function(){
        return self._topics;
      } : function(){
        return self.embedded_maps().and_self().map(function(tm){
          return tm._topics;
        }).flatten();
      };
      return new TopicQuery({collection: collection, context: this});
    },
    topic: function(data, fn){
      data = _.defaults(data, {topic_map_id: this.id});
      var t = new Topic(data, {parent: this}).bubbleEvents(this);
      this.db().topics.add(t);
      fn && fn.call(t, t);
      t.isNew() && t.created();
      return t;
    }
  });

  Topic.Types = ['basic','topic','super','role'];
  Topic.Query = TopicQuery;

  return Topic;

});
