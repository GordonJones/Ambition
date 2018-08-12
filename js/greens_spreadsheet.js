$.ui.fancytree._FancytreeNodeClass.prototype.performRowCalcs = function() {
  // assert this.isMaster() and isLeaf()
  if (this.isMaster() && !this.hasChildren()) {
    var pouchNode = pouchNodes.get(this.refKey);
    pouchNode.sum = pouchNode.rate * pouchNode.number;
    this.render (true);
    this.flash();
  }
  var parent = this.getParent();
  if (parent && !parent.isRootNode()) {
    parent.performColumnAggregation()
  }
}
$.ui.fancytree._FancytreeNodeClass.prototype.performColumnAggregation = function() {
  // assert this.isMaster() and not isLeaf()
  var sum = 0;
  if (this.isMaster() && this.hasChildren()) {
    var pouchNode = pouchNodes.get(this.refKey);
    this.children.forEach(function (child) {
      if (child.isMaster()) {
        var childPouchNode = pouchNodes.get(child.refKey);
        if (childPouchNode) {sum = sum + childPouchNode.sum}
      }
    });
    pouchNode.sum = sum
    var parent = this.getParent();
    if (parent && !parent.isRootNode()) {
      parent.performColumnAggregation()
    }
    this.render (true);
    this.flash();
  }
}

function initSpreadsheetValues (fancyObject) {
  var pouchNode = pouchNodes.get(fancyObject.refKey)
  var sum = 0
  if (fancyObject.children && fancyObject.children.length >0) {
    fancyObject.children.forEach ( function (child) {
      sum = sum + initSpreadsheetValues (child)
    });
    pouchNode.sum = sum;
    //console.log ("branch: "+fancyObject.title+ " sum: "+ sum)
  } else if (fancyObject.isMaster) { // its a leaf with values
      sum = pouchNode.rate * pouchNode.number;
      pouchNode.sum = sum
      //console.log ("leaf: "+fancyObject.title+ " sum: "+ sum)
  } else {
    //console.log ("slave: "+fancyObject.title)
  }
  return sum
}
