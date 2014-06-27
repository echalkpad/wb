define(['views/composite_view'], function(CompositeView){

  var ListView = CompositeView.extend({
    tagName: 'ul', //can always override to create ordered list.
    wraps: function(item, key, idx){
      return $('<li>').append(item)[0];
    }
  });

  return ListView;

});
