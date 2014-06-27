define(['list', 'views/request_bar_view'], function(List, RequestBarView){

  var ModeBar = List.extend({
    add: function(options){
      this.icons || (this.icons = {});
      var id = options.id || (options.mode + '-bar'), mode = options.mode, command = options.command, placeholder = options.placeholder, image = options.image;
      var icon = this.icons[options.mode] = $('<img>').attr({src: options.image, 'data-target': id, 'data-sets-mode': mode}).addClass('mode-button').addClass('inactive').click(this.activate);
      var bar  = new RequestBarView({attributes: {id: id}, model: command, placeholder: placeholder, image: image});
      return this._super(icon[0], bar);
    },
    activate: function(e){
      if (e) {
        var button = $(e.target), mode = button.attr('data-sets-mode');
        var targets = button.attr('data-target');
        $('footer.bar .mode-button, footer.bar .request-bar[id]').addClass('inactive'); //TODO: footer.bar being here is an undesireable coupling
        button.removeClass('inactive');
        $('#' + targets).removeClass('inactive').find('input').focus();
        this.trigger('change:mode', mode);
      } else {
        $(this.at(0)).click(); //select default
      }
      return this;
    }
  });

  return ModeBar;

});
