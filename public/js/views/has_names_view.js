define(['views/has_properties_view', 'views/constraints_view'], function(HasPropertiesView, ConstraintsView){

  var HasNamesView = HasPropertiesView.extend({
    caption: 'Has Names',
    acceptedType: 'name_type',
    constraintType: 'topic_name_constraint'
  },{
    constrains: function(model){
      return model.isa('topic_type');
    }
  });

  ConstraintsView.template.add('has_names', HasNamesView);

  return HasNamesView;

});
