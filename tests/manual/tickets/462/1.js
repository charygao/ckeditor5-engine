/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console, window, document, setInterval */

import ClassicEditor from 'ckeditor5-editor-classic/src/classic';
import Enter from 'ckeditor5-enter/src/enter';
import Typing from 'ckeditor5-typing/src/typing';
import Paragraph from 'ckeditor5-paragraph/src/paragraph';
import Bold from 'ckeditor5-basic-styles/src/bold';
import Italic from 'ckeditor5-basic-styles/src/italic';

ClassicEditor.create( document.querySelector( '#editor' ), {
	plugins: [ Enter, Typing, Paragraph, Bold, Italic ],
	toolbar: [ 'bold', 'italic' ]
} )
.then( editor => {
	window.editor = editor;

	setInterval( () => {
		console.clear();

		const domSelection = document.getSelection();
		const selectionExists = domSelection && domSelection.anchorNode;

		console.log( editor.editing.view.getDomRoot().innerHTML.replace( /\u200b/g, '@' ) );
		console.log( 'selection.hasAttribute( italic ):', editor.document.selection.hasAttribute( 'italic' ) );
		console.log( 'selection.hasAttribute( bold ):', editor.document.selection.hasAttribute( 'bold' ) );
		console.log( 'selection anchor\'s parentNode:', selectionExists ? domSelection.anchorNode.parentNode : 'no DOM selection' );
	}, 2000 );
} )
.catch( err => {
	console.error( err.stack );
} );