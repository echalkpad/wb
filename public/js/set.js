define(['list'], function(List){

 var Set = List.extend({
    className: 'Set',
    init: function(items){
      this._super()
      this.validates(function(item){ //is unique?
        return !this._items.contains(item);
      });
      if (items) this.add.apply(this, items);
    },
    cast: function(items){
      return new Set(items);
    },
  });

  return Set;

});
