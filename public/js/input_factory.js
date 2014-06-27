define(['filtering'], function(Filtering){

  var Datatypes = Filtering.Datatypes;

  var InputFactory = {
    builders: {},
    add: function(name, build, match){
      var noMatcher = function(){return false};
      this.builders[name] = {match: match || noMatcher, build: build};
      return this;
    },
    build: function(options){
      var builder;
      if (options.builder) {
        builder = this.builders[options.builder];
      } else {
        builder = _.detect(this.builders, function(builder){
          return builder.match(options);
        });
      }
      var build = builder.build;
      var input = build.call(options, options);
      return _.extend(input, this.inputExtensions);
    },
    inputExtensions: {
      push: function(model, type){
        var input = this;
        var c = model.properties(type).first();
        this.bind('change', function(e){
          var value = input.val();
          c.value(value);
        });
        return this;
      },
      pull: function(model, type){
        var input = this;
        var c = model.properties(type).first();
        this.val(c.value());
        c.bind('change:value', function(e){
          input.val(c.value());
        });
        return this;
      },
      sync: function(model, type){
        this.push(model, type);
        this.pull(model, type);
        return this;
      }
    }
  }

  // the order that builders are added matters when it comes to finding a matching builder.

  InputFactory.add('cardinality', function(){
    var card  = $('<div/>').addClass('card');
    var inputs = [$('<input/>').attr({name: 'from'}), $('<input/>').attr({name: 'to'})];
    var from = inputs[0], to = inputs[1];
    inputs.each(function(input){
      input.numeric({decimal: false, negative: false});
      input.appendTo(card);
      input.click(_.stopPropagation);
      input.change(function(e){
        card.trigger('change');
      });
    });
    $("<span/>").html(" to ").insertAfter(from);
    card.val = function(value){
      if (value) {
        var parts = _.isArray(value) ? value : value.split(',');
        from.val(parts[0]);
        to.val(parts[1]);
        return this;
      } else {
        return [from.val(), to.val()];
      }
    }
    return card;
  }, function(options){
    return options.datatype == 'Cardinality' || options.prop == 'card';
  });

  InputFactory.add('checkbox', function(options){
    var checkbox = $('<input/>').attr({type: 'checkbox'});
    checkbox.val = function(value){ //rewrite jQuery's approach
      var el = this[0];
      if (_.isUndefined(value)){
        return el.checked;
      } else {
        el.checked = value;
        return this;
      }
    };
    return checkbox;
  }, function(options){
    return options.datatype == 'Boolean';
  });

  //three-state checkbox: true, false, null
  InputFactory.add('yes-no', function(options){
    var choices = options.choices;
    var select = $('<select/>');
    $('<option/>').attr({value: ''}).text('').appendTo(select);
    $('<option/>').attr({value: 'true'}).text('Yes').appendTo(select);
    $('<option/>').attr({value: 'false'}).text('No').appendTo(select);
    select.val = _.wrap(select.val, function(fn, value){
      if (_.isUndefined(value)) {
        return fn.call(select);
      } else {
        value = _.isNull(value) ? '' : value.toString();
        return fn.call(select, value);
      }
    });
    return select;
  }, function(options){
    return options.datatype == 'Boolean';
  });

  InputFactory.add('dropdown', function(options){
    var choices = options.choices;
    var select = $('<select/>');
    $('<option/>').attr({value: ''}).text('').appendTo(select); //blank
    if (_.isArray(choices)){
      _.each(choices, function(choice){
        $('<option/>').attr({value: choice}).text(choice).appendTo(select);
      });
    } else {
      _.each(choices, function(text, value){
        $('<option/>').attr({value: value}).text(text).appendTo(select);
      });
    }
    return select;
  }, function(options){
    return options.choices.length > 0;
  });

  InputFactory.add('datatype', function(){
    var value = this.value;
    var datatypes = _.map(Datatypes, function(value, key){
      return key;
    });
    var input = InputFactory.build({choices: datatypes});
    if (value) {
      input.val(value);
    }
    return input;
  }, function(options){
    return options.prop == 'datatype';
  });

  InputFactory.add('date', function(){
    var model = this.model;
    var prop = this.prop;
    var input = $("<input/>");
    input.attr({type: 'date'}).datepicker({
      duration: '',
      dateFormat: 'yy-mm-dd',
      showTime: false,
      constrainInput: false,
      constrainInput: false,
      onClose: function(dateText, object) {
        var props = {};
        props[prop] = dateText;
        model.set(props);
        console.log('onclose', model.toJSON(), model);
      }
    });
    return input;
  },function(options){
    return options.datatype == 'Date';
  });

  InputFactory.add('datetime', function(){
    var model = this.model;
    var prop = this.prop;
    var input = $("<input/>");
    input.attr({type: 'datetime'}).datepicker({
      duration: '',
      dateFormat: 'yy-mm-dd',
      showTime: true,
      constrainInput: false,
      stepMinutes: 1,
      stepHours: 1,
      altTimeField: '',
      time24h: false,
      constrainInput: false,
      onClose: function(dateText, object) {
        var props = {};
        props[prop] = dateText;
        model.set(props);
        console.log('onclose', model.toJSON(), model);
      }
    });
    return input;
  },function(options){
    return options.datatype == 'Datetime';
  });

  //NOTE: to indicate how many rows (e.g. height) use css based on data-type.
  InputFactory.add('textarea', function(options){
    return $('<textarea/>');
  }, function(options){
    var maxlength = options.length[1];
    return _.isNumber(maxlength) && maxlength > 100;
  });

  InputFactory.add('text', function(){
    return $("<input/>").attr({type: 'text'});
  }, function(){
    return true;
  });

  return InputFactory;

});
