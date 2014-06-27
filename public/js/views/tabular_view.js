define(['backbone', 'result_set', 'views/article_view', 'views/commands_view', 'views/composite_view', 'list', 'dictionary'], function(Backbone, ResultSet, ArticleView, CommandsView, CompositeView, List, Dictionary){

  var TabularView = ArticleView.extend({
    className: 'topics',
    targets: function(target){
      return target instanceof ResultSet || _.isArray(target);
    },
    creates: function(target){
      var items = target;
      var results = items instanceof ResultSet ? items : new ResultSet(items, _.returnFalse, items.first().topic_map(), 'Results');
      return new TabularView({results: results});
    },
    addAttribute: function(){ //TODO: used?
      var suggested = this.suggestedTerms().pluck('iid'); //TODO: better interface
      var attributes = this.options.attributes;
      var attribute = prompt('attribute', suggested);
      if (attribute && attribute.length > 0){
        attributes.push(attribute);
      }
      this.render();
    },
    suggestedTerms: function(){ //TODO: used?
      return this.options.terms
        .map(function(term){
          return term.topic_property_constraints().deserialize();
        })
        .flatten()
        .map(function(constraint){
          var type = constraint.name_type || constraint.occurrence_type;
          var iid = type.iids().first();
          var label = type.name();
          var datatype = type.datatype() || 'String';
          return {iid: iid, type: type, label: label, datatype: datatype};
        });
    },
    modelAttributes: function(){
      var tm = this.options.results.first().topic_map();
      var attributes = _.defaults(this.options, {attributes: ['name']}).attributes;
      return attributes.map(function(attribute){
        var term = tm.term(attribute);
        var identifier = term.iids().first();
        var label = term.name() || identifier || attribute.humanize();
        return {name: attribute, term: term, label: label, datatype: term.datatype()};
      });
    }
  },{
    template: new Dictionary()
  });
  
  /* .attr({'data-types': filter.types.join(' ')})*/
  (function(template){
    template.add('header', function(){
      return this.header(this.options.results.description);
    });
    template.add('commands', function(){
      var commands = ArticleView.commands.reject(function(command){ //TODO: if we knew if any collapsible sections existed that would be better.
        return ['expand','collapse'].include(command.prototype.name);
      });
      return this.commands({commands: commands});
    });
    template.add('table', function(){
      return new TableView({list: this.options.results, attrs: this.modelAttributes()});
    });
  })(TabularView.template);

  var TableView = CompositeView.extend({
    tagName: 'table',
    items: function(){
      var items = new List(), attrs = this.options.attrs;
      var header = $('<tr>');
      attrs.each(function(attribute, idx){
        $('<th>').addClass(attribute.datatype).text(attribute.label).appendTo(header);
      });
      items.add(header);

      this.list.each(function(item){
        items.add(new TabularRowView({model: item, attrs: attrs}));
      });
      return items;
    }
  });

  _.aspect(TableView.prototype, 'initialize', function($super, options){
    $super.call(this, options);
    var tm = this.list.first().topic_map();
    var attrs = this.options.attrs;
    var $el = this.$el;
    this.list.bind('added', function(item){
      $el.append(new TabularRowView({model: item, attrs: attrs}).render().el);
    });
  });

  var TabularRowView = Backbone.View.extend({
    tagName: 'tr',
    render: function(){
      var model = this.options.model;
      var attributes = this.options.attrs;
      var $el = this.$el.empty();

      _.each(attributes, function(attribute, idx){
        var content = (model.value(attribute.name) || '').toString();
        if (attribute.name === 'name') {
          content = $('<a/>').attr({href: '#' + model.url()}).text(content);
        }
        $('<td/>').addClass(attribute.datatype).append(content).appendTo($el);
      });

      return this;
    }
  });

  return TabularView;

});
