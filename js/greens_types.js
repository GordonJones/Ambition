var types = [];
var typesStylesheet;
function initTypes () {
  var styleElement = document.createElement('style')
  // Append style element to head
  document.head.appendChild(styleElement);
  // Grab style sheet
  typesStylesheet = styleElement.sheet;
  if (types.length == 0) {
    types[0] = {"name": "project", "format": "color:Red", "defaultChildType": "project"};
  }
  var i;
  for (i = 0; i < types.length; i++) {
    var type = types[i];
    addType(type, i)
    var li = $('<li/>')
        .on( "click", {type: type}, editType)
        .addClass('ui-menu-item')
        .attr('role', 'menuitem')
        .appendTo($("#types"));
    var aaa = $('<a/>')
        .addClass("greens-"+type.name)
        .text(type.name)
        .appendTo(li);
  }
}
function editType(event) {
  var type = event.data.type
  $("#edit-type-form input[name=name]").val(type.name);
  $("#edit-type-form input[name=format]").val(type.format);
  $("#edit-type-form input[name=child-type]").val(type.defaultChildType);
  $("#edit-type-form input[name=type-index]").val(type.index);
}
function addType (type, index) {
  type.index = index;
  types[index] = type;
  typesStylesheet.insertRule ('.greens-'+type.name+'{'+type.format+'}', index)
}
function removeType (index) {
  if (index <= types.length) {
    types[index] = null;
    typesStylesheet.deleteRule (index)
  }
}
