define(['views/has_properties_view', 'views/constraints_view'], function(HasPropertiesView, ConstraintsView){

  var HasOccurrencesView = HasPropertiesView.extend({
    caption: 'Has Occurrences',
    acceptedType: 'occurrence_type',
    constraintType: 'topic_occurrence_constraint'
  },{
    constrains: function(model){
      return model.isa('topic_type');
    }
  });

  ConstraintsView.template.add('has_occurrences', HasOccurrencesView);

  return HasOccurrencesView;

});
