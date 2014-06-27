define(['backbone'], function(Backbone){

  //implements "unit of work" pattern.
  //http://martinfowler.com/eaaCatalog/unitOfWork.html

  var ChangeLog = function(database, types){

    var collections = {};
    var actions = {'i': 'inserted', 'u': 'updated', 'd': 'deleted'};
    var self = this;

    types.each(function(type){
      collections[type] = {};
    });

    this.collections = collections;

    database.bind("revise", function(type, action, model){
      self[action](type, model);
    });

    _.extend(ChangeLog.prototype, {
      'insert': function(type, model){
        return register(type, model, 'i');
      },
      'update': function(type, model){
        return register(type, model, 'u');
      },
      'delete': function(type, model){
        return register(type, model, 'd', function(meta, collection){
          if (meta.action == 'i') {
            delete collection[model.id];
          }
          meta.action = 'd';
        });
      },
      toJSON: function(){
        var that = this;
        var json = {inserted: {}, updated: {}, deleted: {}};
        _.each(collections, function(collection, collectionName){
          _.each(actions, function(action){
            json[action][collectionName] = [];
          });
          _.each(collection, function(meta, id){
            var action = actions[meta.action];
            var coll   = json[action][collectionName];
            coll.push(action == 'deleted' ? id : meta.model.toJSON());
          });
        })
        return json;
      },
      find: function(id){
        return _.detect(collections, function(collection, collectionName){
          return collection[id];
        });
      },
      persist: function(callback){
        var remaining = 0, that = this, results = {success: [], error: []};
        var batch = _.flatten(_.map(this.collections, function(collection, type){
          return _.map(collection, function(info, id){
            var action = {'i': 'insert', 'u': 'update', 'd': 'delete'}[info.action], model = info.model;
            var options = {
              headers: {},
              success: function(data, textStatus, jqXHR){
                model.set(data || {}, {silent: true}); //reflect any updates such as date/userstamps
                delete collection[id];
                model.trigger('persisted'); //reflect isDirty status.
                results.success.push(_.extend(result, {data: data, textStatus: textStatus}));
              },
              error: function(jqXHR, textStatus, errorThrown){
                results.error.push(_.extend(result, {textStatus: textStatus, errorThrown: errorThrown}));
              },
              complete: function(jqXHR, textStatus){
                remaining -= 1;
                delete result.options;
                if (remaining == 0 && callback){
                  console.log('persist', results);
                  callback(results);
                }
              }
            }
            if (['update','delete'].contains(action)){
              options.headers['If-Unmodified-Since'] = model.get('updated_at');
            }
            var result = {id: id, action: action, model: model, type: type, options: options};
            return result;
          });
        }));

        remaining = batch.length;
        if (remaining == 0) {
          callback(results); //nothing done;
        }
        batch.each(function(item){
          Backbone.sync(item.action, item.model, item.options);
        });
      }
    });

    var register = function(type, model, action, adjustAction){
      var collection = collections[type.pluralize()];
      var meta = collection[model.id];
      var applyAction = function(meta){
        if (meta.action != 'd') {
          meta.action = action;
        }
      }
      adjustAction = adjustAction || applyAction;
      if (meta){
        adjustAction(meta, collection);
      } else {
        meta = collection[model.id] = {model: model, action: action};
      }
      //console.log(actions[action], model, meta);
    }
  };

  return ChangeLog;

});
