/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console, window, document */

import ClassicEditor from 'ckeditor5-editor-classic/src/classic';
import Enter from 'ckeditor5-enter/src/enter';
import Typing from 'ckeditor5-typing/src/typing';
import Heading from 'ckeditor5-heading/src/heading';
import Paragraph from 'ckeditor5-paragraph/src/paragraph';
import Bold from 'ckeditor5-basic-styles/src/bold';
import Italic from 'ckeditor5-basic-styles/src/italic';

ClassicEditor.create( document.querySelector( '#editor' ), {
	plugins: [ Enter, Typing, Paragraph, Heading, Bold, Italic ],
	toolbar: [ 'headings', 'bold', 'italic' ]
} )
.then( editor => {
	window.editor = editor;

	const sel = editor.document.selection;

	sel.on( 'change', ( evt, data ) => {
		const date = new Date();
		console.log( `${ date.getSeconds() }s${ String( date.getMilliseconds() ).slice( 0, 2 ) }ms`, evt.name, data );
	} );
} )
.catch( err => {
	console.error( err.stack );
} );