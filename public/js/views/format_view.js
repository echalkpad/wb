define(['backbone', 'input_factory', 'views/constraints_view'], function(Backbone, InputFactory, ConstraintsView){

  var FormatView = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this,'render');
    },
    tagName: 'li',
    render: function(){
      var $el = this.$el.empty();
      var model = this.options.model;
      var format = model.format();
      var label = $("<label>").text('Format').appendTo($el);
      var select = InputFactory.builders.text.build({}).appendTo($el)
      select.val(format);
      select.change(function(){
        model.format($(this).val());
      });
      model.regular_expression_constraints().each(function(constraint){
        constraint.bind('change:regexp', this.render);
      }, this);
      return this;
    }
  },{
    constrains: function(model){
      return model.isa('occurrence_type');
    }
  });

  ConstraintsView.template.add('format', FormatView);

  return FormatView;

});
