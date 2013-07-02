var HTTP_CONTENT_TYPE_HEADER = 'Content-Type';

chrome.browserAction.onClicked.addListener( function( tab ) {

	chrome.tabs.executeScript(
			null,
			{
				file : "js/jquery-2.0.2.js"
			},
			function() {

				chrome.tabs.executeScript(
						null,
						{
							file : "js/RDFa.1.0.0.js"
						},
						function() {

							chrome.tabs.executeScript(
									null,
									{
										file : "js/test2ClientScript.js"
									}
							);
						}
				);
			}
	);

} );

var getMediaTypeForXhr = function( xhr ) {

	var contentTypeHeader = xhr.getResponseHeader( HTTP_CONTENT_TYPE_HEADER );

	if ( contentTypeHeader ) {
		return contentTypeHeader.split( ';' )[ 0 ];
	}

	return TEXT_PLAIN_MEDIA_TYPE;
};

chrome.runtime.onMessage.addListener( function( request, sender, callback ) {

	if ( sender.tab && request.requestUri ) {
		console.log( 'Request recieved for ' + request.requestUri );

		$.ajax( request.requestUri, {
			type : 'GET',
			success : function( data, textStatus, xhr ) {
				if ( typeof callback === 'function' ) {
					callback( {
						success : true,
						documentText : data,
						mediaType : getMediaTypeForXhr( xhr )
						} );
				}
				console.log( 'Retrieved data for uri ' + request.requestUri + data );
			}
		} );

	}

	return true;

} );
