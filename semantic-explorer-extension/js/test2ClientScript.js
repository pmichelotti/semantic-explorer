( function( providedDocument ) {

	var RDF_OBJECT_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#object';
	var RDF_PLAIN_LITERAL_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral';

	var TEXT_HTML_MEDIA_TYPE = 'text/html';
	var TEXT_PLAIN_MEDIA_TYPE = 'text/plain';

	var HTTP_CONTENT_TYPE_HEADER = 'Content-Type';

	var DC_TERMS = 'http://purl.org/dc/terms/';

	var RDFExplorationTreePrototype = {
		"setRoot" : function( root ) {
			this.root = root;
			this.clearNodeIndex();
			this.addNodeToIndex( root );
		},
		"getRoot" : function() {
			return this.root;
		},
		"focus" : function( node ) {

		},
		"clearNodeIndex" : function() {

		},
		"addNodeToIndex" : function( node ) {

		}
	};

	var rdfExplorationTreeFactory = function() {

		console.log( 'rdfExplorationTreeFactory : Constructing new exploration tree' );

		var newRdfTree = Object.create( RDFExplorationTreePrototype, {

		} );

		return newRdfTree;

	};

	var RDFExplorationTreeNodePrototype = {
		"addChild" : function( content ) {
			var newNode = treeNodeFactory( this.tree, this, content );

			this.children.push( newNode );

			if( this.listeners[ 'childAdd' ] ) {
				this.listeners[ 'childAdd' ].forEach( function( curListener ) {
					curListener( [ newNode ] );
				} );
			}

		},
		"addChildren" : function( childrenContent ) {

			var childrenAdded = Array();

			childrenContent.forEach( function( curContent ) {

				var newNode = treeNodeFactory( this.tree, this, curContent );

				this.children.push( newNode );
				childrenAdded.push( newNode );

			} );

			if( this.listeners[ 'childAdd' ] ) {
				this.listeners[ 'childAdd' ].forEach( function( curListener ) {
					curListener( childrenAdded );
				} );
			}

		},
		"setContent" : function( content ) {

			this.content = content;

			if( this.listeners[ 'contentChange' ] ) {
				this.listeners[ 'contentChange' ].forEach( function( curListener ) {
					curListener( this );
				} );
			}

		},
		"addContentChangeListener" : function( callback ) {

			if ( !this.listeners[ 'contentChange' ] ) {
				this.listeners[ 'contentChange' ] = Array();
			}

			this.listeners[ 'contentChange' ].push( callback );

		},
		"addChildAddListener" : function( callback ) {

			if ( !this.listeners[ 'childAdd' ] ) {
				this.listeners[ 'childAdd' ] = Array();
			}

			this.listeners[ 'childAdd' ].push( callback );

		},
		"focus" : function() {

			if ( this.tree ) {
				this.tree.focus( this );
			}

			if ( this.listeners[ 'focus' ] ) {
				this.listeners[ 'focus' ].forEach( function( listener ) {
					listener( this );
				} );
			}

		},
		"addFocusListener" : function( callback ) {

			if ( !this.listeners[ 'focus' ] ) {
				this.listeners[ 'focus' ] = Array(0);
			}

			this.listeners[ 'focus' ].push( callback );

		},
		"listeners" : {},
		"children" : Array()
	};

	var rdfExplorationTreeNodeFactory = function( tree, parent, content ) {

		console.log( 'rdfExplorationTreeNodeFactory : Constructing new node for ' + content );

		var newNode = Object.create( RDFExplorationTreeNodePrototype, {
			"tree" : { writable : false, value : tree },
			"parent" : { writable : false, value : parent },
			"content" : { writable : true, value : content }
		} );

		return newNode;

	};

	/**
	 * An Exploration Node contains information about the resource under exploration.
	 * This information includes:
	 * <ul>
	 *   <li>The URI of the resource</li>
	 *   <li>The triples which the resource is involved in</li>
	 *   <li>Paths of valid exploration from the resource</li>
	 *   <li>The DOM origin of the exploration</li>
	 * </ul>
	 */
	var ExplorationNodePrototype = {

			"isExpanded" : function() {
				return this.expanded;
			},
			"getObjectValue" : function( predicate ) {
				var object = this.getObject( predicate );

				if ( object ) {
					return object.value;
				}

				return null;
			},
			"getObjectValues" : function( predicate ) {
				var objects = this.getObjects( predicate );

				return objects.map( function( curObject ) {
					return curObject.value;
				} );

			},
			"getObject" : function( predicate ) {
				var objects = this.getObjects( predicate );

				if ( objects && objects.length ) {
					return objects[ 0 ];
				}

				return null;
			},
			"getObjects" : function( predicate ) {
				if ( this.rawPredicates && this.rawPredicates[ predicate ] && this.rawPredicates[ predicate ].objects && this.rawPredicates[ predicate ].objects.length ) {
					return this.rawPredicates[ predicate ].objects;
				}

				return Array();
			}
	};

	/**
	 * An empty exploration node is meant as a place holder for a node which will
	 * later be expanded.
	 *
	 * @param subject String URI of the Resource under exploration
	 * @param origin The DOM origin of the Exploration
	 */
	var emptyExplorationNodeFactory = function( subject, origin, callback ) {

		var newExplorationNode = Object.create( ExplorationNodePrototype, {
			"subject" : { writable : false, value : subject },
			"rawSubject" : { writable : false, value : null },
			"origins" : { writable : false, value : [] },
			"rawPredicates" : { writable : false, value : null },
			"paths" : { writable : false, value : null },
			"expanded" : { writable : false, value : false },
			"empty" : { writable : false, value : true }
		} );

		if ( origin ) {
			newExplorationNode.origins.push( origin );
		}

		/*
		 * Request the content of the resource identified by the Subject URI.  Once the
		 * content is retrieved use GreenTurtle to build up the subject structure.
		 */
		newExplorationNode.expand = function( nodeCallback ) {

			chrome.runtime.sendMessage( { requestUri : this.subject }, ( function( response ) {
				console.log( response );

				if ( response.success ) {

					if ( typeof nodeCallback === 'function' ) {
						var unexpandedExplorationNode = getUnexpandedExplorationNodeForDocument( response.documentText, response.mediaType, this.subject, origin );
						nodeCallback( unexpandedExplorationNode );
					}

				}

			} ).bind( this ) );

		};

		if ( typeof callback === 'function' ) {
			callback( newExplorationNode );
		}

		return newExplorationNode;

	};

	/**
	 *
	 * @param subject A Subject Object representing the Resource under exploration
	 *
	 * Formant of a Subject
	 *
	 * subjectObject
	 *   {
	 *     graph : The Graph Object which the subject comes from (I presume),
	 *     id : String URI of the Subject,
	 *     origins : List of DOM elements from which the Subject was pulled
	 *     predicates : {
	 *       predicate-uri (string) : {
	 *         id : predicate-uri (string),
	 *         objects : [
	 *           {
	 *             language : language-string (string),
	 *             type : type-uri from rdfs - see below,
	 *             value : value (string or URI string),
	 *             origin : dom element
	 *           }
	 *         ],
	 *         predicate : predicate-uri (string)
	 *       }
	 *     },
	 *     types : rdf:types associated with the Subject
	 *     subject : String URI of the Subject
	 *   }
	 *
	 */
	var unexpandedExplorationNodeFactory = function( subject, origin, callback ) {

		var newExplorationNode = Object.create( ExplorationNodePrototype, {
			"subject" : { writable : false, value : subject.id },
			"rawSubject" : { writable : false, value : subject },
			"origins" : { writable : false, value : [] },
			"rawPredicates" : { writable : false, value : subject.predicates },
			"paths" : { writable : false, value : null },
			"expanded" : { writable : false, value : false },
			"empty" : { writable : false, value : false }
		} );

		if ( subject.origins && subject.origins.length ) {
			newExplorationNode.origins.concat( subject.origins );
		}
		else if ( origin ) {
			newExplorationNode.origins.push( origin );
		}

		if ( callback ) {
			callback( newExplorationNode );
		}

		return newExplorationNode;

	};

	/**
	 *
	 * @param expansionCallback This callback will be used every time one of the exploration
	 *                          path expansions finish.  The callback will be passed the node
	 *                          made by this factory, the predicate of the path, and the object
	 *                          at the end of the path.
	 */
	var expandedExplorationNodeFactory = function( subject, nodeCallback, expansionCallback ) {

		var newExplorationNode = Object.create( ExplorationNodePrototype, {
			"subject" : { writable : false, value : subject.id },
			"rawSubject" : { writable : false, value : subject },
			"origins" : { writable : false, value : subject.origins },
			"rawPredicates" : { writable : false, value : subject.predicates },
			"paths" : { writable : false, value : {} },
			"expanded" : { writable : false, value : true },
			"empty" : { writable : false, value : false }
		} );

		//expand paths
		for( var curPredicate in subject.predicates ) {

		    console.log( 'expandedExplorationNodeFactory : Checking predicate ' + curPredicate + ' for need of expansion' );

			var curPredicateObject = subject.predicates[ curPredicate ];

			curPredicateObject.objects.forEach( function( curObject ) {

			    console.log( 'expandedExplorationNodeFactory : Predicate ' + curPredicate + ' object of type ' + curObject.type + ' found' );

				if ( curObject.type === RDF_OBJECT_TYPE ) {

					if ( !newExplorationNode.paths[ curPredicate ] ) {
						newExplorationNode.paths[ curPredicate ] = Array();
					}

				    console.log( 'expandedExplorationNodeFactory : Determined expansion should be attempted - dereferencing ' + curObject.value );

				    /*
					 * Parse returns an object with the properties specified in
					 * htps://code.google.com/p/green-turtle/wiki/API#.implentation.parse()
					 */
				    var handleDataResponse = function( success, data, mediaType ) {

				    	if ( success ) {

				    		/*
				    		parsedDocument = GreenTurtle.parse( data, mediaType );

				    		var newExpandedPath = getUnexpandedExplorationNodeForDocument( responseText, mediaType, newExplorationNode.subject );

							if ( newExpandedPath ) {
								newExplorationNode.paths[ curPredicate ].push( newExpandedPath );
							}

							if ( expansionCallback ) {
								expansionCallback( newExplorationNode, newExpandedPath )
							}
							*/
				    	}

				    };

				    chrome.runtime.sendMessage( { requestUri : curObject.value }, function( response ) { alert( response ); } );

				}

			} );

		}

		if ( nodeCallback ) {
			nodeCallback( newExplorationNode );
		}

		return newExplorationNode;

	};

	/**
	 * Look through the triples associated with a subject and return the objects of those
	 * triples whose objects are Resources.  The returned objects are organized by predicates.
	 *
	 * Returned objects have the structure
	 * <ul>
	 *   <li>language</li>
	 *   <li>origin</li>
	 *   <li>type</li>
	 *   <li>value</li>
	 * </ul>
	 *
	 * @return Map of object lists keyed by predicates
	 */
	var getResourceObjectsForSubject = function( subject ) {

		var retList = {};

		for( var curPredicate in subject.predicates ) {

		    console.log( 'getResourceObjectsForSubject : Checking predicate ' + curPredicate + ' for need of expansion' );

			var curPredicateObject = subject.predicates[ curPredicate ];

			curPredicateObject.objects.forEach( function( curObject ) {

			    console.log( 'getResourceObjectsForSubject : Predicate ' + curPredicate + ' object of type ' + curObject.type + ' found' );

				if ( curObject.type === RDF_OBJECT_TYPE ) {

					if ( !retList[ curPredicate ] ) {
						retList[ curPredicate ] = Array();
					}

					retList[ curPredicate ].push( curObject );

				}

			} );

		}

		return retList;

	};

	/**
	 * Constructs and returns an Unexpanded Exploration Node representing the provided
	 * subject URI.  If possible, RDF is extracted from the document based on the media type.
	 * If this is not possible and the document is an HTML document, we use light HTML semantics
	 * to extract triples.
	 *
	 * @param documentText A string representing a document
	 * @param mediaType The media type associated with the document represented by documentText
	 * @param subjectUri The subject to construct an Exploration Node for
	 * @param origin The DOM origin of the exploration
	 */
	var getUnexpandedExplorationNodeForDocument = function( documentText, mediaType, subjectUri, origin ) {

		console.log( 'getUnexpandedExplorationNodeForDocument : Constructing node for ' + subjectUri );

		try {
			var parsedDocument = document.data.implementation.parse( documentText, mediaType, { baseURI : subjectUri } );

			if( parsedDocument.subjects[ subjectUri ] ) {
				return unexpandedExplorationNodeFactory( parsedDocument.subjects[ subjectUri ], origin );
			}
		}
		catch( e ) {
			console.log( e );
		}

		/*
		 * If the parsed document did not contain the subject in question then it may be presumed that the
		 * document did not expose it's data in a recognizable linked format.  In this case we fall back on
		 * some lighter semantic extraction.
		 */
		if ( mediaType === TEXT_HTML_MEDIA_TYPE ) {

			var subjectFromHtml = constructSubjectFromHtml( documentText, subjectUri );

			return unexpandedExplorationNodeFactory( subjectFromHtml, origin );

		}

		var fauxSubject = {
				id : subjectUri,
				subject : subjectUri,
				predicates : {}
			};

		return unexpandedExplorationNodeFactory( fauxSubject, origin );

	};

	/**
	 *
	 * Build a 'fake' Subject object based on the content of the HTML String.  The HTML String is expected
	 * to be an entire HTML document.
	 *
	 * Document API: https://developer.mozilla.org/en-US/docs/Web/API/document
	 * Element API: https://developer.mozilla.org/en-US/docs/Web/API/element
	 * DOMParser API: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
	 *
	 * @param htmlText HTML Document in String Format
	 * @param uri The URI of the document
	 *
	 * @return A 'fake' Subject object which takes the form:
	 *         <ul>
	 *           <li>id : uri of Subject</li>
	 *           <li>subject : uri of Subject</li>
	 *           <li>predicates : Map of predicate URIs to predicate objects</li>
	 *         </ul>
	 *         A Predicate Object takes the form
	 *         <ul>
	 *           <li>id : uri of the Predicate</li>
	 *           <li>predicate : uri of the Predicate</li>
	 *           <li>objects : Array of Object objects representing the object portion of the triple</li>
	 *         </ul>
	 *         An Object object takes the form
	 *         <ul>
	 *           <li>type : uri f the object type</li>
	 *           <li>value : String value of the object</li>
	 *         </ul>
	 *
	 */
	var constructSubjectFromHtml = function( htmlText, uri ) {

		var parser = new DOMParser();

		//TODO: If and when Chrome starts supporting the text/html mime type, update this accordingly
		var parsedDocument = parser.parseFromString( htmlText, 'text/xml' );

		var retSubject = {
				id : uri,
				subject : uri,
				predicates : {}
			};

		/*
		 * Title
		 */
		var titleTags = parsedDocument.getElementsByTagName( 'title' );

		if ( titleTags.length > 0 ) {

			var titleText = titleTags[ 0 ].textContent;

			console.log( 'constructSubjectFromHtml : Title found - title text ' + titleText );

			retSubject.predicates[ DC_TERMS + 'title' ] = {
					id : DC_TERMS + 'title',
					predicate : DC_TERMS + 'title',
					objects : [
					             {
					            	 type : RDF_PLAIN_LITERAL_TYPE,
					            	 value : titleText
					             }
					          ]
				};

		}

		return retSubject;

	};

	/**
	 * Constructs a list of unexpanded exploration nodes each one representing a unique subject
	 * found in the current document.
	 */
	var buildInitialSubjectExplorationsForDocument = function( curDocument ) {

		var explorationMap = {};

		var subjectList = curDocument.data.getSubjects();

		subjectList.forEach( function( curSubject ) {

			console.log( 'buildInitialSubjectExplorationsForDocument : found subject ' + curSubject );

			var curSubjectObject = curDocument.data.getSubject( curSubject );

			var explorableObjects = getResourceObjectsForSubject( curSubjectObject );

			/*
			 * Iterate through all Resource objects creating Empty Exploration Nodes for each.  These
			 * empty nodes are primed to be expanded shortly.
			 *
			 * Each empty node will reference its origin and should keep track of that origin during
			 * further expansion.
			 */
			for( var curPredicate in explorableObjects ) {
				if ( !explorationMap[ curPredicate ] ) {
					explorationMap[ curPredicate ] = Array();
				}

				explorationMap[ curPredicate ] = explorationMap[ curPredicate ].concat( explorableObjects[ curPredicate ].map( function( curObject ) {
					return emptyExplorationNodeFactory( curObject.value, curObject.origin );
				} ) );

			}

		} );

		return explorationMap;

	};

	/**
	 * Rendering agents which make up the view aspect of the Explorer
	 */
	var View = {};

	/**
	 * Temporary rendering function which takes a node, expected to be an Empty node, and returns
	 * a DOM view of the node.
	 */
	View.renderForEmptyNode = function( node ) {

		var $presentableUri = $( '<span>' + node.content.subject + ' - Probably Loading</span>' );

		return $presentableUri;

	};

	/**
	 * Temporary rendering function which takes a node, expected to be an Unexpanded node, and returns
	 * a DOM view of the node.
	 */
	View.renderForUnexpandedNode = function( node ) {

		var $container = $( '<div></div>' );

		var titleText = node.content.getObjectValue( DC_TERMS + 'title' );

		if ( titleText ) {
			var $titleDom = $( '<h4>' + titleText + '</h4>' );
			var $uriDom = $( '<p>' + node.content.subject + '</p>' );

			$container.append( $titleDom ).append( $uriDom );
		}
		else {
			var $uriDom = $( '<h4>' + node.content.subject + '</h4>' );

			$container.append( $uriDom );
		}

		return $container;

	};

	/**
	 * Temporary rendering function which takes a node and a container and results in the container
	 * being populated with a rendered view of the node based on the current state of the node.
	 */
	View.renderNodeForContainer = function( node, $container ) {

		if ( node.content.empty ) {
			var $emptyRenderedNode = View.renderForEmptyNode( node );
			$container.empty().append( $emptyRenderedNode );
			return $container;
		}

		if ( !node.content.expanded ) {
			var $unexpandedRenderedNode = View.renderForUnexpandedNode( node );
			$container.empty().append( $unexpandedRenderedNode );
			return $container;
		}

		return $container;

	};

	/**
	 *
	 * @param explorationTreeNode A single node in an RDF Exploration Tree
	 */
	View.explorationDomNodeFactory = function( explorationTreeNode ) {

		console.log( 'View.explorationDomNodeFactory : Creating Dom Node for exploration tree node ' + explorationTreeNode );

		/*
		 * Setup DOM elements
		 */
		var $explorationContainer = $( '<div></div>' );
		var $explorationNodeDom = $( '<div></div>' );
		var $pathList = $( '<ul></ul>' );

		$explorationContainer.append( $explorationNodeDom );

		/*
		 * Setup Node Rendering
		 */
		View.renderNodeForContainer( explorationTreeNode, $explorationNodeDom );

		explorationTreeNode.addContentChangeListener( function() {
			View.renderNodeForContainer( explorationTreeNode, $explorationNodeDom );
		} );

		/*
		 * A Temporary origin highlighter
		 */
		$explorationContainer.hover(
			function() {
				console.log( 'Hover Over detected over ' + explorationTreeNode.content.subject );
				if ( explorationTreeNode.content.origins && explorationTreeNode.content.origins.length ) {
					explorationTreeNode.content.origins.forEach( function( curOrigin ) {
						$( curOrigin ).css( 'background-color', '#9999FF' );
					} );
				}
			},
			function() {
				console.log( 'Hover Out detected over ' + explorationTreeNode.content.subject );
				if ( explorationTreeNode.content.origins && explorationTreeNode.content.origins.length ) {
					explorationTreeNode.content.origins.forEach( function( curOrigin ) {
						$( curOrigin ).css( 'background-color', 'transparent' );
					} );
				}
			}
		);

		/*
		 * Setup Path Rendering
		 */

		/*
		 * When a user interacts with the DOM element representing the tree node, it triggers
		 * a focus event on the node
		 *
		$presentableUri.click( function() {

			console.log( 'FocusEvent : Focus event request detected on ' + explorationTreeNode.content.subject );

			explorationTreeNode.focus();

			//TODO: Determine if this should be moved into explorationDomFactory and setup as a focus listener
			if ( !explorationTreeNode.content.isExpanded() ) {
				console.log( 'FocusEvent : Initializing expansion of node' );
				/*
				 * Start the expansion of the tree node
				 *
				var newExpandedExplorationNode = expandedExplorationNodeFactory( explorationTreeNode.content.rawSubject, null, function( expandingNode, expandedPath ) {

				    console.log( 'FocusEvent - Expanding Node Event : New path expanded ' + expandedPath.subject );

					explorationTreeNode.addChild( expandedPath );

				} );

				explorationTreeNode.setContent( newExpandedExplorationNode );
			}

		} );

		/*
		 * Setup a listener such that whenever a child or children are added, the paths list is
		 * augmented accordingly.
		 *
		explorationTreeNode.addChildAddListener( function( newChildren ) {

		    console.log( 'ExplorationDomNode - Child Add Event : ' + newChildren.length + ' addition detected' );

			newChildren.forEach( function( curNewChild ) {
				var newChildDom = explorationDomNodeFactory( unexpandedExplorationNodeFactory( curNewChild ) );

				var $newChildListItem = $( '<li></li>' ).append( newChildDom );

				$pathList.append( $newChildListItem );

			} );
		} );
		*/

		return $explorationContainer;

	};

	/**
	 *
	 * @param exploration A single RDF Exploration Tree
	 */
	View.explorationDomFactory = function( exploration ) {

		console.log( 'View.explorationDomFactory : Creating DOM for exploration ' + exploration );

		var $explorationDom = $( '<div></div>' );

		var $explorationDomNode = View.explorationDomNodeFactory( exploration.getRoot() );

		$explorationDom.append( $explorationDomNode );

		return $explorationDom;

	};

	/**
	 * Given a set of explorations, initialize the DOM presentation of the explorations within the
	 * context of a document.
	 *
	 * @param curDocument The document to operate upon
	 * @param explorations A List of RDF Exploration Trees
	 */
	View.initializeExplorationPresentation = function( curDocument, explorations ) {

		var $body = $( curDocument ).find( 'body' ).first();

		console.log( 'View.initializeExplorationPresentation : Using document body ' + $body );

		$explorationContainer = $( '<div></div>' ).css(
			{
				"width" : "400px",
				"position" : "absolute",
				"right" : "0px",
				"top" : "0px",
				"background-color" : "#FFFFFF",
				"opacity" : "0.5"
			}
		);

		explorations.forEach( function( exploration ) {

			var $curExplorationDom = View.explorationDomFactory( exploration );

			$explorationContainer.append( $curExplorationDom );

		} );

		console.log( 'View.initializeExplorationPresentation : Appending exploration container to body ' + $explorationContainer );

		$body.append( $explorationContainer );

	};

	/**
	 * Initialization function for the RDF Exploration
	 */
	var initExploration = function( curDocument ) {

		console.log( 'Initializing Exploration!' );

		/*
		 * Attach the GreenTurtle API to the document
		 */
		GreenTurtle.attach( curDocument );

		/*
		 * Construct a list of all subjects in the current document
		 */
		console.log( 'Building initial subject explorations' );

		var subjectExplorationMap = buildInitialSubjectExplorationsForDocument( curDocument );

		/*
		 * For each item in the list start an Exploration tree
		 */
		console.log( 'Initializing exploration trees for subjects' );

		var explorationTreeList = Array();

		for( var curPredicate in subjectExplorationMap ) {

			var curObjectList = subjectExplorationMap[ curPredicate ];

			curObjectList.forEach( function( curExplorableObject ) {

				var curExplorationTree = rdfExplorationTreeFactory();

				var curRootNode = rdfExplorationTreeNodeFactory( curExplorationTree, null, curExplorableObject );

				curExplorationTree.setRoot( curRootNode );

				explorationTreeList.push( curExplorationTree );

				/*
				 * Start the expansion of the currently empty node object
				 */
				curExplorableObject.expand( function( expandedObject ) {

					curRootNode.setContent( expandedObject );

				} );

			} );
		}

		/*
		 * Initialize the presentation of the Exploration trees
		 */
		console.log( 'Initializing presentation for explorations' );

		View.initializeExplorationPresentation( curDocument, explorationTreeList );

	};

	$( document ).ready( function() {
		initExploration( providedDocument );
	} );

} )( document );