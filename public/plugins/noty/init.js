define([
  'plugins/notifications', 
  'css!./css/jquery.noty.css',
  'js!./js/jquery.noty.js!order'
  ], function(notifications, css){

  //notifications adapter for noty -- TODO: extract to a plugin
  notifications.bind('added', function(notification){
    var timeout = notification.duration === 'sticky' ? true : 6000, closable = notification.duration !== 'permanent';
    var message = {text: notification.text, layout: notification.layout, type: notification.type, modal: notification.modal, timeout: timeout, closable: closable};
    if (notification.actions) message.buttons = notification.actions;
    noty(message);
  });

  return null;

});