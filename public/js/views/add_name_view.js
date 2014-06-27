define(['views/add_type_view'], function(AddTypeView){

  var AddNameView = AddTypeView.extend({
    type: 'name'
  });

  return AddNameView;

});
