define(['backbone', 'input_factory'], function(Backbone, InputFactory){

  var AddTypeView = Backbone.View.extend({
    tagName: 'li',
    className: 'prompt',
    render: function(){
      var model = this.model, type = this.type, createMethod = this.createMethod || type, onClose = this.options.onClose || _.doNothing;
      var allowed = 'constrained_{0}_types'.plug(type);
      var choices = this.model.term()[allowed]().iids();
      var $el = this.$el;
      var prop = type + '_type';
      var create = _.bind(model[createMethod], model);
      var heading = $('<h2/>').text('Add ' + type).appendTo($el);
      var label = $('<label/>').text('Type').appendTo($el);
      var close = function(e){
        $el.remove();
        onClose();
      };
      $('<button/>').text('Close').click(close).appendTo($el);
      var add = $('<button/>').text('Add').appendTo($el).click(function(e){
        var input = $($el.find('input,select')[0]);
        var type = input.val().toString();
        if (type.length > 0){
          create({type: type});
          close();
        } else {
          input.focus();
        }
      });
      var freekey = $('<button/>').text('Freekey').click(function(e){
        $('<input/>').attr({type: 'text', value: choice.val()}).appendTo($el).focus().keypress(function(e){
          var code = (e.keyCode ? e.keyCode : e.which);
          if (code == 13) {
            e.preventDefault();
            add.click();
          }
        });
        freekey.remove();
        choice.remove();
      }).appendTo($el);
      var choice = $(InputFactory.build({builder: 'dropdown', model: model, prop: prop, datatype: 'String', choices: choices})).appendTo($el);
      return this;
    }
  });

  return AddTypeView;

});
