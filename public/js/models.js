define(['models/topic', 'models/name', 'models/occurrence', 'models/association', 'models/role', 'models/topic_map'], function(Topic, Name, Occurrence, Association, Role, TopicMap){
  return {Topic: Topic, Name: Name, Occurrence: Occurrence, Association: Association, Role: Role, TopicMap: TopicMap};
});
