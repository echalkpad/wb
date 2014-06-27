define(['backbone', 'dictionary'], function(Backbone, Dictionary){

  //TODO: wrapper item should receive css `class` (key from dictionary where applicable)
  var CompositeView = Backbone.View.extend({
    initialize: function(options){
      options = _.defaults(options || {}, {list: this.constructor.template || new Dictionary}); //list could be any enumerable (e.g. an array).
      _.bindAll(this);
      //this.attributes = options.attributes || {};
      this.list = options.list;
      if (options.id) this.attributes.id = options.id;
      if (options.el) this.el = options.el;
    },
    wraps: function(item, key, idx){ //abstract -- override if we want to wrap all elements with additional elements
      return item;
    },
    items: function(){ //override if desired -- it must return an enumerable (like a list, dictionary, or array).
      return this.list;
    },
    elements: function(){
      var element = ele = this.element, wraps = _.bind(this.wraps, this), items = this.items();
      /*if (wraps){
       element = function(item, key, idx){
          var el = ele(item, key, idx),
              wrapped = wraps(el, key, idx),
              safe = ele(wrapped, key, idx);
          return safe;
        }
      }*/
      var fn = items instanceof Dictionary ? function(key, item, idx){
        return element(item, key, idx); //swap key and item so item always comes first
      } : function(item, idx){
        return element(item, null, idx);
      };
      return items.map(fn);
    },
    element: function(item, key, idx){ //takes an item an resolves it to an element -- TODO: allow for key/value params if dictionary; TODO: handle a jquery object
      var el;
      if (item instanceof jQuery) {
        el = item[0];
      } else if (_.isFunction(item)) { //returns an element or something in need of further element resolution (like jQuery object or a view)
        el = this.element(item.call(this, key), key, idx);
      } else if (_.isFunction(item.render)) { //a view which can render a dom element
        el = item.render().el;
      } else {
        el = item; //ultimately, a dom element!
      };
      return el;
    },
    append: function(){
      var items = _.toArray(arguments).flatten();
      var elements = items.map(function(item){
        return this.wraps(this.element(item));
      }, this);
      this.$el.append(elements);
      return this;
    },
    render: function(){
      var elements = this.elements();
      elements = this.wraps ? elements.map(this.wraps) : elements;
      this.count = elements.length; //TODO: remove this property?
      this.$el.empty().append(elements);
      return this;
    },
  },{
    compose: function(){ //factory method
      var list = _.toArray(arguments);
      return new CompositeView({list: list});
    }
  });

  return CompositeView;

});
