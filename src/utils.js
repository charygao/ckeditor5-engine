/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import isPlainObject from './lib/lodash/isPlainObject.js';

/**
 * @namespace core.utils
 */
const utils = {
	/**
	 * Creates a spy function (ala Sinon.js) that can be used to inspect call to it.
	 *
	 * The following are the present features:
	 *
	 * * spy.called: property set to `true` if the function has been called at least once.
	 *
	 * @memberOf core.utils
	 * @returns {Function} The spy function.
	 */
	spy() {
		return function spy() {
			spy.called = true;
		};
	},

	/**
	 * Returns a unique id. This id is a number (starting from 1) which will never get repeated on successive calls
	 * to this method.
	 *
	 * @function
	 * @memberOf core.utils
	 * @returns {Number} A number representing the id.
	 */
	uid: ( () => {
		let next = 1;

		return () => {
			return next++;
		};
	} )(),

	/**
	 * Checks if value implements iterator interface.
	 *
	 * @memberOf core.utils
	 * @param {*} value The value to check.
	 * @returns {Boolean} True if value implements iterator interface.
	 */
	isIterable( value ) {
		return !!( value && value[ Symbol.iterator ] );
	},

	/**
	 * Compares how given arrays relate to each other. One array can be: same as another array, prefix of another array
	 * or completely different. If arrays are different, first index at which they differ is returned. Otherwise,
	 * a flag specifying the relation is returned. Flags are negative numbers, so whenever a number >= 0 is returned
	 * it means that arrays differ.
	 *
	 *		compareArrays( [ 0, 2 ], [ 0, 2 ] );		// 'SAME'
	 *		compareArrays( [ 0, 2 ], [ 0, 2, 1 ] );		// 'PREFIX'
	 *		compareArrays( [ 0, 2 ], [ 0 ] );			// 'EXTENSION'
	 *		compareArrays( [ 0, 2 ], [ 1, 2 ] );		// 0
	 *		compareArrays( [ 0, 2 ], [ 0, 1 ] );		// 1
	 *
	 * @memberOf core.utils
	 * @param {Array} a Array that is compared.
	 * @param {Array} b Array to compare with.
	 * @returns {utils.ArrayRelation} How array `a` is related to `b`.
	 */
	compareArrays( a, b ) {
		const minLen = Math.min( a.length, b.length );

		for ( let i = 0; i < minLen; i++ ) {
			if ( a[ i ] != b[ i ] ) {
				// The arrays are different.
				return i;
			}
		}

		// Both arrays were same at all points.
		if ( a.length == b.length ) {
			// If their length is also same, they are the same.
			return 'SAME';
		} else if ( a.length < b.length ) {
			// Compared array is shorter so it is a prefix of the other array.
			return 'PREFIX';
		} else {
			// Compared array is longer so it is an extension of the other array.
			return 'EXTENSION';
		}
	},

	/**
	 * Transforms object to map.
	 *
	 *		const map = utils.objectToMap( { 'foo': 1, 'bar': 2 } );
	 *		map.get( 'foo' ); // 1
	 *
	 * @memberOf core.utils
	 * @param {Object} obj Object to transform.
	 * @returns {Map} Map created from object.
	 */
	objectToMap( obj ) {
		const map = new Map();

		for ( let key in obj ) {
			map.set( key, obj[ key ] );
		}

		return map;
	},

	/**
	 * Transforms object or iterable to map. Iterable needs to be in the format acceptable by the `Map` constructor.
	 *
	 *		map = utils.toMap( { 'foo': 1, 'bar': 2 } );
	 *		map = utils.toMap( [ [ 'foo', 1 ], [ 'bar', 2 ] ] );
	 *		map = utils.toMap( anotherMap );
	 *
	 * @memberOf core.utils
	 * @param {Object|Iterable} data Object or iterable to transform.
	 * @returns {Map} Map created from data.
	 */
	toMap( data ) {
		if ( isPlainObject( data ) ) {
			return utils.objectToMap( data );
		} else {
			return new Map( data );
		}
	},

	/**
	 * Checks whether given {Map}s are equal, that is has same size and same key-value pairs.
	 *
	 * @memberOf core.utils
	 * @returns {Boolean} `true` if given maps are equal, `false` otherwise.
	 */
	mapsEqual( mapA, mapB ) {
		if ( mapA.size != mapB.size ) {
			return false;
		}

		for ( let attr of mapA.entries() ) {
			let valA = JSON.stringify( attr[ 1 ] );
			let valB = JSON.stringify( mapB.get( attr[ 0 ] ) );

			if ( valA !== valB ) {
				return false;
			}
		}

		return true;
	},

	/**
	 * Returns `nth` (starts from `0` of course) item of an `iterable`.
	 *
	 * @memberOf core.utils
	 * @param {Number} index
	 * @param {Iterable.<*>} iterable
	 * @returns {*}
	 */
	nth( index, iterable ) {
		for ( let item of iterable ) {
			if ( index === 0 ) {
				return item;
			}
			index -= 1;
		}

		return null;
	},

	/**
	 * Returns the number of items return by the iterator.
	 *
	 *		utils.count( [ 1, 2, 3, 4, 5 ] ); // 5;
	 *
	 * @param {Iterable.<*>} iterator Any iterator.
	 * @returns {Number} Number of items returned by that iterator.
	 */
	count( iterator ) {
		let count = 0;

		for ( let _ of iterator ) { // jshint ignore:line
			count++;
		}

		return count;
	},

	/**
	 * Copies enumerable properties and symbols from the objects given as 2nd+ parameters to the
	 * prototype of first object (a constructor).
	 *
	 *		class Editor {
	 *			...
	 *		}
	 *
	 *		const SomeMixin = {
	 *			a() {
	 *				return 'a';
	 *			}
	 *		};
	 *
	 *		utils.mix( Editor, SomeMixin, ... );
	 *
	 *		new Editor().a(); // -> 'a'
	 *
	 * Note: Properties which already exist in the base class will not be overriden.
	 *
	 * @memberOf core.utils
	 * @param {Function} [baseClass] Class which prototype will be extended.
	 * @param {Object} [...mixins] Objects from which to get properties.
	 */
	mix( baseClass, ...mixins ) {
		mixins.forEach( ( mixin ) => {
			Object.getOwnPropertyNames( mixin ).concat( Object.getOwnPropertySymbols( mixin ) )
				.forEach( ( key ) => {
					if ( key in baseClass.prototype ) {
						return;
					}

					const sourceDescriptor = Object.getOwnPropertyDescriptor( mixin, key );
					sourceDescriptor.enumerable = false;

					Object.defineProperty( baseClass.prototype, key, sourceDescriptor );
				} );
		} );
	}
};

/**
 * An index at which arrays differ. If arrays are same at all indexes, it represents how arrays are related.
 * In this case, possible values are: `'SAME'`, `'PREFIX'` or `'EXTENSION'`.
 *
 * @memberOf core.utils
 * @typedef {String|Number} ArrayRelation
 */

export default utils;
