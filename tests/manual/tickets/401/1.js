/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console, document, window */

import ClassicEditor from 'ckeditor5-editor-classic/src/classic';
import Enter from 'ckeditor5-enter/src/enter';
import Typing from 'ckeditor5-typing/src/typing';
import Paragraph from 'ckeditor5-paragraph/src/paragraph';
import Bold from 'ckeditor5-basic-styles/src/bold';

ClassicEditor.create( document.getElementById( 'editor' ), {
	plugins: [ Enter, Typing, Paragraph, Bold ],
	toolbar: [ 'bold' ]
} )
.then( editor => {
	window.editor = editor;
} )
.catch( err => {
	console.error( err.stack );
} );