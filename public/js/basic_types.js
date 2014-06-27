define(function(){
  var BasicTypes = {
    list: ['topic_type', 'name_type', 'occurrence_type', 'association_type', 'role_type'],
    check: function(types){
      types = _.array(types);
      return !!types.detect(function(type){
        return BasicTypes.list.contains(type);
      });
    }
  };

  return BasicTypes;

});
