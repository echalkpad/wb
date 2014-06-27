define(['views/properties_view', 'models/occurrence', 'views/occurrence_view', 'views/add_occurrence_view'], function(PropertiesView, Occurrence, OccurrenceView, AddOccurrenceView){

  var OccurrencesView = PropertiesView.extend({
    childView: OccurrenceView,
    childModel: Occurrence
  });

  return OccurrencesView;

});