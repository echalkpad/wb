define(['set', 'backbone'], function(Set, Backbone){

  var Views = Set.extend({
    init: function(items){
      this._super();
      this.flat();
      this.validates(function(view){ //is this a view class? //TODO: recreate all validates filters as aspects
        return _.isFunction(view.prototype.render);
      });
      if (items) this.add(items);
    },
    targets: function(subject){
      return new Views(this.select(function(view){
        return view.prototype.targets(subject);
      }));
    }
  });

  return Views;

});
