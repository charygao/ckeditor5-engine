/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Document from 'ckeditor5-engine/src/model/document';
import Position from 'ckeditor5-engine/src/model/position';
import Element from 'ckeditor5-engine/src/model/element';
import Text from 'ckeditor5-engine/src/model/text';
import CKEditorError from 'ckeditor5-utils/src/ckeditorerror';

import MergeDelta from 'ckeditor5-engine/src/model/delta/mergedelta';
import SplitDelta from 'ckeditor5-engine/src/model/delta/splitdelta';

import InsertOperation from 'ckeditor5-engine/src/model/operation/insertoperation';
import MoveOperation from 'ckeditor5-engine/src/model/operation/moveoperation';
import RemoveOperation from 'ckeditor5-engine/src/model/operation/removeoperation';

import count from 'ckeditor5-utils/src/count';

describe( 'Batch', () => {
	let doc, root, p;

	beforeEach( () => {
		doc = new Document();
		root = doc.createRoot();

		p = new Element( 'p', { key: 'value' }, new Text( 'foobar' ) );

		root.insertChildren( 0, p );
	} );

	describe( 'split', () => {
		it( 'should split foobar to foo and bar', () => {
			doc.batch().split( new Position( root, [ 0, 3 ] ) );

			expect( root.maxOffset ).to.equal( 2 );

			expect( root.getChild( 0 ).name ).to.equal( 'p' );
			expect( root.getChild( 0 ).maxOffset ).to.equal( 3 );
			expect( count( root.getChild( 0 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 0 ).getAttribute( 'key' ) ).to.equal( 'value' );
			expect( root.getChild( 0 ).getChild( 0 ).data ).to.equal( 'foo' );

			expect( root.getChild( 1 ).name ).to.equal( 'p' );
			expect( root.getChild( 1 ).maxOffset ).to.equal( 3 );
			expect( count( root.getChild( 1 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 1 ).getAttribute( 'key' ) ).to.equal( 'value' );
			expect( root.getChild( 1 ).getChild( 0 ).data ).to.equal( 'bar' );
		} );

		it( 'should create an empty paragraph if we split at the end', () => {
			doc.batch().split( new Position( root, [ 0, 6 ] ) );

			expect( root.maxOffset ).to.equal( 2 );

			expect( root.getChild( 0 ).name ).to.equal( 'p' );
			expect( root.getChild( 0 ).maxOffset ).to.equal( 6 );
			expect( count( root.getChild( 0 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 0 ).getAttribute( 'key' ) ).to.equal( 'value' );
			expect( root.getChild( 0 ).getChild( 0 ).data ).to.equal( 'foobar' );

			expect( root.getChild( 1 ).name ).to.equal( 'p' );
			expect( root.getChild( 1 ).maxOffset ).to.equal( 0 );
			expect( count( root.getChild( 1 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 1 ).getAttribute( 'key' ) ).to.equal( 'value' );
		} );

		it( 'should throw if we try to split a root', () => {
			expect( () => {
				doc.batch().split( new Position( root, [ 0 ] ) );
			} ).to.throw( CKEditorError, /^batch-split-root/ );
		} );

		it( 'should be chainable', () => {
			const batch = doc.batch();

			const chain = batch.split( new Position( root, [ 0, 3 ] ) );
			expect( chain ).to.equal( batch );
		} );

		it( 'should add delta to batch and operation to delta before applying operation', () => {
			sinon.spy( doc, 'applyOperation' );
			const batch = doc.batch().split( new Position( root, [ 0, 3 ] ) );

			const correctDeltaMatcher = sinon.match( ( operation ) => {
				return operation.delta && operation.delta.batch && operation.delta.batch == batch;
			} );

			expect( doc.applyOperation.calledWith( correctDeltaMatcher ) ).to.be.true;
		} );
	} );
} );

describe( 'SplitDelta', () => {
	let splitDelta, doc, root;

	beforeEach( () => {
		doc = new Document();
		root = doc.createRoot();
		splitDelta = new SplitDelta();
	} );

	describe( 'constructor()', () => {
		it( 'should create split delta with no operations added', () => {
			expect( splitDelta.operations.length ).to.equal( 0 );
		} );
	} );

	describe( 'position', () => {
		it( 'should be null if there are no operations in delta', () => {
			expect( splitDelta.position ).to.be.null;
		} );

		it( 'should be equal to the position where node is split', () => {
			splitDelta.operations.push( new InsertOperation( new Position( root, [ 1, 2 ] ), new Element( 'p' ), 0 ) );
			splitDelta.operations.push( new MoveOperation( new Position( root, [ 1, 1, 4 ] ), 4, new Position( root, [ 1, 2, 0 ] ), 1 ) );

			expect( splitDelta.position.root ).to.equal( root );
			expect( splitDelta.position.path ).to.deep.equal( [ 1, 1, 4 ] );
		} );
	} );

	describe( 'getReversed', () => {
		it( 'should return empty MergeDelta if there are no operations in delta', () => {
			let reversed = splitDelta.getReversed();

			expect( reversed ).to.be.instanceof( MergeDelta );
			expect( reversed.operations.length ).to.equal( 0 );
		} );

		it( 'should return correct SplitDelta', () => {
			splitDelta.operations.push( new InsertOperation( new Position( root, [ 1, 2 ] ), new Element( 'p' ), 0 ) );
			splitDelta.operations.push( new MoveOperation( new Position( root, [ 1, 1, 4 ] ), 4, new Position( root, [ 1, 2, 0 ] ), 1 ) );

			let reversed = splitDelta.getReversed();

			expect( reversed ).to.be.instanceof( MergeDelta );
			expect( reversed.operations.length ).to.equal( 2 );

			expect( reversed.operations[ 0 ] ).to.be.instanceof( MoveOperation );
			expect( reversed.operations[ 0 ].sourcePosition.path ).to.deep.equal( [ 1, 2, 0 ] );
			expect( reversed.operations[ 0 ].howMany ).to.equal( 4 );
			expect( reversed.operations[ 0 ].targetPosition.path ).to.deep.equal( [ 1, 1, 4 ] );

			expect( reversed.operations[ 1 ] ).to.be.instanceof( RemoveOperation );
			expect( reversed.operations[ 1 ].sourcePosition.path ).to.deep.equal( [ 1, 2 ] );
			expect( reversed.operations[ 1 ].howMany ).to.equal( 1 );
		} );
	} );

	describe( '_cloneOperation', () => {
		it( 'should return null if delta has no operations', () => {
			expect( splitDelta._cloneOperation ).to.be.null;
		} );

		it( 'should return the first operation in the delta, which is InsertOperation or ReinsertOperation', () => {
			let p = new Element( 'p' );
			splitDelta.operations.push( new InsertOperation( new Position( root, [ 1, 2 ] ), p, 0 ) );
			splitDelta.operations.push( new MoveOperation( new Position( root, [ 1, 1, 4 ] ), 4, new Position( root, [ 1, 2, 0 ] ), 1 ) );

			expect( splitDelta._cloneOperation ).to.be.instanceof( InsertOperation );
			expect( splitDelta._cloneOperation.nodes.getNode( 0 ) ).to.equal( p );
			expect( splitDelta._cloneOperation.position.path ).to.deep.equal( [ 1, 2 ] );
		} );
	} );

	it( 'should provide proper className', () => {
		expect( SplitDelta.className ).to.equal( 'engine.model.delta.SplitDelta' );
	} );
} );

