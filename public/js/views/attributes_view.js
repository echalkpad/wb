define(['views/composite_view', 'views/attribute_view'], function(CompositeView, AttributeView){

  var AttributesView = CompositeView.extend({
    tagName: 'ul',
    items: function(){
      var model = this.model;
      return this.ordinals().map(function(attr){
        return new AttributeView({model: model, attribute: attr, tagName: 'li'});
      });
    }
  });

  return AttributesView;

});
