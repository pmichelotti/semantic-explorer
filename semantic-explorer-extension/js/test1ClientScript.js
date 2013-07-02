var RDF_OBJECT_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#object';
var RDF_PLAIN_LITERAL_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral';

GreenTurtle.attach( document );

/*
 * Formant of a Subject
 *
 * subjectObject
 *   {
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
 *     }
 *   }
 *
 */


var EntityPrototype = {

		"present" : function() {

			var container = $( '<div></div>' );

			container.append( '<h4>' + this.object + '</h4>' );

			container.css( {
				"position" : "absolute",
				"right" : "0px",
				"top" : this.calculateTopForOrigin()
			} );

			return container;

		},

		"calculateTopForOrigin" : function() {
			debugger;
			console.log( 'Position calculation ' + $( this.origin ).offset().top );
			return $( this.origin ).offset().top;
		}
};

/**
 *
 * @param subject String URI representing the subject of a triple
 * @param predicate String URI representing the predicate of a triple
 * @param object The object value of a triple.  The object takes the form
 *   {
 *     type : type-uri (String - one of RDF_OBJECT_TYPE, RDF_PLAIN_LITERAL_TYPE),
 *     value : Literal value or String URI,
 *     language : language representation (String),
 *     origin : DOM element from which the object originated
 *   }
 *
 */
var entityFactory = function( subject, predicate, object ) {

	return Object.create( EntityPrototype, {
		"subject" : { writable : false, value : subject },
		"predicate" : { writable : false, value : predicate },
		"object" : { writable : false, value : object.value },
		"origin" : { writable : false, value : object.origin },
		"rawObject" : { writable : false, value : object }

	} );
};

/**
 * The Exploration Node represents a single point in a directed Exploration with paths pointing out towards
 * extendable exploration opportunities. Each node also contains indication of its subject and the raw
 * predicates.  Raw predicates are maintained as mechanisms, such as presentation, which may use the node
 * may need unanticipated predicate access.
 *
 *
 */
var explorationNodeFactory = function( subject, parentNode, existingExplorationTree ) {

	var newExplorationNode = Object.create( ExplorationNodePrototype, {
		"subject" : { writable : false, value : subject.id },
		"predicates" : { writable : false, value : subject.predicates },
		"paths" : { writable : false, value : {} },
		"parent" : parentNode
	} );

	for( var curPredicate in subject.predicates ) {

		var objectsList = subject.predicates[ curPredicate ].objects;



	}

	return newExplorationNode;

};

var getSubjectForUri = function( uri, callback ) {

};

/**
 * An Exploration is represented by a rooted tree.  The root of the tree
 * is the starting point Entity.  Paths coming off an entity are triples where
 * the object of the triple is a poignant URI object.
 */
var ExplorationPrototype = {

};

/**
*
* @param subject String URI representing the subject of a triple
* @param predicate String URI representing the predicate of a triple
* @param object The object value of a triple.  The object takes the form
*   {
*     type : type-uri (String - one of RDF_OBJECT_TYPE, RDF_PLAIN_LITERAL_TYPE),
*     value : Literal value or String URI,
*     language : language representation (String),
*     origin : DOM element from which the object originated
*   }
*
*/
var explorationFactory = function( subject, predicate, object, callback ) {

	if( object.type === RDF_OBJECT_TYPE ) {

		getSubjectForUri( object.value, function( subjectObject ) {

			var exploration = Object.create( ExplorationPrototype, {
				"ofSubject" : { writable : false, value : subject },
				"forPredicate" : { writable : false, value : predicate },
				"origin" : { writable : false, value : object.origin },
				"root" : { writable : false, value : explorationNodeFactory( subjectObject ) }
			} );

			callback( exploration );

		} );

	}

}

var initExplorer = function() {

	var entitySet = Array();

	var subjectList = document.data.getSubjects();

	subjectList.forEach( function( curSubject ) {

		var curSubjectObject = document.data.getSubject( curSubject );

		debugger;

		if ( curSubjectObject.predicates ) {

			for( var curPredicate in curSubjectObject.predicates ) {

				curSubjectObject.predicates[ curPredicate ].objects.forEach( function( curObject ) {

					console.log( 'Processing ' + curSubject + ' : ' + curPredicate + ' : ' + curObject.value );
					console.log( '    Object type ' + curObject.type );
					console.log( '    ' + ( typeof curObject.type ) );

					if( curObject.type === RDF_OBJECT_TYPE ) {

							entitySet[ curObject.value ] = entityFactory( curSubject, curPredicate, curObject );

					}

				} );

			}
		}

	} );

	var explorationWindow = $( '<div></div>' );

	explorationWindow.css(
			{
				"width" : "400px",
				"position" : "absolute",
				"right" : "0px",
				"top" : "0px",
				"background-color" : "#FFFFFF",
				"opacity" : "0.5"
			}
	);

	console.log( 'Presenting entity set' );

	for( var curSubject in entitySet ) {

		explorationWindow.append( entitySet[ curSubject ].present() );
	}

	$( 'body' ).append( explorationWindow );

};

initExplorer();

