define(['views/list_view'], function(ListView){

  var TagsView = ListView.extend({
    tagName: 'ul',
    className: 'tags',
    events: {
      'click li': 'render'
    },
    wraps: function(item, key, idx){
      return $('<li>').append(item)[0];
    }
  });

  _.aspect(TagsView.prototype, 'initialize', function($super, options){
    $super.call(this, options);
    this.list.bind('added', this.render);
    this.list.bind('isolated', this.render);
    this.list.bind('cleared', this.render);
    this.list.bind('removed', this.render);
  });

  return TagsView;

});
