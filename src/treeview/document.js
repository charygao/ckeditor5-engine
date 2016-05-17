/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import Selection from './selection.js';
import Renderer from './renderer.js';
import Writer from './writer.js';
import DomConverter from './domconverter.js';
import { injectQuirksHandling } from './filler.js';

import mix from '../../utils/mix.js';
import EmitterMixin from '../../utils/emittermixin.js';

/**
 * Document class creates an abstract layer over the content editable area.
 * It combines the actual tree of view elements, tree of DOM elements,
 * {@link engine.treeView.DomConverter DOM Converter}, {@link engine.treeView.Renderer renderer} and all
 * {@link engine.treeView.Observer observers}.
 *
 * If you want to only transform the tree of view elements to the DOM elements you can use the
 * {@link engine.treeView.DomConverter DomConverter}.
 *
 * @memberOf engine.treeView
 * @mixes utils.EmitterMixin
 */
export default class Document {
	/**
	 * Creates a Document instance.
	 */
	constructor() {
		/**
		 * Roots of the DOM tree. Map on the `HTMLElement`s with roots names as keys.
		 *
		 * @readonly
		 * @member {Map} engine.treeView.Document#domRoots
		 */
		this.domRoots = new Map();

		/**
		 * Selection done on this document.
		 *
		 * @readonly
		 * @member {engine.treeView.Selection} engine.treeView.Document#selection
		 */
		this.selection = new Selection();

		/**
		 * Tree View writer.
		 *
		 * @readonly
		 * @member {engine.treeView.Writer} engine.treeView.Document#writer
		 */
		this.writer = new Writer();

		/**
		 * Instance of the {@link engine.treeView.DomConverter domConverter} use by
		 * {@link engine.treeView.Document#renderer renderer} and {@link engine.treeView.observer.Observer observers}.
		 *
		 * @readonly
		 * @member {engine.treeView.DomConverter} engine.treeView.Document#domConverter
		 */
		this.domConverter = new DomConverter();

		/**
		 * Roots of the view tree. Map of the {engine.treeView.Element view elements} with roots names as keys.
		 *
		 * @readonly
		 * @member {Map} engine.treeView.Document#viewRoots
		 */
		this.viewRoots = new Map();

		/**
		 * Instance of the {@link engine.treeView.Document#renderer renderer}.
		 *
		 * @readonly
		 * @member {engine.treeView.Renderer} engine.treeView.Document#renderer
		 */
		this.renderer = new Renderer( this.domConverter, this.selection );

		/**
		 * Map of registered {@link engine.treeView.Observer observers}.
		 *
		 * @private
		 * @member {Map.<Function, engine.treeView.Observer>} engine.treeView.Document_#observers
		 */
		this._observers = new Map();

		injectQuirksHandling( this );
	}

	/**
	 * Creates observer of the given type if not yet created, {@link engine.treeView.Observer#enable enables} it
	 * and {@link engine.treeView.observer.Observer#observe attaches} to all existing and future
	 * {@link engine.treeView.Document#domRoots DOM roots}.
	 *
	 * Note: Observers are recognized by their constructor (classes). A single observer will be instantiated and used only
	 * when registered for the first time. This means that features and other components can register a single observer
	 * multiple times without caring whether it has been already added or not.
	 *
	 * @param {Function} Observer The constructor of an observer to add.
	 * Should create an instance inheriting from {@link engine.treeView.observer.Observer}.
	 * @returns {engine.treeView.observer.Observer} Added observer instance.
	 */
	addObserver( Observer ) {
		let observer = this._observers.get( Observer );

		if ( observer ) {
			return observer;
		}

		observer = new Observer( this );

		this._observers.set( Observer, observer );

		for ( let [ name, domElement ] of this.domRoots ) {
			observer.observe( domElement, name );
		}

		observer.enable();

		return observer;
	}

	/**
	 * Returns observer of the given type or `undefined` if such observer has not been added yet.
	 *
	 * @param {Function} Observer The constructor of an observer to get.
	 * @returns {engine.treeView.observer.Observer|undefined} Observer instance or undefined.
	 */
	getObserver( Observer ) {
		return this._observers.get( Observer );
	}

	/**
	 * Creates a root for the HTMLElement. It adds elements to {@link engine.treeView.Document#domRoots} and
	 * {@link engine.treeView.Document#viewRoots}.
	 *
	 * The constructor copies the element name and attributes to create the
	 * root of the view, but does not copy its children. This means that while
	 * {@link engine.treeView.Document#render rendering}, the whole content of this
	 * root element will be removed but the root name and attributes will be preserved.
	 *
	 * @param {HTMLElement} domRoot DOM element in which the tree view should do change.
	 * @param {String} [name='main'] Name of the root.
	 * @returns {engine.treeView.element} The created view root element.
	 */
	createRoot( domRoot, name = 'main' ) {
		const viewRoot = this.domConverter.domToView( domRoot, { bind: true, withChildren: false } );
		viewRoot.setDocument( this );

		// Mark changed nodes in the renderer.
		viewRoot.on( 'change', ( evt, type, node ) => {
			this.renderer.markToSync( type, node );
		} );
		this.renderer.markToSync( 'CHILDREN', viewRoot );

		this.domRoots.set( name, domRoot );
		this.viewRoots.set( name, viewRoot );

		for ( let observer of this._observers.values() ) {
			observer.observe( domRoot, name );
		}

		return viewRoot;
	}

	/**
	 * Get a {@link engine.treeView.Document#viewRoots view root element} with the specified name. If the name is not
	 * specific "main" root is returned.
	 *
	 * @param {String} [name='main']  Name of the root.
	 * @returns {engine.treeView.element} The view root element with the specified name.
	 */
	getRoot( name = 'main' ) {
		return this.viewRoots.get( name );
	}

	/**
	 * Renders all changes. In order to avoid triggering the observers (e.g. mutations) all observers all detached
	 * before rendering and reattached after that.
	 */
	render() {
		for ( let observer of this._observers.values() ) {
			observer.disable();
		}

		this.renderer.render();

		for ( let observer of this._observers.values() ) {
			observer.enable();
		}
	}
}

mix( Document, EmitterMixin );

/**
 * Enum representing type of the change.
 *
 * Possible values:
 *
 * * `CHILDREN` - for child list changes,
 * * `ATTRIBUTES` - for element attributes changes,
 * * `TEXT` - for text nodes changes.
 *
 * @typedef {String} engine.treeView.ChangeType
 */