define(['views/composite_view'], function(CompositeView){

  var FooterBarView = CompositeView.extend({
    className: 'bar',
    tagName: 'footer',
    attributes: {id: 'footer'}
  });

  return FooterBarView;

});
