var class = require('class');

 //NOTE: `parse` function (if implemented) parses command line text and returns an 'options' object.
var Command = Class.extend({ //abstract class
   name: null, //the keyword that names the command
   description: null, //one line describing the command
   webpage: null, //url pointing to page with detailed instructions
   init: function(subject, options){ //options is either an options object or a text (which will be converted to an options object).
     this.subject = subject;
     this.text = _.isString(options) ? options : null; _.isString(options) && (options = null);
     this.options = options || (this.text && this.parse ? this.parse(this.text) : {}) || {};
   },
   permits: function(actor){ //abstract: is some actor (usually a User) permitted to use this command?
     return true;
   },
   targets: function(subject){ //abstract: is some object a viable subject for the command?
     return true;
   },
   group: function(subject){ //abstract: returns a string naming the group (for ui purposes) to which this command should belong (if any).
     return null;
   },
   execute: function(){ //abstract: can also provide an undo function if applicable.
     throw "command not implemented";
   }
 },{
   aliases: function(){
     var args = _.toArray(arguments), $super = args.shift();
     args.each(function(arg){ //convert singular name to an array of names since we allow multiple aliases
       arg.names || (arg.names = [arg.name]);
     });
     var command = $super.apply(this, args);
     command.alias = function(name){
       this.prototype.names.push(name);
       return this;
     };
     return command;
   }	
 });

 _.aspect(Command, 'extend', Command.aliases);

 exports = Command;


