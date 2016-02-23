/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import EmitterMixin from '../emittermixin.js';
import Renderer from './renderer.js';
import Converter from './converter.js';
import Writer from './writer.js';

import utils from '../utils.js';

/**
 * TreeView class combines the actual tree of view elements, tree of DOM elements, {@link core.treeView.Converter converter},
 * {@link core.treeView.Renderer renderer} and all {@link core.treeView.Observer observers}. It creates an abstract layer over the
 * content editable area.
 *
 * If you want to only transform the tree of view elements to the DOM elements you can use the {@link core.treeView.Converter Converter}.
 *
 * @memberOf core.treeView
 * @mixes core.EmitterMixin
 */
export default class TreeView {
	/**
	 * Creates a TreeView based on the HTMLElement.
	 *
	 * The constructor copies the element name and attributes to create the
	 * root of the view, but does not copy its children. This means that the while rendering, the whole content of this
	 * root element will be removed when you call {@link core.treeView.TreeView#render render} but the root name and attributes will
	 * be preserved.
	 *
	 * @param {HTMLElement} domRoot DOM element in which the tree view should do change.
	 */
	constructor( domRoot ) {
		/**
		 * Root of the DOM tree.
		 *
		 * @member {HTMLElement} core.treeView.TreeView#domRoot
		 */
		this.domRoot = domRoot;

		/**
		 * Set of {@link core.treeView.Observer observers}.
		 *
		 * @member {Set.<core.treeView.Observer>} core.treeView.TreeView#observers
		 */
		this.observers = new Set();

		this.writer = new Writer();

		/**
		 * Instance of the {@link core.treeView.Converter converter} use by {@link core.treeView.TreeView#renderer renderer} and
		 * {@link core.treeView.TreeView#observers observers}.
		 *
		 * @member {core.treeView.Converter} core.treeView.TreeView#converter
		 */
		this.converter = new Converter();

		/**
		 * Root of the view tree.
		 *
		 * @member {core.treeView.Element} core.treeView.TreeView#viewRoot
		 */
		this.viewRoot = this.converter.domToView( domRoot, { bind: true, withChildren: false } );
		this.viewRoot.setTreeView( this );

		/**
		 * Instance of the {@link core.treeView.TreeView#renderer renderer}.
		 *
		 * @member {core.treeView.Renderer} core.treeView.TreeView#renderer
		 */
		this.renderer = new Renderer( this.converter );
		this.renderer.markToSync( 'CHILDREN', this.viewRoot );

		// Mark changed nodes in the renderer.
		this.viewRoot.on( 'change', ( evt, type, node ) => {
			this.renderer.markToSync( type, node );
		} );
	}

	/**
	 * Adds an observer to the set of observers. This method also {@link core.treeView.Observer#init initializes} and
	 * {@link core.treeView.Observer#attach attaches} the observer.
	 *
	 * @method core.treeView.TreeView#addObserver
	 * @param {core.treeView.Observer} observer Observer to add.
	 */
	addObserver( observer ) {
		this.observers.add( observer );
		observer.init( this );
		observer.attach();
	}

	/**
	 * Renders all changes. In order to avoid triggering the observers (e.g. mutations) all observers all detached
	 * before rendering and reattached after that.
	 *
	 * @method core.treeView.TreeView#render
	 */
	render() {
		for ( let observer of this.observers ) {
			observer.detach();
		}

		this.renderer.render();

		for ( let observer of this.observers ) {
			observer.attach();
		}
	}
}

utils.mix( TreeView, EmitterMixin );

/**
 * Enum representing type of the change.
 *
 * Possible values:
 *
 * * `CHILDREN` - for child list changes,
 * * `ATTRIBUTES` - for element attributes changes,
 * * `TEXT` - for text nodes changes.
 *
 * @typedef {String} core.treeView.ChangeType
 */
