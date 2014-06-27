define(['views/add_type_view'], function(AddTypeView){

  var AddOccurrenceView = AddTypeView.extend({
    type: 'occurrence'
  });

  return AddOccurrenceView;

});
