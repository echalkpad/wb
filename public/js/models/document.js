if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['backbone', 'term_request', 'check', 'toystore'], function(Backbone, TermRequest, Check){

  var Document = Backbone.Model.extend({
    preinitialize: function(attributes, options){
      options = options || {};
      _.defaults(attributes, this.constructor.defaults());
      _.bindAll(this, "pluckAttribute");
      this.options = options;
      this._inDatastore = !!attributes.id; attributes.id = attributes.id || this.seedId(); //generate our permanent id client-side
      this.id || (this.id = attributes.id);
      this._preinitialized = true;
    },
    isNew: function(){
      return !this._inDatastore;
    },
    initialize: function(attributes, options){
      this.bind("error", _.monitorCallback);
      this._initialized = true;
    },
    bubbleEvents: function(parent){
      if (Document.bubbleEvents) {
        var prefix = this.className.toLowerCase();
        _.bubbleEvents(this, parent, prefix);
      }
      return this;
    },
    types: function(){
      return [this.type()];
    },
    created: function(){ //override with actual implementation
      return this;
    },
    url: function(){
      return this.className.pluralize().underscore() + '/' + this.id;
    },
    ready: function(fn, context){
      if (fn) {
        context || (context = this);
        fn = _.bind(fn, context);
        if (this.readied) {
          fn();
        } else {
          this.one("ready", fn);
        }
      } else {
        this.readied = true;
        this.trigger('ready');
      }
      return this;
    },
    isa: function(type){
      return this.type() === type;
    },
    term: function(){
      return this.topic_map().term(this.type());
    },
    constraints: function(type){
      return this.term().constraints(type);
    },
    client: function(){
      return this._client = this._client || this.topic_map().client();
    },
    parent: function(){
      return this.options && this.options.parent ? this.options.parent : null;
    },
    parents: function(){
      var list = [];
      var self = this, pointer = this;
      while(pointer.parent && pointer.parent()){
        pointer = pointer.parent();
        list.push(pointer);
      }
      list.and_self = function(){
        this.unshift(self);
        return this;
      };
      return list;
    },
    root: function(){
      var pointer = this;
      while(pointer.parent && pointer.parent())
        pointer = pointer.parent();
      return pointer;
    },
    topic_map: function(){
      return this._tm = this._tm || this.root();
    },
    checkTypes: function(){ //TODO: consider that even name/occurrence types may be supertyped. i.e. all models return "types".
      return _.array(this.type());
    },
    check: function(options){ //TODO: implement the various layers of contraint checking as aspects?
      options = _.defaults(options || {}, {include: this.constructor.embeddedLists, silent: false});

      var tm = this.topic_map();

      if (!tm || options.silent)
        return [];

      if (options instanceof Backbone.Model)
        throw "cannot handle model check like a constraint check";

      var that   = this,
          checks = (this.checks || []).concat(this.constructor.checks || []).flatten().compact(),
          types  = this.checkTypes(),
          errors = [];

      //constraint checks
      errors.push(types
        .map(function(type){
          return tm.term(type);
        })
        .map(function(term){
          return term.constraints().deserialize().check(that);
        }));

      //model checks
      errors.push(checks
        .map(function(check){
          return (check instanceof Check) ? check.check : check;
        })
        .map(function(check){
          return check.call(that, options);
        }));

      //nested model checks
      errors.push(options.include.select(function(key){
          return that[key];
        }).map(function(key){
          return that[key].call(that).check(options);
        }));
      errors = errors.flatten().compact();

      errors.publish = function(){
        that.trigger("check", errors);
        _.each(errors, function(error){
          var model = error.model || this;
          if (error.attribute) model.trigger("error:" + error.attribute, model, error, options);
          model.trigger("error", model, error, options);
        }, that);
        return errors;
      };

      return errors;
    },
    seedId: function(){
      return new ObjectId().toString();
    },
    pluckAttribute: function(name, fn){
      var value = this.get(name);  this.unset(name, {silent: true});
      fn && fn.call(this, value);
      return value;
    },
    attr: function(object, options) {
      return _.isString(object) ? this.get(object) : this.set(object, options);
    },
    revise: function(attr, fn) { //useful for revising just part of a cardinality constraint;
      var value = this.get(attr);
      var revised = fn.call(this, value);
      return this.set(attr, revised);
    },
    _pluckEmbeddedLists: function(attrs){
      var lists = {};
      _.each(attrs, function(value, attr){
        if (this.isEmbeddedList(attr)) {
          lists[attr] = attrs[attr]; delete attrs[attr];
        }
      }, this);
      return lists;
    },
    _pluckProperties: function(attrs){
      var props = {};
      if (this.topic_map()) {
        _.each(attrs, function(value, attr){
          if (this.isProperty(attr)) {
            props[attr] = attrs[attr]; delete attrs[attr];
          }
        }, this);
      }
      return props;
    },
    isProperty: function(attr){
      var attributes = this.constructor.attributes.concat(this.constructor.lists);
      return attributes.length > 0 && !_.contains(attributes, attr);
    },
    isEmbeddedList: function(attr){
      return _.contains(this.constructor.embeddedLists, attr);
    },
    prop: function(object, options) {
      return _.isString(object) ? this._getProperty(object) : this._setProperties(object, options);
    },
    _getProperty: function(attr) {
      var r = new TermRequest(this.topic_map(), attr);
      var query = this[r.methods].call(this);
      var items = query.type(r.attribute).all();
      if (!r.wantsArray()){
        while(items.length > 1){
          items.pop();
        }
      }
      var values = _.map(items, function(c){
        return c.value();
      });
      var value = r.wantsArray() ? values : _.first(values);
      /* console.log('getting', {type: attr, value: value, getRequest: r}); */
      return value;
    },
    _setProperties: function(attrs, options) {
      options = _.defaults(options || {}, {replace: true});
      _.each(attrs, function(value, attr){
        var r = new TermRequest(this.topic_map(), attr);
        var build = this[r.method];
        if (!build) return;
        build = _.bind(build, this);
        if (options.replace) { //drop old values?
          this[r.methods]().type(r.attribute).each(function(item){
            item.detach();
          });
        }
        var values = r.wantsArray() ? value : [value];
        _.each(values, function(value) {
          var parsed = r.parse(value);
          if (_.isUndefined(parsed)){ //unparsable
            parsed = value; //store the value -- allow constraint to flag bad values.
          }
          build({type: r.attribute, value: parsed});
        }, this);
        /* console.log('setting', {type: r.attribute, value: value, setRequest: r}); */
      }, this);
      return this;
    },
    prevAttributes: function(){
      var model = this;
      var obj = {};
      for(attr in model.changedAttributes()){
        obj[attr] = model.previous(attr);
      }
      return obj;
    },
    stringifyAttributes: function(){
      var output = [];
      var model = this;
      for(attr in model.attributes){
        output.push(attr + ' = ' + (model.get(attr) || '').toString());
      }
      return output.join("\n");
    },
    detach: function(options){
      options = _.defaults(options || {}, {dissolve: false});
      this.collection.remove(this, options);
      return this;
    },
    isLoaded: function(){
      var id = this.topic_map().id;
      return !!this.client().db.topic_maps.get(id);
    },
    type: function(type){
      if (_.present(type)){
        this.set({type: type});
      }
      return this.get('type');
    },
    toJSON: function(options){
      var doc = this, include = this.constructor.embeddedLists || [];
      options = _.defaults(options || {}, {include: include});
      var json = _.clone(this.attributes);
      options.include.each(function(children){
        doc[children] && (json[children] = doc[children]().map(function(child){
          return child.toJSON(options);
        }));
      });
      return json;
    },
    setDefault: function(attr, value){
      var current = this.get(attr);
      var notSet = _.isUndefined(current) || _.isNull(current);
      notSet && this.set(_.roll(attr, _.resolve(value)), {silent: true});
      return this;
    },
    setDefaults: function(defaults){
      var model = this;
      _.each(defaults,function(value, key){
        model.setDefault(key, value);
      });
    }
  },{
    defaults: function(){
      var result = {};
      _.each(this.attributes, function(attribute){
        result[attribute] = null;
      }, this);
      _.each(this.lists, function(list){
        result[list] = [];
      }, this);
      return result;
    }
  }).aspects({
    get: function($super, attr){
      return this.isProperty(attr) ? this._getProperty(attr) : $super.call(this, attr);
    },
    set: function($super, attrs, options){
      var that = this, options = _.defaults(options || {}, {silent: false});
      var embeddedLists = this._pluckEmbeddedLists(attrs);

      _.each(this.constructor.embeddedLists, function(name){
        var bucketKey = '_' + name.pluralize();
        this[bucketKey] || (this[bucketKey] = []);
      }, this);

      _.each(this.constructor.lists, function(list){
        var attr = list.singularize();
        if (attrs[attr]) {
          attrs[list] || (attrs[list] = []);
          attrs[list].push(attrs[attr]);
          delete attrs[attr];
        }
      });

      var setters = _.map(this.constructor.setters || {}, function(fn, name){
        if (!attrs[name]) return null;
        var value = attrs[name];
        var set = function(){
          fn.call(that, value);
        };
        delete attrs[name]; //remove setter from attributes
        return set;
      }).compact();

      var props = this._pluckProperties(attrs);

      var result = $super.call(this, attrs, options);

      this._setProperties(props, options);

      setters.each(function(set){
        set();
      });

      _.each(this.constructor.embeddedLists, function(name){
        var items = embeddedLists[name] || [], add = _.bind(that[name.singularize()], that);
        items.each(function(item){
          add(item);
        });
      }, this);

      return result;
    }
  }).aspects({ // autocorrect arguments: I was causing bugs by sometimes writing "model.set('age', 21)" and not "model.set({age: 21})".
    set: function($super, attrs, options){
      if (_.isString(attrs)) {
        var args = _.toArray(arguments); args.shift();
        options = _.isObject(args.last()) && !_.isArray(args.last()) ? args.pop() : {};
        attrs = _.roll(args);
      }
      return $super.call(this, attrs, options);
    }
  });

  Document.EmbeddedTypes = {};
  Document.bubbleEvents = true;

  return Document;

});
