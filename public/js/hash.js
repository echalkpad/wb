define(['class'], function(Class){

  var Hash = Class.extend({
    className: 'Hash',
    init: function(){
      _.bindAll(this);
      this._dict = [];
      var items = arguments.length === 1 ? arguments[0] : _.toArray(arguments);
      items.each(function(item){
        this.add(item.key, item.value);
      }, this)
    },
    cast: function(array){
      return new Hash(array);
    },
    validKey: function(key){ //override as necessary
      return true;
    },
    validValue: function(value){ //override as necessary
      return true;
    },
    validateKey: function(key){
      if (!this.validKey(key)) {
        this.trigger('invalid:key', key);
        throw "rejected hash key";
      }
    },
    validateValue: function(value){
      if (!this.validValue(value)) {
        this.trigger('invalid:value', value);
        throw "rejected hash value";
      }
    },
    index: function(key){
      this.validateKey(key);
      return this.keys().indexOf(key);
    },
    add: function(key, value, options){ //accepts fresh keys only
      options = options || {};
      this.validateKey(key); this.validateValue(value);
      var after = options.after, before = options.before, dict = this._dict, pos;
      var item = {key: key, value: value}, existing = this.item(key);
      if (existing){
        this.trigger('rejected', item, existing.value);
      } else if (after) {
        pos = this.index(after);
        pos > -1 ? dict.splice(pos + 1, 0, item) : dict.push(item);
        this.trigger('added', item, options);
      } else if (before) {
        pos = this.index(before);
        pos > -1 ? dict.splice(pos, 0, item) : dict.push(item);
        this.trigger('added', item, options);
      } else {
        dict.push(item);
        this.trigger('added', item, options);
      }
      return item;
    },
    put: function(key, value){ //accepts existing or fresh keys
      this.validateKey(key); this.validateValue(value);
      var item = {key: key, value: value}, existing = this.item(key), oldValue;
      if (existing){
        oldValue = existing.value;
        existing.value = value;
        this.trigger('changed', existing, oldValue);
      } else {
        this._dict.push(item);
        this.trigger('added', item);
      }
      return item;
    },
    get: function(key){
      this.validateKey(key);
      var item = this.item(key);
      return item ? item.value : null;
    },
    remove: function(key, options){
      options = _.defaults(options || {}, {clear: false});
      this.validateKey(key);
      var existing = this.item(key);
      if (existing) {
        this._dict.take(existing);
        this.trigger('removed', existing);
      } else {
        this.trigger('lost', key);
      }
      return existing ? existing.value : null;
    },
    item: function(key){
      this.validateKey(key);
      return this._dict.detect(function(item){
        return item.key === key;
      });
    },
    contains: function(key){
      this.validateKey(key);
      return this._dict.any(function(item){
        return item.key === key;
      });
    },
    keys: function(){
      return this._dict.map(function(item){
        return item.key;
      });
    },
    values: function(){
      return this._dict.map(function(item){
        return item.value;
      });
    },
    count: function(){
      return this._dict.length;
    },
    clear: function(options){
      options = _.defaults(options || {}, {clear: true});
      this._dict.slice(0).each(function(item){
        this.remove(item, options);
      }, this);
      this.trigger('cleared');
      return this;
    },
    each: function(fn, context){
      this._dict.each(function(item, idx){
        fn.call(this, item.key, item.value, idx);
      }, context || this);
      return this;
    },
    select: function(fn, context){
      return this.cast(this._dict.select(function(item, idx){
        return fn.call(this, item.key, item.value, idx);
      }, context || this));
    },
    reject: function(fn, context){
      return this.cast(this._dict.reject(function(item, idx){
        return fn.call(this, item.key, item.value, idx);
      }, context || this));
    },
    map: function(fn, context){
      return this._dict.map(function(item, idx){
        return fn.call(this, item.key, item.value, idx);
      }, context || this);
    }
  });

  _.extend(Hash.prototype, Backbone.Events);
  Hash.prototype.set   = Hash.prototype.put;
  Hash.prototype.fetch = Hash.prototype.get;
  Hash.prototype.has   = Hash.prototype.contains;

  return Hash;

});
