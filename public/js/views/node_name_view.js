define(['backbone'], function(Backbone){

  var NodeNameView = Backbone.View.extend({
    tagName: 'a',
    initialize: function(model, node, options){
      var that = this;
      this.editing = false;
      this.model = model;
      this.node = node;
      that.bind('cancelled', function(){
        that.editing = false;
        that.render();
      });
      model.bind('renamed', function(){
        that.editing = false;
        that.render();
      });
      //TODO: observe name changes.
      node.bind('edit', function(options){
        that.editing = true;
        that.render(options);
      });
    },
    render: function(options){
      options = _.defaults(options || {}, {selectAll: false});
      var view = this;
      var model = this.model, node = this.node, name = model.names().first();
      var $el = this.$el.empty().attr({href: '#' + model.url()});
      if (this.editing) {
        var input = $('<input>').attr({type: 'text', value: name.value()});
        input.bind('keydown', function(e){
          e.stopPropagation();
          if (e.keyCode ===  9) { //tab
            name.value(input.val());
            e.preventDefault();
          }
          if (e.keyCode === 27) //esc
            view.trigger('cancelled');
          if (e.keyCode === 13) { //enter
            var value = input.val();
            name.value() === value ? view.trigger('cancelled') : name.value(value);
          };
        });
        $el.append(input);
        input.focus()
        if (options.selectAll)
          input.select();
      } else {
        $el.text(model.name());
      };
      return this;
    }
  });

  return NodeNameView;

});
