define(['extend_natives'], function(){

  //monkey patch to prevent error when adding Fred to both roles in a Marriage -- TODO: report issue
  var stopPlugins = $.ui.draggable.prototype.plugins.stop;
  var stopCursor  = stopPlugins.detect(function(arr){return arr[0] == 'cursor';});
  var stopOpacity = stopPlugins.detect(function(arr){return arr[0] == 'opacity';});

  stopCursor[1] = function(event, ui) {
    var o = ($(this).data('draggable') || {options: null}).options;
    if (o && o._cursor) $('body').css("cursor", o._cursor);
  }

  stopOpacity[1] = function(event, ui) {
    var o = ($(this).data('draggable') || {options: null}).options;
    if(o && o._opacity) $(ui.helper).css('opacity', o._opacity);
  }

  return $;
});
