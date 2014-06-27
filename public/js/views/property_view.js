define(['backbone', 'views/inline_errors_view', 'input_factory'], function(Backbone, InlineErrorsView, InputFactory){

  var PropertyView = Backbone.View.extend({
    tagName: "li",
    initialize: function(){
      _.bindAll(this);

      var that     = this,
          model    = this.model,
          updateInput = _.bind(this.updateInput, this);

      var setFocus = function(model){
        that.$el.find(':input').focus();
      };

      model.bind('change', updateInput);
      model.bind('added' , setFocus);
      model.bind('denied', updateInput);

      this.$el.one("remove",function(){
        //console.log("property-view-cleanup:"+that.cid, that);
        model.bind('change', updateInput);
        model.bind('added' , setFocus);
        that.unbind();
      });
    },
    events: {
      "change :input": "updateModel",
      "click button.delete": "remove"
    },
    render: function(){
      var $el      = this.$el.empty();
      var model    = this.model;
      var type     = model.type();
      var value    = model.value();
      var term     = model.topic_map().term(type);
      var datatype = term.datatype();
      var choices  = term.choices();
      var length   = term.length();
      var named    = term.name() || type;
      var suffix   = datatype == 'Boolean' && !named.endsWith('?') ? '?' : '';
      var label    = $("<label/>").html(named + suffix);
      var input    = this.input = InputFactory.build({model: model, prop: type, datatype: datatype, choices: choices, length: length});
      var error    = new InlineErrorsView({model: model, attribute: type}).marks($el).render().el;

      input.val(value);
      input.addClass('input');

      $el
        .attr({'data-type': type})
        .append(label, input, error)
        .attr({'data-datatype': datatype});

      label
        .draggable({
          revert: false,
          opacity: .5,
          distance: 5,
          helper: 'clone',
          appendTo: 'body',
          start: function(e, ui){
            ui.helper.data({model: model, dispose: false});
          },
          stop: function(e, ui){
            if (ui.helper.data('dispose')) {
              model.detach();
              $el.remove();
            }
          }
        });

      return this;
    },
    remove: function(element){
      this.model.detach();
    },
    updateModel: function(element){
      var value = this.input.val();
      this.model.set({value: value});
    },
    updateInput: function(){
      if (!this.model.value) return; //TODO: why is this line necessary when cloning a topic?  remove and research.
      var value = this.model.value();
      this.input && this.input.val(value);
    }
  });

  return PropertyView;

});
