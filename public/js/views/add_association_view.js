define(['views/add_type_view'], function(AddTypeView){

  var AddAssociationView = AddTypeView.extend({
    type: 'association',
    createMethod: 'associate'
  });

  return AddAssociationView;

});
