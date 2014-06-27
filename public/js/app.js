define([
  'map_editor',
  'backbone',
  'toggle_button',
  'views/app_view',
  'views/article_view',
  'views/topic_view',
  'views/tree_view',
  'views/tabular_view',
  'views/topic_map_view',
  'views/header_bar_view',
  'views/workspaces_view',
  'views/footer_bar_view',
  'views/app_title_view',
  'views/topic_map_context_view',
  'views/datatype_view',
  'views/format_view',
  'views/has_names_view',
  'views/has_occurrences_view',
  'views/scopes_view',
  'views/types_view',
  'views/tags_view',
  'views/topic_map_importer_view',
  'tree_controllers'
  ], function(
   MapEditor,
   Backbone,
   ToggleButton,
   AppView,
   ArticleView,
   TopicView,
   TreeView,
   TabularView,
   TopicMapView,
   HeaderBarView,
   WorkspacesView,
   FooterBarView,
   AppTitleView,
   TopicMapContextView,
   DatatypeView,
   FormatView,
   HasNamesView,
   HasOccurrencesView,
   ScopesView,
   TypesView,
   TagsView,
   TopicMapImporterView,
   TreeControllers){

  //Views are imported and instantiated here or, better yet, in a plugin.

  var header     = MapEditor.header,
      footer     = MapEditor.footer,
      mode_bar   = MapEditor.mode_bar,
      client     = MapEditor.client,
      jobs       = MapEditor.jobs,
      save       = MapEditor.save,
      context    = MapEditor.context,
      mediator   = MapEditor.mediator,
      workspaces = MapEditor.workspaces,
      importer   = MapEditor.importer;

  //TODO: Transform button on topic map doesn't make sense since we just support one view. e.g. some command buttons need suppressed.
  ArticleView.views.add(TopicView, TreeView, TopicMapView, TabularView, TopicMapImporterView); //TODO: register items in one place (like this) or at the point of declaration or somewhere else?

  var start = _.once(function(){
    Backbone.history.start();
  });

  //header.add(CurrentMapView);
  header.add(new AppTitleView());
  header.add(new TopicMapContextView({mediator: mediator}));

  var trashIcon = $("<img/>").attr({src: '/images/icons/trash.png', id: 'trash', title: 'trash'}).droppable({
    accept: '*',
    greedy: true,
    tolerance: 'pointer',
    activate: function(e,ui){
      $(this).effect("highlight", {}, 1500);
    },
    drop: function(e, ui){
      _.stopPropagation(e)
      ui.draggable.data('draggable').options.revert = false;
      ui.helper.data('dispose', true); //send message to stop event.
    },
    hoverClass: 'trashing'
  });

  var saveIcon = $("<img/>").attr({src: '/images/icons/disk.png', id: 'save', title: 'save'}); //TODO: .click(save);
  var headersIcon = new ToggleButton({image: '/images/icons/bookmark.png', id: 'headers', tooltip: 'toggle headers', target: function(){return view.$el}}); jobs.add(headersIcon.refresh); //jobs.add(headersIcon.disable);

  jobs.add(function(){
    mode_bar.bind('change:mode', function(mode){
      view.$el.attr({'data-mode': mode}); //for css purposes
    });
    mode_bar.activate();
  });

  footer.add(trashIcon[0]);
  footer.add(saveIcon[0]);
  footer.add(headersIcon[0]);
  footer.add(mode_bar._items);
  footer.add(new ScopesView({list: context.scopes}));
  footer.add(new TypesView({list: context.types}));
  footer.add(new TagsView({list: context.tags}));

  var view = new AppView({list: [new HeaderBarView({list: header}), new WorkspacesView({workspaces: workspaces, controllers: new TreeControllers()}), new FooterBarView({list: footer})]});

  var iri = (document.URL.split('/').compact()[3] || '').split('#').first();
  if (iri.startsWith('@')) { //import from file using text area
    jobs.add(function(){
      mode_bar.icons['command'].click();
      workspaces.receive(importer);
      importer.bind('import', function(data){
        client.load(data).always(start);
      });
    });
  } else if (iri) {
    client.fetch(iri).always(start);
  } else {
    start(); //no iri!
  }

  jobs.add(function(){
    view.$el.
      addClass('commands').
      addClass('names').
      addClass('occurrences').
      addClass('constraints').
      addClass('footer').
      addClass('associations').
      addClass('ids').
      addClass('identifiers').
      addClass('scopes').
      addClass('supertypes').
      addClass('types').
      removeClass('maps');
  });

  view.render();
  jobs.execute(this);

  return view;

});
