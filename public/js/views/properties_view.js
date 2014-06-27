define(['views/composite_view'], function(CompositeView){

  var PropertiesView = CompositeView.extend({
    tagName: 'ul',
    initialize: function(options){
      _.bindAll(this, "render", "items");
      var that = this, model = options.model, render = this.render, childName = this.childModel.prototype.className.underscore();
      var added = function(){
        model.trigger("added");
      };
      model.bind('add-child:' + childName, render);
      model.bind('add-child:' + childName, added); //TODO: does this belong here?
      model.bind('remove-child:' + childName, render);

      this.$el.one("remove", function(){
        console.log("properties-view-cleanup:"+that.cid, that);
        model.unbind('add-child:' + childName, render);
        model.unbind('add-child:' + childName, added); //TODO: does this belong here?
        model.unbind('remove-child:' + childName, render);
        that.unbind();
      });
    },
    items: function(){
      return this.model[this.childModel.prototype.className.underscore().pluralize()].call(this.model).map(function(name, idx){
        return new this.childView({model: name});
      }, this)
    }
  });

  return PropertiesView;

});
