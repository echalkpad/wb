define(['class'], function(Class){

  //alternative to Array.as;
  var Enumerable = {
    methods: _.functions(_.mixins.Array),
    begetters: _.mixins.Array.begetters,
    extend: function(source){
      source = _.clone(source || {});
      source.init = source.init || function(items){
        this._items = items || [];
      };
      var methods   = source.methods   || Enumerable.methods  ; delete source.methods;
      var begetters = source.begetters || Enumerable.begetters; delete source.begetters;

      var Template  = Class.extend(source), proto = Template.prototype;
      
      //port over vanilla array methods (some of which may have begetters);
      _.each(methods, function(method){
        proto[method] = function(){
          var args = _.toArray(arguments), items = this._items;
          return items[method].apply(items, args);
        }
      });

      //begetter methods beget their own kind
      _.each(begetters, function(method){
        proto[method] = _.wrap(proto[method], function(){
          var args = _.toArray(arguments), $super = args.shift();
          var result = $super.apply(this, args);
          return new Template(result);
        });
      });

      Template.extend = function(s){
        s = _.extend(source, s || {});
        s.methods   = _.uniq((s.methods   || []).concat(methods));
        s.begetters = _.uniq((s.begetters || []).concat(begetters));
        return Enumerable.extend(s);
      };
      
      return Template;
    }
  };
  
  var Chats  = Enumerable.extend({
    speak: function(){
      console.log('said: ' + this._items.join(' '));
      return this;
    }
  });
  var Counts = Chats.extend({
    count: function(){
      console.log('count: ' + this._items.length.toString());
      return this;
    }
  });

  var list = new Counts(['this', 'ol', 'man', 'he', 'played', 'one']);
  list.speak().count();
  var list2 = list.select(function(item){
    return item.length > 2;
  });
  list2.speak().count();
  var list3 = list2.reject(function(item){
    return item.length > 3;
  });
  list3.speak().count();

  return Enumerable;
});
