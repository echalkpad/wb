define(['jquery'], function($){

  var ToggleButton = function(options){
    var icon = $("<img/>").attr({src: options.image, id: options.id, title: options.tooltip}), tag = options.tag || options.id, target = options.target; 
    _.extend(icon, {
      isActive: function(){
        return !this.hasClass('disabled');
      },
      refresh: function(){
        var $t = _.resolve(target);
        $t && $t.toggleClass(tag, this.isActive());
        return this;
      }.bind(icon),
      disable: function(){
        this.addClass('disabled');
        this.refresh();
        return this;
      }.bind(icon),
      toggle: function(){
        this.toggleClass('disabled', this.isActive());
        this.refresh();
        return this;
      }.bind(icon)
    });
    icon.click(icon.toggle);
    return icon;
  };

  return ToggleButton;

});