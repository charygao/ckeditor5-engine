/**
 * @license Copyright (c) 2003-20'INSERT'6, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import { getData, setData } from '/tests/engine/_utils/model.js';
import Document from '/ckeditor5/engine/treemodel/document.js';
import Element from '/ckeditor5/engine/treemodel/element.js';
import Text from '/ckeditor5/engine/treemodel/text.js';
import Range from '/ckeditor5/engine/treemodel/range.js';

describe( 'model test utils', () => {
	let document, root, selection;

	beforeEach( () => {
		document = new Document();
		root = document.createRoot( 'main', '$root' );
		selection = document.selection;

		selection.removeAllRanges();
	} );

	describe( 'getData', () => {
		it( 'writes elements and texts', () => {
			root.appendChildren( [
				new Element( 'a', null, 'atext' ),
				new Element( 'b', null, [
					new Element( 'c1' ),
					'ctext',
					new Element( 'c2' )
				] ),
				new Element( 'd' )
			] );

			expect( getData( document, 'main' ) ).to.equal(
				'<a>atext</a><b><c1></c1>ctext<c2></c2></b><d></d>'
			);
		} );

		it( 'writes element attributes', () => {
			root.appendChildren(
				new Element( 'a', { foo: true, bar: 1, car: false }, [
					new Element( 'b', { fooBar: 'x y', barFoo: { x: 1, y: 2 } } )
				] )
			);

			// Note: attributes are written in a very simplistic way, because they are not to be parsed. They are just
			// to be compared in the tests with some patterns.
			expect( getData( document, 'main' ) ).to.equal(
				'<a bar=1 car=false foo=true><b barFoo={"x":1,"y":2} fooBar="x y"></b></a>'
			);
		} );

		it( 'writes text attributes', () => {
			root.appendChildren( [
				new Text( 'foo', { bold: true } ),
				'bar',
				new Text( 'bom', { bold: true, italic: true } ),
				new Element( 'a', null, [
					new Text( 'pom', { underline: true, bold: true } )
				] )
			] );

			expect( getData( document, 'main' ) ).to.equal(
				'<$text bold=true>foo</$text>' +
				'bar' +
				'<$text bold=true italic=true>bom</$text>' +
				'<a><$text bold=true underline=true>pom</$text></a>'
			);
		} );

		describe( 'options.selection', () => {
			let elA, elB;
			const options = { selection: true };

			beforeEach( () => {
				elA = new Element( 'a' );
				elB = new Element( 'b' );

				root.appendChildren( [
					elA,
					'foo',
					new Text( 'bar', { bold: true } ),
					elB
				] );
			} );

			it( 'writes selection collapsed in an element', () => {
				selection.collapse( root );

				expect( getData( document, 'main', options ) ).to.equal(
					'<selection /><a></a>foo<$text bold=true>bar</$text><b></b>'
				);
			} );

			it( 'writes selection collapsed in a text', () => {
				selection.collapse( root, 3 );

				expect( getData( document, 'main', options ) ).to.equal(
					'<a></a>fo<selection />o<$text bold=true>bar</$text><b></b>'
				);
			} );

			it( 'writes selection collapsed at the text left boundary', () => {
				selection.collapse( elA, 'AFTER' );

				expect( getData( document, 'main', options ) ).to.equal(
					'<a></a><selection />foo<$text bold=true>bar</$text><b></b>'
				);
			} );

			it( 'writes selection collapsed at the text right boundary', () => {
				selection.collapse( elB, 'BEFORE' );

				expect( getData( document, 'main', options ) ).to.equal(
					'<a></a>foo<$text bold=true>bar</$text><selection bold=true /><b></b>'
				);
			} );

			it( 'writes selection collapsed at the end of the root', () => {
				selection.collapse( root, 'END' );

				// Needed due to https://github.com/ckeditor/ckeditor5-engine/issues/320.
				selection.clearAttributes();

				expect( getData( document, 'main', options ) ).to.equal(
					'<a></a>foo<$text bold=true>bar</$text><b></b><selection />'
				);
			} );

			it( 'writes selection attributes', () => {
				selection.collapse( root );
				selection.setAttributesTo( { italic: true, bold: true } );

				expect( getData( document, 'main', options ) ).to.equal(
					'<selection bold=true italic=true /><a></a>foo<$text bold=true>bar</$text><b></b>'
				);
			} );

			it( 'writes selection collapsed selection in a text with attributes', () => {
				selection.collapse( root, 5 );

				expect( getData( document, 'main', options ) ).to.equal(
					'<a></a>foo<$text bold=true>b<selection bold=true />ar</$text><b></b>'
				);
			} );

			it( 'writes flat selection containing couple of nodes', () => {
				selection.addRange(
					Range.createFromParentsAndOffsets( root, 0, root, 4 )
				);

				expect( getData( document, 'main', options ) ).to.equal(
					'<selection><a></a>foo</selection><$text bold=true>bar</$text><b></b>'
				);
			} );

			it( 'writes flat selection within text', () => {
				selection.addRange(
					Range.createFromParentsAndOffsets( root, 2, root, 3 )
				);

				expect( getData( document, 'main', options ) ).to.equal(
					'<a></a>f<selection>o</selection>o<$text bold=true>bar</$text><b></b>'
				);
			} );

			it( 'writes multi-level selection', () => {
				selection.addRange(
					Range.createFromParentsAndOffsets( elA, 0, elB, 0 )
				);

				expect( getData( document, 'main', options ) ).to.equal(
					'<a><selection></a>foo<$text bold=true>bar</$text><b></selection></b>'
				);
			} );

			it( 'writes backward selection', () => {
				selection.addRange(
					Range.createFromParentsAndOffsets( elA, 0, elB, 0 ),
					true
				);

				expect( getData( document, 'main', options ) ).to.equal(
					'<a><selection backward></a>foo<$text bold=true>bar</$text><b></selection></b>'
				);
			} );
		} );
	} );

	describe( 'setData', () => {
		test( 'creates elements', {
			data: '<a></a><b><c></c></b>'
		} );

		test( 'creates text nodes', {
			data: 'foo<a>bar</a>bom'
		} );

		test( 'sets elements attributes', {
			data: '<a foo=1 bar=true car="x y"><b x="y"></b></a>',
			output: '<a bar=true car="x y" foo=1><b x="y"></b></a>',
			check() {
				expect( root.getChild( 0 ).getAttribute( 'car' ) ).to.equal( 'x y' );
			}
		} );

		test( 'sets complex attributes', {
			data: '<a foo={"a":1,"b":"c"}></a>',
			check() {
				expect( root.getChild( 0 ).getAttribute( 'foo' ) ).to.have.property( 'a', 1 );
			}
		} );

		test( 'sets text attributes', {
			data: '<$text bold=true italic=true>foo</$text><$text bold=true>bar</$text>bom',
			check() {
				expect( root.getChildCount() ).to.equal( 9 );
				expect( root.getChild( 0 ) ).to.have.property( 'character', 'f' );
				expect( root.getChild( 0 ).getAttribute( 'italic' ) ).to.equal( true );
			}
		} );

		it( 'throws when unexpected closing tag', () => {
			expect( () => {
				setData( document, 'main', '<a><b></a></b>' );
			} ).to.throw();
		} );

		it( 'throws when unexpected attribute', () => {
			expect( () => {
				setData( document, 'main', '<a ?></a>' );
			} ).to.throw();
		} );

		it( 'throws when incorrect tag', () => {
			expect( () => {
				setData( document, 'main', '<a' );
			} ).to.throw();
		} );

		it( 'throws when missing closing tag', () => {
			expect( () => {
				setData( document, 'main', '<a><b></b>' );
			} ).to.throw();
		} );

		it( 'throws when missing closing tag for text', () => {
			expect( () => {
				setData( document, 'main', '</$text>' );
			} ).to.throw();
		} );

		describe( 'selection', () => {
			const getDataOptions = { selection: true };

			test( 'sets collapsed selection in an element', {
				data: '<a><selection /></a>',
				getDataOptions,
				check() {
					expect( document.selection.getFirstPosition().parent ).to.have.property( 'name', 'a' );
				}
			} );

			test( 'sets collapsed selection between elements', {
				data: '<a></a><selection /><b></b>',
				getDataOptions
			} );

			test( 'sets collapsed selection before a text', {
				data: '<a></a><selection />foo',
				getDataOptions
			} );

			test( 'sets collapsed selection after a text', {
				data: 'foo<selection />',
				getDataOptions
			} );

			test( 'sets collapsed selection within a text', {
				data: 'foo<selection />bar',
				getDataOptions,
				check() {
					expect( root.getChildCount() ).to.equal( 6 );
				}
			} );

			test( 'sets selection attributes', {
				data: 'foo<selection bold=true italic=true />bar',
				getDataOptions,
				check() {
					expect( root.getChildCount() ).to.equal( 6 );
				}
			} );

			test( 'sets collapsed selection between text and text with attributes', {
				data: 'foo<selection /><$text bold=true>bar</$text>',
				getDataOptions,
				check() {
					expect( root.getChildCount() ).to.equal( 6 );
					expect( document.selection.getAttribute( 'bold' ) ).to.be.undefined;
				}
			} );

			test( 'sets selection containing an element', {
				data: 'x<selection><a></a></selection>',
				getDataOptions
			} );

			test( 'sets selection with attribute containing an element', {
				data: 'x<selection bold=true><a></a></selection>',
				getDataOptions
			} );

			test( 'sets a backward selection containing an element', {
				data: 'x<selection backward bold=true><a></a></selection>',
				getDataOptions
			} );

			test( 'sets selection within a text', {
				data: 'x<selection bold=true>y</selection>z',
				getDataOptions
			} );

			test( 'sets selection within a text with different attributes', {
				data: '<$text bold=true>fo<selection bold=true>o</$text>ba</selection>r',
				getDataOptions
			} );

			it( 'throws when missing selection start', () => {
				expect( () => {
					setData( document, 'main', 'foo</selection>' );
				} ).to.throw();
			} );

			it( 'throws when missing selection end', () => {
				expect( () => {
					setData( document, 'main', '<selection>foo' );
				} ).to.throw();
			} );
		} );

		function test( title, options ) {
			it( title, () => {
				let output = options.output || options.data;

				setData( document, 'main', options.data, options.setDataOptions );

				expect( getData( document, 'main', options.getDataOptions ) ).to.equal( output );

				if ( options.check ) {
					options.check();
				}
			} );
		}
	} );
} );
