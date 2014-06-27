define(['views/composite_view'], function(CompositeView){

  var HeaderBarView = CompositeView.extend({
    className: 'bar',
    tagName: 'header',
    attributes: {id: 'header'}
  });

  return HeaderBarView;

});
