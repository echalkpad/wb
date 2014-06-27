define(['class','backbone'], function(Class, Backbone){

  //TODO: option for whether to add to head or tail of list
  //TODO: bubble item events?
  //TODO: integrate underscore array methods?
  var List = Class.extend({
    className: 'List',
    init: function(items){
      _.bindAll(this);
      this._items = items || [];
      this._validators = [];
      var self = this;
      this.flat = _.once(function(){ //allow this list to flatten add args: e.g. var list = new List().flat();
        self.add = _.wrap(self.add, function() {
          var args = _.toArray(arguments);
          var add = args.shift();
          return add.apply(self, args.flatten());
        });
        self.remove = _.wrap(self.remove, function() {
          var args = _.toArray(arguments);
          var remove = args.shift();
          return remove.apply(self, args.flatten());
        });
        return self;
      });
    },
    cast: function(items){ //TODO: this cast nonsense is only necessary because I'm wrapping arrays.  Let's just beef up the regular array.
      return new List(items);
    },
    toArray: function(){
      return this._items.concat();
    },
    validates: function(validate){
      this._validators.push(_.bind(validate, this));
      return this;
    },
    accepts: function(item){
      return this._validators.all(function(validate){
        return validate(item);
      });
    },
    indexOf: function(item){
      return this._items.indexOf(item);
    },
    at: function(idx){
      return this._items[idx];
    },
    adjacent: function(item){
      var idx = this.index(item);
      var before = idx > 0 ? this._items[idx - 1] : null;
      var after = idx < this._items.length ? this._items[idx + 1] : null;
      return {
        before: before,
        after: after
      }
    },
    add: function(){
      var items = _.toArray(arguments);
      items.each(function(item){
        if (this.accepts(item)){
          this._items.push(item);
          this.trigger('added', item);
        } else {
          this.trigger('rejected', item);
        }
      }, this);
      return this;
    },
    remove: function(){
      var items = _.toArray(arguments);
      return remove.call(this, items, {clear: false});
    },
    isolate: function(item){
      var self = this;
      var isolated = this._items.length === 1 && this._items[0] === item;
      if (isolated) {
        this.trigger('already-isolated', item);
      } else {
        this._items.reject(function(i){
          return item === i;
        }).each(function(i){
          self.remove(i);
        });
        this.trigger('isolated', item);
      }
      return item;
    },
    contains: function(item){
      return this._items.contains(item);
    },
    count: function(){
      return this._items.length;
    },
    concat: function(list){
      return this.cast(this._items.concat(list._items));
    },
    isEmpty: function(){
      return this.count() === 0;
    },
    groupBy: function(fn){
      return this._items.groupBy(fn);
    },
    all: function(){
      return this.cast(this._items);
    },
    each: function(fn){
      return this._items.each(fn, this);
    },
    map: function(fn){
      return this._items.map(fn, this);
    },
    sortBy: function(fn){
      return this.cast(this._items.sortBy(fn, this));
    },
    select: function(fn){
      return this._items.select(fn, this);
    },
    reject: function(fn){
      return this.cast(this._items.reject(fn, this));
    },
    detect: function(fn){
      return this._items.detect(fn, this);
    },
    reverse: function(){
      return this.cast(this._items.reverse());
    },
    invoke: function(method){
      return this._items.invoke(method);
    },
    first: function(){
      return this._items.first();
    },
    clear: function(options){
      options = _.defaults(options || {}, {clear: true});
      this._items.slice(0).each(function(item){
        remove.call(this, [item], options);
      }, this);
      this.trigger('cleared');
      return this;
    },
    toString: function(){
      return this.className + ' [' + this.map(function(item){
        return item.toString();
      }).join(', ') + ']';
    }
  });

  _.extend(List.prototype, Backbone.Events);
  List.prototype.push = List.prototype.add;
  List.prototype.has  = List.prototype.contains;
  List.prototype.index= List.prototype.indexOf;

  var remove = function(items, options){
    var removed = [];
    options = _.defaults(options || {}, {clear: false});
    items.each(function(item){
      if (this.contains(item)) {
        _.extend(options, this.adjacent(item));
        this._items.take(item);
        removed.push(item);
        this.trigger('removed', item, options);
      }
    }, this);
    return removed;
  };

  return List;

});
