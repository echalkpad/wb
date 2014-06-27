define(['views/composite_view', 'dictionary'], function(CompositeView, Dictionary){

  var ConstraintsView = CompositeView.extend({
    tagName: 'ul',
    items: function(){
      var model = this.options.model;
      return ConstraintsView.template.select(function(key, View){
        var includes = View.constrains(model);
        return includes;
      }).map(function(key, View){
        return new View({model: model});
      });
    }
  },{
    template: new Dictionary()
  });

  _.aspect(ConstraintsView.prototype, 'initialize', function($super, options){
    $super.call(this, options);
    this.options.model.bind('retyped', this.render);
  });

  return ConstraintsView;

});
