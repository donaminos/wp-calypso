const fs = require( 'fs' ),
	utils = require( './utils' );

function getSectionsModule( sections, codeSplitting ) {
	let templateName,
		stringSections,
		sectionLoaders;

	if ( codeSplitting ) {
		templateName = 'loader-code-splitting.js.template';
		sectionLoaders = getSectionLoadersCodeSplitting( sections );
	} else {
		templateName = 'loader.js.template';
		sectionLoaders = getSectionLoaders( sections );
	}

	stringSections = JSON.stringify( sections );

	// Load the template and convert to a template literal using eval
	return eval( '`' + fs.readFileSync( __dirname + '/' + templateName, 'utf8' ).toString() + '`' );
}

function getSectionLoadersCodeSplitting( sections ) {
	return sections.map( section => {
		return [
			'case "' + section.name + '":',
			'   return import( /* webpackChunkName: "' + section.name + '" */ "' + section.module + '" );',
			'   break;'
		].join( '\n' );
	} ).join( '\n' );
}

function getSectionLoaders( sections ) {
	let content = '';

	sections.forEach( function( section ) {
		content += requireTemplate( section );
	} );

	return content;
}

function sectionsWithCSSUrls( sections ) {
	return sections.map( section => Object.assign( {}, section, section.css && {
		cssUrls: utils.getCssUrls( section.css )
	} ) );
}

function requireTemplate( section ) {
	const result = section.paths.reduce( function( acc, path ) {
		return acc.concat( [
			'page( getPathRegExp( ' + JSON.stringify( path ) + ' ), function( context, next ) {',
			'	var envId = ' + JSON.stringify( section.envId ) + ';',
			'	if ( envId && envId.indexOf( config( "env_id" ) ) === -1 ) {',
			'		return next();',
			'	}',
			'	controller.setSection( ' + JSON.stringify( section ) + ' )( context );',
			'	require( ' + JSON.stringify( section.module ) + ' )( controller.clientRouter );',
			'	next();',
			'} );\n'
		] );
	}, [] );

	return result.join( '\n' );
}

module.exports = {
	getSectionsModule,
	sectionsWithCSSUrls,
};