define(['list'], function(List){

  var PanelList = List.extend({
    add: function(label, view, options){
      var panel = _.defaults({label: label, view: view}, options);
      return this._super(panel);
    }
  });

  return PanelList;

});
