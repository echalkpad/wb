$.fn.jSlider = function(settings) {
  settings = $.extend({
    slideDuration: 600,
    bottomMargin: 55
  }, settings);

  return this.each(function(){
    var jslider = $(this);
    var viewport= jslider.find('> ul');
    var panels  = viewport.find('> li');
    var count   = panels.length;

    jslider.bind("resize", function(){
      var panel = jslider.data('currentPanel');
      if (panel && $(panel).is(':visible')) {
        resizeTo(panel);
      };
    });

    var resizeTo = function(panel){
      var visible = $(panel).is(':visible');
      if (visible) {
        var content = $(panel).find('> *:first');
        var h = content.height() + settings.bottomMargin;
        jslider.animate({ height: h }, settings.slideDuration);
        panels.animate({ height: h }, settings.slideDuration);
      };
    };

    var toPanel = function(panel, dur){
      jslider.data('currentPanel', panel);
      var w = $(window).width();
      var n = $(panel).prevAll().length;
      var margin = n * -w;
      var focused = function(){
        $(panel).trigger("focused");
      };

      $(panel).trigger("focusing");

      if (dur) {
        viewport.animate({marginLeft: margin}, dur, focused);
      } else {
        viewport.css({marginLeft: margin});
        focused();
      };

      resizeTo(panel);
    };

    var adjustWidth = function(){
      var w = $(window).width();
      var pw = w * count;
      viewport.width(pw);
      panels.width(w);
      var p = jslider.data('currentPanel');
      if (p){
        toPanel(p);
      };
    };

    $(settings.linkSelector).click(function(e){
      e.preventDefault(); e.stopPropagation();
      var panelId = $(this).attr('href');
      var panel = _.detect(panels, function(p, idx){
        return p.id == panelId.replace('#','');
      });
      $(this).siblings().removeClass('here');
      $(this).addClass('here');
      toPanel(panel, settings.slideDuration);
    });

    adjustWidth();

    $(window).resize(function(){
       adjustWidth();
    });
  });
};
