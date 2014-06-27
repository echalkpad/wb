define(['class', 'filtering'], function(Class, Filtering){

  var Comparisons = Filtering.Comparisons;
  var ParserFactory = Filtering.ParserFactory;
  var ComparerFactory = Filtering.ComparerFactory;

  var Query = Class.extend({
    className: 'Query',
    init: function(options){
      _.bindAll(this);
      options = _.defaults(options || {}, {filters: []});
      this._collection = options.collection; //DECIDE: consider using enumerator instead of collection.
      this._filters = options.filters;
      this._context = options.context;
      this._cache   = {};
    },
    collection: function(){
      var result = _.resolve(this._collection);
      if (!result) throw "collection not set";
      return result;
    },
    where: function(){
      return new this.base({collection: this._collection, filters: this._filters.concat(_.toArray(arguments)), context: this._context});
    },
    //TODO: distinctly mark foreign/native topics in the interface
    native: function(){
      var id = this._context.topic_map().id;
      return this.where(function(topic){
        return topic.topic_map_id() === id;
      });
    },
    foreign: function(){
      var id = this._context.topic_map().id;
      return this.where(function(topic){
        return topic.topic_map_id() !== id;
      });
    },
    less: function(){
      var excluded = _.toArray(arguments).flatten();
      return this.where(function(model){
        return !excluded.include(model);
      });
    },
    invalid: function(options){
      return this.where(function(model){
        return model.check(options).length > 0;
      });
    },
    check: function(options){
      return this.all()
        .map(function(model){
          return model.check(options);
        })
        .flatten()
        .compact();
    },
    get: function(id){
      var coll = this.collection();
      return coll.get ? coll.get(id) : this.detect(function(model){
        return model.id === id;
      });
    },
    ids: function(){
      return this.all().map(function(model){
        return model.get(model.idAttribute);
      });
    },
    count: function(){
      return this.all().length;
    },
    exists: function(){
      return !!this.one();
    },
    matches: function(item){
      return this._filters.all(function(matches){
        return matches(item);
      });
    },
    all: function(){
      var matches = _.bind(this.matches, this), collection = this.collection();
      return collection.select(matches);
    },
    one: function(){
      return this.detect(_.returnTrue);
    },
    detect: function(fn){
      var matches = _.bind(this.matches, this), fn = _.bind(fn, this), collection = this.collection();
      return collection.detect(function(item){
        return fn(item) && matches(item);
      });
    },
    toJSON: function(options){
      return this.map(function(item){
        return item.toJSON(options);
      });
    }
  },{
    Terminators: ['all' , 'map', 'select', 'reject'],
    Enumerables: ['each', 'map', 'select', 'reject', 'reduce', 'reduceRight', 'any', 'include', 'invoke', 'pluck', 'max', 'min', 'sortBy', 'groupBy'],
    Mixins: {
      Identified: {
        iid: function(iid_or_iids){
          var iids = _.multiple(iid_or_iids);
          var filter = iid_or_iids ? function(model){
            return model.iids().intersection(iids).length > 0;
          } : _.returnFalse;
          return this.where(filter);
        }
      },
      Tagged: {
        tag: function(options){
          var tags = extractIdentifiers(options, 'tag');
          var filter = tags.isEmpty() ? function(model){
            return model.tags().length === 0;
          } : function(model){
            return tags.all(function(tag){
              return model.tags().contains(tag);
            });
          };
          return this.where(filter);
        }
      },
      Scoped: {
        scope: function(options){
          var scopes = extractIdentifiers(options, 'scope');
          var filter = scopes.isEmpty() ? function(model){
            return model.scopes().length === 0;
          } : function(model){
            return scopes.all(function(scope){
              return model.scopes().contains(scope);
            });
          };
          return this.where(filter);
        }
      },
      Valued: {
        _datatype: function(type){ // cached datatype resolution
          if (!type) return 'String';
          if (!this._context.topic_map) return null;
          var tm = this._context.topic_map();
          var datatypes = this._cache.datatypes = this._cache.datatypes || {};
          var datatype = type ? (datatypes[type] || tm.datatype(type)) : null;
          datatype && (datatypes[type] = datatype);
          return datatype;
        },
        value: function(options){ //e.g. properties.value(30), properties.value('Dino'), properties.value({gt: 30}), properties.value({'>=': 30}), properties.value({eq: 'Dino'}), properties.value({between: [10, 30]});
          options = _.isObject(options) ? _.clone(options): {value: options};

          var ops = _.extract.apply(this, [options].concat(_.keys(Comparisons)).concat(['between'])); //deal with operations we understand...

          if (_.keys(options).length > 0) { //...and complain about operations we don't.
            console.log('unknown value filter operations', options);
            throw "unknown options passed to value filter";
          }

          if (_.values(ops).length === 0) return this

          var datatypes = _.bind(this._datatype, this);
          var value     = _.values(ops).first();
          var op        = _.keys(ops).first();
          var allowed   = Comparisons[op];
          var values    = ['in','between'].contains(op) ? value : [value];

          var lazyParse = _.once(function(parse){
            values = values.map(function(value){
              return parse(value);
            });
          });

          var filters   = { //special operations
            between: function(property){
              var datatype  = datatypes(property.type());
              var parse     = ParserFactory.get(datatype), compare = ComparerFactory.get(datatype);
              var propValue = parse(property.value());
              lazyParse(parse);
              return propValue >= values[0] && propValue <= values[1];
            }
          };

          var filter = filters[op] || function(property){ //standard operation
            var datatype  = datatypes(property.type());
            var parse     = ParserFactory.get(datatype), compare = ComparerFactory.get(datatype);
            var propValue = parse(property.value());
            lazyParse(parse);
            return values.any(function(value){ //works like an "in clause"
              var comparison = compare(value, propValue);
              var matches = allowed.contains(comparison);
              return matches;
            });
          };

          return this.where(filter);
        }
      },
      Typed: {
        isa: function(options){
          if (_.isUndefined(options)) return this;
          var types = extractIdentifiers(options, 'type');
          var filter = types.isEmpty() ? _.returnTrue : function(model){
            return types.all(function(type){
              return model.isa(type);
            });
          };
          return this.where(filter);
        },
        types: function(){
          return this
            .map(function(model){
              return model.types ? model.types() : model.type();
            })
            .flatten()
            .uniq();
        }
      }
    }
  });

  _.alias(Query.prototype, 'first', 'one');
  _.alias(Query.Mixins.Typed, 'type', 'isa');
  _.alias(Query.Mixins.Identified, 'identified', 'iid');
  _.extend(Query.prototype, Query.Mixins.Scoped, Query.Mixins.Typed, Query.Mixins.Tagged);

  //TODO: performance improvement on: any, include
  Query.Enumerables.each(function(method){
    Query.prototype[method] = function(){
      var results = this.all();
      return results[method].apply(results, _.toArray(arguments));
    };
  });

  Query.prototype.first = Query.prototype.one;
  Query.prototype.base = Query;

  var extractIdentifiers = function(values, key){
    var identifiers;
    var plural = (key || '').pluralize();
    if (values[key]){
      identifiers = extractIdentifiers(values[key]);
    } else if (values[plural]){
      identifiers = extractIdentifiers(values[plural]);
    } else if (_.isArray(values)) {
      identifiers = values;
    } else if (arguments.length === 0 || _.isUndefined(values)) {
      identifiers = [];
    } else {
      identifiers = [values];
    };
    return identifiers;
  };

  return Query;
});
