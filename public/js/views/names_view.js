define(['views/properties_view', 'models/name', 'views/name_view', 'views/add_name_view'], function(PropertiesView, Name, NameView, AddNameView){

  var NamesView = PropertiesView.extend({
    childView: NameView,
    childModel: Name
  });

  return NamesView;

});