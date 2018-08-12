$.ui.fancytree._FancytreeNodeClass.prototype.branch = function() {
  var visited = new Map;
  this.becomeMaster (visited);
  //  this.tree.render (true,true);
}

$.ui.fancytree._FancytreeNodeClass.prototype.becomeMaster = function(visited) {
  if (!visited.has(this.refKey)) { // been here before, dont recurse any further
    var newMaster = this;
    visited.set (newMaster.refKey,null);
    //    console.log ("visited: "+newMaster.refKey);
    if (!newMaster.isMaster()) {
      var clones = newMaster.tree.getNodesByRef(this.refKey);
      var oldMaster = clones.find(function(clone){return clone.isMaster()});
      oldMaster.data.isMaster = false;
      oldMaster.addClass("isSlave");
      newMaster.data.isMaster = true;
      newMaster.removeClass("isSlave");
      if (oldMaster.children) {
         // have to take a copy to avoid iterating and changing
        var oldMasterChildren = oldMaster.children.slice(0);
        oldMasterChildren.forEach (function (child) {
        child.moveTo(newMaster, "child"); // dont publish
        })
      }
    }
    if (newMaster.children) {  // recurse through children
      newMaster.children.forEach (function(node) {node.becomeMaster (visited)})
    }
  }
}

$.ui.fancytree._FancytreeNodeClass.prototype.isMaster = function() {
  return (this.isRootNode() || this.data.isMaster)
}

$.ui.fancytree._FancytreeNodeClass.prototype.isSlave = function() {
  return (!this.isRootNode() && !this.isMaster())
}
