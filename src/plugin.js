/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * The base class for CKEditor plugin classes.
 *
 * @class Plugin
 * @extends Model
 */

CKEDITOR.define( [ 'model' ], function( Model ) {
	class Plugin extends Model {
		constructor( editor ) {
			super();

			this.editor = editor;
		}

		init() {}
	}

	return Plugin;
} );