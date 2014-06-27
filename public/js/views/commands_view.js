define(['views/list_view', 'commands'], function(ListView, Commands){

  var renderButton = function(info){
    return $('<button/>').
      addClass(info.name).
      text(info.label).
      attr({title: info.description}).
      click(info.execute).
      data({name: info.name});
  };

  var CommandsView = ListView.extend({
    className: "commands",
    items: function(){
      var targets = this.options.targets.compact();
      var commands = this.options.commands, command;
      var index = this.options.index;
      var items = [];

      if (commands instanceof Commands){
        if (commands.isEmpty()){
          console.log('no commands', targets);
        }

        if (!index) {
          index = {};
          commands.each(function(command, idx){
            index[command.prototype.name] = idx;
          });
        };

        var registered = []; //Prevent registering the same command twice--an an issue if two targets respond to the same command.

        var compiled = targets.map(function(target){
          return commands.targets(target).map(function(Command){
            var name = Command.prototype.names.first();
            var label = Command.prototype.label || name.titleize();
            var group = Command.prototype.group();
            var description = Command.prototype.description;
            var info = registered.contains(name) ? null : {
              name: name,
              label: label,
              description: description,
              group: group,
              execute: function(){
                var command = new Command(target);
                var result = command.execute(this);
                console.log('executed command', name, result);
                return result;
              }
            };
            registered.push(name);
            return info;
          });
        }).flatten().compact();

        var grouped = compiled.groupBy('group');
        var ungrouped = grouped.null ? _.extract(grouped, 'null').null : [];

        var grouped_buttons = _.map(grouped, function(grouped_commands, group){
          var top_button = $('<button>').addClass(group).text(group.humanize());
          var list = grouped_commands.map(renderButton).map(function(b){return b[0];});
          var child_buttons = new ListView({list: list}).render().$el;
          var grouping = $('<div>').addClass('grouping').append(top_button).append(child_buttons);
          child_buttons.hide()
          var over = function(e){
            child_buttons.width(top_button.width() + 6).show();
          };
          var out = function(e){
            e.preventDefault(); _.stopPropagation(e);
            child_buttons.hide();
          };
          grouping.hover(over,_.doNothing);
          child_buttons.hover(_.doNothing, out);
          grouping.data({name: grouped_commands.first().name});
          return grouping;
        });

        var ungrouped_buttons = ungrouped.map(renderButton);

        items = [ungrouped_buttons, grouped_buttons].flatten().sortBy(function(item){
          var name = item.data('name');
          var idx = index[name]; if (_.isUndefined(idx)) idx = 999;
          return idx;
        });
      } else { //we have a simple key/value (string/string) pairs object -- e.g. {save: 'save', destroy: 'delete'}
        //TODO: remove this approach since it's less flexible?
        items = _.map(commands, function(label, command){
          return $('<button/>').addClass(command).text(label).click(function(){
            target[command].call(target, this);
          });
        });
      }

      return items.compact();

    }
  });

  return CommandsView;

});
