define(['backbone'], function(Backbone){

  var ViewSettingsView = Backbone.View.extend({
    events: {
      'change input[type=checkbox]': 'toggled'
    },
    render: function(){
      var checked = this.constructor.defaults;
      var target = this.options.target;
      var $el = this.$el;
      var fieldset = $('<fieldset/>').appendTo($el);
      var legend = $('<legend/>').text("Visible Parts").appendTo(fieldset);
      //TODO: rename identifiers to iids.
      $.each(['commands','ids','identifiers','scopes','types','supertypes','names','occurrences','constraints','associations','userstamps'], function(idx, id){
        var label = $('<label/>').appendTo(fieldset);
        var checkbox = $('<input/>').attr({type: 'checkbox', id: id}).appendTo(label)
          .prop("checked", checked.contains(id))
          .change();
        label.append(' ' + id);
      });

      fieldset = $('<fieldset/>').appendTo($el);
      legend = $('<legend/>').text("Topic Size").appendTo(fieldset);
      ['small', 'normal', 'large'].each(function(size, idx){
        var checkbox = $('<input/>').attr({name: 'size', type: 'radio', value: size}).change(function(e){
          $(target).attr({'data-size': $(e.target).val()});
        });
        if (idx == 1){
          checkbox.attr({checked: 'checked'}).change();
        }
        var label = $('<label/>').append(checkbox).append(size).appendTo(fieldset);
      });
      return this;
    },
    toggled: function(e){
      var method = e.target.checked ? 'addClass' : 'removeClass';
      var id = $(e.target).prop('id');
      $(this.options.target)[method](id);
    }
  },{
    defaults: ['types', 'supertypes', 'names', 'occurrences', 'constraints', 'commands', 'userstamps']
  });

  return ViewSettingsView;

});
