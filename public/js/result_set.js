define(['set'], function(Set){

 var ResultSet = Set.extend({
    className: 'ResultSet',
    init: function(items, filter, topic_map, description){
      var self = this;
      this._super()
      this.add.apply(this, items);
      this._filter = filter || _.returnFalse;
      this.description = description || ''; //text representation of the content.

      if (!_.isFunction(this._filter)) //a function returning true or false
        throw "invalid filter.";

      if (topic_map && topic_map.bind) {
        topic_map.bind('revise', function(type, action, topic){
          if (type === 'topic') {
            if (action === 'insert') {
              var matches = filter(topic);
              if (matches){
                self.add(topic);
              }
            } else if (action === 'delete' && self.contains(topic)) {
              self.remove(topic);
            }
          }
        });
      }
    }
  });

  return ResultSet;

});
