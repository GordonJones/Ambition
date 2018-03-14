# Greens will be

My retirement project

An interactive collaborative (team based) tool for generating and navigating network graphs in a hierarchical fashion.

Used by teams to capture hierarchical breakdowns for planning / estimating purposes.

Multi user with collaborative real time working using publish subscribe with user assisted conflict resolution.

Local changes are proposed & published, and the server sends the update back via the subscription.

The server and the hierarchical presentation have different data models. The Server holds nodes and links - a network. It doesn't know about the presentation hierarchy, nor any calculated values.

The human client sees and interacts with a strict hierarchic tree view of a chosen path through network.

A semantic glue module will sit between the presentation and the server dynamically handling the publish subscribe interactions, and creating "alias/clone rows" for nodes with multiple parents. The end user can dynamically choose which clone to use for the hierarchical presentation of its own children.

The hierarchy will have some limited spreadsheet functionality:

  formulae between cells on the same row. (eg charge = rate * days)

  Aggregation of cell values up through column branches. (eg summing the above charge column)

Ideally row heights will be derived from max cell content for each cell in the row (word wrapped for text).

Local offline working will be supported with eventual consistency achieved with via user assisted conflict resolution.

The objective is to write as little of this as possible other than the semantic glue between the tree presentation and persistent server, and the spreadsheet functionality.

The functionality the publish/subscribe and of the server side of this application matches almost perfectly with pouchdb/couchdb.

The client side could be almost any of the variety of tree based web products. Ag-grid, react-redux-grid, JSTree, have all been investigated. At present the favourite is FancyTree, primarilly because it already acknowledges the clone concept, but also it has a somewhat lighter footprint and learning curve than the REACT based tree views.
