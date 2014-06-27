define(['request_bar', 'commands'], function(RequestBar, Commands){

  var CommandLine = RequestBar.extend({
    className: 'CommandLine',
    init: function(commands){
      this._ready = false;
      this.commands = commands || new Commands();
    },
    execute: function(command_line_text){
      var subject = this._topic_map;

      //Multiple commands can be piped together.  The result of executing one command becomes the subject of the next command.
      var piped = command_line_text.split('|').map(function(command){
        return command.trim();
      });

      while(piped.length > 0){
        var text = piped.shift();
        var args = text.split(' ');
        var name = args.shift(); text = args.join(' ');
        var command = this.commands.create(name, subject, text);
        var request = {command: command};
        var result = null;
        if (command) {
          request.allow = true; //intercept and disallow as desired.
          this.trigger('command:executing:' + name, request);
          this.trigger('command:executing', name, request);
          if (request.allow) {
            try {
              //on success return a result object (any object or array).  
              //on error return an error object: {error: "describe the problem"}
              //if the command returns nothing, keep the same subject
              subject = result = command.execute(this) || subject; 
            } catch(error) {
              result = {error: error || "Unhandled exception!"};
              subject = null;
            }
            this.trigger('command:executed:' + name, request, result);
            this.trigger('command:executed', name, request, result);
          } else {
            this.trigger('command:denied:' + name, request);
            this.trigger('command:denied' , name, request);
            break;
          }
        } else { //unknown command
          this.trigger('command:rejected:' + name, request);
          this.trigger('command:rejected' , name, request);
          break;
        }

      }

      return subject;

    }
  });

  return CommandLine;

});
