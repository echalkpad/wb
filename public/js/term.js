define(['class', 'query/topic_query', 'models/topic_map', 'models/topic', 'mixins'], function(Class, TopicQuery, TopicMap, Topic, Mixins){

  //A term is an aggregate of topics (usually just 1) sharing a common iid but is represented as a single topic.  It's a proxy.
  var Term = Class.extend({
    init: function(){
      var that = this;
      this._types = _.toArray(arguments).flatten().uniq();
    },
    className: 'Term',
    isNative: function(tm){
      return tm ? this._types.any(function(topic){
        return topic.isNative(tm);
      }) : null;
    },
    isForeign: function(tm){
      return tm ? this._types.any(function(topic){
        return topic.isForeign(tm);
      }) : null;
    },
    default_name_type: function(){ //occurrence types have no corresponding method
      var name_type = this.suggested_name_types().first();
      return name_type ? name_type.iids().first() : null;
    },
    known: function(){
      return this.topics().count() > 0;
    },
    unknown: function(){
      return !this.known();
    },
    unambiguous: function(){ //exactly one definition
      return this.topics().count() === 1;
    },
    ambiguous: function(){ //multiple definitions
      return this.topics().count() > 1;
    },
    ids: function(){
      return this.topics().ids();
    },
    isa: function(t){
      return this.topics().isa(t).exists();
    },
    get: function(attr){
      return this.topics().map(function(type){
        return type.get(attr);
      }).compact();
    },
    url: function(){
      return 'topics/' + this.ids().join('+');
    },
    length: function(){
      var mins = [], maxs = [];
      this.topics().each(function(type){
        type.lengths().each(function(card){
          mins = mins.concat(card[0]);
          maxs = maxs.concat(card[1]);
        });
      });
      return [mins.min(), maxs.max()];
    },
    topics: function(){
      return new TopicQuery({collection: this._types, context: this});
    },
    names: function(){
      return this.topics().names();
    },
    occurrences: function(){
      return this.topics().occurrences();
    },
    associations: function(){
      return this.topics().associations();
    },
    roles: function(){
      return this.topics().roles();
    },
    toString: function(){
      return "Term[" + this.topics().map(function(type){
        return type.iids();
      }).flatten().join(', ') + "]";
    }
  },{
    aggregate: function(target_method_name, source_method_name){
      source_method_name = source_method_name || target_method_name;
      this.prototype[target_method_name] = function(){
        var args = _.toArray(arguments);
        return this.topics().map(function(type){
          return type[source_method_name].apply(type, args);
        }).flatten().uniq();
      };
      return this;
    },
    coalesce: function(method_name){
      this.prototype[method_name] = function(){
        var args = _.toArray(arguments);
        return this.topics().all().coalesce(function(type){
          return type[method_name].apply(type, args);
        });
      };
      return this;
    },
    suggested_types: function(model_type){
      var method = 'suggested_' + model_type + '_types';
      var constraints_method = 'topic_' + model_type + '_constraints';
      var type_property = model_type + '_type';
      this.prototype[method] = function(){
        var types = this.topics().all();
        var constraints = types.map(function(type){
          return type[constraints_method]().map(function(constraint){
            return _.extend([constraint], Mixins.Constraints).deserialize();
          });
        }).flatten();
        return constraints.sortBy(function(constraint, idx){ //first sort according to order created
          var oid = new ObjectId(constraint[type_property].id);
          return oid.timestamp.toString() + oid.increment.toString().lpad(3, '0');
        }).sortBy(function(constraint, idx){ //then sort required to the top
          return constraint.card[0] > 0 ? -1 : idx;
        }).map(function(constraint){
          return constraint[type_property];
        });
      };
    }
  });

  Term.suggested_types('name');
  Term.suggested_types('occurrence');

  ['iids','scopes', 'types', 'supertypes', 'choices', 'check', 'constraints', 'constrained_role_types', 'topic_property_constraints', 'constrained_property_types', 'constrained_name_types', 'constrained_occurrence_types', 'constrained_association_types'].each(function(method){
    Term.aggregate(method);
  });
  ['urls','topic_map_ids'].each(function(method){
    Term.aggregate(method, method.singularize());
  });
  ['datatype','name'].each(function(method){
    Term.coalesce(method);
  });

  var proto = Term.prototype;

  _.extendResult(proto, ['constraints', 'topic_property_constraints'], Mixins.promise('Constraints'));
  _.extendResult(proto, ['constrained_property_types', 'constrained_name_types', 'constrained_occurrence_types', 'constrained_association_types'], Mixins.promise('Topics'), Mixins.promise('Constraints'));

  //assume string if the datatype is unknown
  _.aspect(proto, 'datatype', function(fn){
    return fn.call(this) || 'String';
  });

  _.extend(TopicMap.prototype, {
    terms: function(type){
      var terms = {}, tm = this, iids = Object.keys(this.db().topics.indexes.iids || {});
      _.each(iids, function(iid){
        var term = tm.term(iid);
        if (term.known() && (!type || term.isa(type))){
          terms[iid] = term;
        }
      });
      return terms;
    },
    typed_terms: function(){
      var groupings = {topic_type: {}, name_type: {}, occurrence_type: {}, association_type: {}, role_type: {}};
      var terms = this.terms();
      _.each(terms, function(term, iid){
        term.types().each(function(type){
          if (groupings[type]){
            groupings[type][iid] = term;
          }
        });
      });
      return groupings;
    },
    types: function(type){
      return Object.keys(this.typed_terms()[type]);
    },
    type: function(iid, supertypes){
      return this.term(iid, supertypes)._types;
    },
    term: function(iid, supertypes){ //TODO: refactor so that we always fetch a term via topic_map().term(attr) and never by direct TermRequest instantiation.
      var tm = this, ids = [this.embedded_map_ids(), this.id].flatten(), iids = this.db().topics.indexes.iids || {};
      if (_.isUndefined(supertypes)) supertypes = true;
      var types = (iids[iid] || []).select(function(topic){
        return ids.contains(topic.topic_map_id());
      });
      if (supertypes) {
        types = types.concat(this.supertypes(iid).map(function(iid){
          return tm.term(iid, supertypes)._types;
        }).flatten().uniq());
      }
      return new Term(types);
    },
    datatype: function(attribute){ //TODO: obsolete/remove.
      return this.term(attribute).datatype();
    },
    seek: function(iid){ //NOTE: obsolete, former term method
      return new Term(this.topics().identified(iid).all());
    }
  });

  _.extend(Topic.prototype, {
    term: function(){
      var tm = this.topic_map();
      var types = this.all_types().map(function(type){
        return tm.type(type);
      }).flatten().uniq();
      return new Term(types);
    }
  });

  return Term;
});
