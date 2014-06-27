define(['backbone', 'views/constraints_view', 'input_factory'], function(Backbone, ConstraintsView, InputFactory){

  var DatatypeView = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this,'render');
    },
    tagName: 'li',
    render: function(){
      var $el = this.$el.empty();
      var model = this.options.model;
      var datatype = model.datatype();
      var label = $("<label/>").text('Datatype').appendTo($el);
      var select = InputFactory.builders.datatype.build({}).appendTo($el)
      select.val(datatype);
      select.change(function(){
        model.datatype($(this).val());
      });

      select.addClass('chzn-select');

      model.datatype_constraints().each(function(constraint){
        constraint.bind('change:datatype', function(){
          select.val(model.datatype() || null).trigger("liszt:updated");
        });
      }, this);
      return this;
    }
  },{
    constrains: function(model){
      return model.isa('occurrence_type');
    }
  });

  ConstraintsView.template.add('datatype', DatatypeView);

  return DatatypeView;

});
