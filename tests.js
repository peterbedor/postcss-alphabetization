const expect = require('chai').expect;
const postcss = require('postcss');
const plugin = require('./');

function process(input, expected, opts = {}) {
	return postcss([ plugin(opts) ]).process(input)
		.then((result) => {
			expect(result.css).to.equal(expected);
			expect(result.warnings().length).to.equal(0);
		});
}

function processFail(input, expected, opts = {}) {
	return postcss([ plugin(opts) ]).process(input)
		.then((result) => {
			expect(result.css).to.equal(expected);
			expect(result.warnings().length).to.equal(1);
		});
}

describe('Alphabetization', () => {
	it('should alphabetize properties', () => {
		return process(
			`.sel {
				display: block;
				z-index: 10;
				align-items: middle;
				vertical-align: middle;
			}`,
			`.sel {
				align-items: middle;
				display: block;
				vertical-align: middle;
				z-index: 10;
			}`)
	});

	it('should alphabetize dashed properties', () => {
		return process(
			`.sel {
				font-weight: bold;
				background-origin: red;
				font-size: 10px;
				background-color: red;
				font-family: Helvetica;
				background-attachment: fixed;
				background-size: cover;
				font: 10/10px;
				background-position: center center;
				background-clip: none;
				font-variant: italic;
				background-repeat: repeat-x;
			}`,
			`.sel {
				background-attachment: fixed;
				background-clip: none;
				background-color: red;
				background-origin: red;
				background-position: center center;
				background-repeat: repeat-x;
				background-size: cover;
				font: 10/10px;
				font-family: Helvetica;
				font-size: 10px;
				font-variant: italic;
				font-weight: bold;
			}`)
		});

	it('should alphabetize nested selector properties', () => {
		return process(
			`.sel {
				align-items: middle;
				z-index: 10;
				display: block;
				&__nested {
					z-index: 20;
					justify-content: space-between;
					display: block;
					&.-modifier {
						font-weight: bold;
						font-family: Helvetica;
						z-index: 30;
						font-size: 10px;
					}
				}
			}`,
			`.sel {
				align-items: middle;
				display: block;
				z-index: 10;
				&__nested {
					display: block;
					justify-content: space-between;
					z-index: 20;
					&.-modifier {
						font-family: Helvetica;
						font-size: 10px;
						font-weight: bold;
						z-index: 30;
					}
				}
			}`)
	});

	it('should alphabetize state properties', () => {
		return process(
			`a {
				z-index: 100;
				display: block;
				&:visited,
				&:active {
					font-size: 100px;
					color: red;
				}
				&:hover {
					text-decoration: underline;
					font-weight: 600;
				}
			}`,
			`a {
				display: block;
				z-index: 100;
				&:visited,
				&:active {
					color: red;
					font-size: 100px;
				}
				&:hover {
					font-weight: 600;
					text-decoration: underline;
				}
			}`)
	});

	it('should add new line after variable declarations', () => {
		return process(
			`.sel {
				$var: 10px;
				$alpha: 10%;
				vertical-align: middle;
				backgorund-color: $alpha;
			}`,
			`.sel {
				$var: 10px;
				$alpha: 10%;

				backgorund-color: $alpha;
				vertical-align: middle;
			}`);
	});

	it('should remove extraneous new lines', () => {
		return process(
			`.sel {


				$var: 20px;
				


				&__nested {

					$var: 10px;



					z-index: 10 !ignore;

					align-items: middle !ignore;

				}
			}`,
			`.sel {
				$var: 20px;

				&__nested {
					$var: 10px;

					z-index: 10 !ignore;
					align-items: middle !ignore;
				}
			}`);
	});

	it('should ignore variable declaration', () => {
		return process(
			`.sel {
				$zeta: value;
				$alpha: 100;

				align-items: middle;
				z-index: 10;
				display: block;
			}`,
			`.sel {
				$zeta: value;
				$alpha: 100;

				align-items: middle;
				display: block;
				z-index: 10;
			}`);
	});

	it('should ignore !ignore', () => {
		return process(
			`.sel {
				$var: 10px;
				z-index: 10 !ignore;
				background-color: red !ignore;
				align-items: middle !ignore;
				position: absolute;
				left: 10px;
			}`,
			`.sel {
				$var: 10px;

				z-index: 10 !ignore;
				background-color: red !ignore;
				align-items: middle !ignore;
				left: 10px;
				position: absolute;
			}`);
	});

	it('should ignore nested !ignore', () => {
		return process(
			`.sel {
				$var: 20px;
				&__nested {
					$var: 10px;

					z-index: 10 !ignore;
					align-items: middle !ignore;
					position: absolute;
					left: 10px;
				}
			}`,
			`.sel {
				$var: 20px;

				&__nested {
					$var: 10px;

					z-index: 10 !ignore;
					align-items: middle !ignore;
					left: 10px;
					position: absolute;
				}
			}`);
	});

	it('should ignore lines preceeded by comments', () => {
		return process(
			`.sel {
				// Comment
				z-index: 100;
				vertical-align: middle;
				text-align: center;
			}`,
			`.sel {
				// Comment
				z-index: 100;
				text-align: center;
				vertical-align: middle;
			}`)
	});

	it('should mostly work with weird syntax', () => {
		return process(
			`.sel {
				!789test: 30px;
				!345test: 20px;
				!456test: 10px;
				fcool: 50px;
				123test: 30px;
			}`,
			`.sel {
				!345test: 20px;
				!456test: 10px;
				!789test: 30px;
				123test: 30px;
				fcool: 50px;
			}`);
	});

	it('should move variable properties to the top', () => {
		return process(
			`.sel {
				z-index: 10;
				text-align: center;
				background-color: red;
				$(zed): purple;
				vertical-align: middle;
				$(alpha): red;
				$(bravo): orange !ignore;
			}`,
			`.sel {
				$(alpha): red;
				$(zed): purple;
				background-color: red;
				text-align: center;
				vertical-align: middle;
				z-index: 10;
				$(bravo): orange !ignore;
			}`);
	});

	it('should ignore top level variables', () => {
		return process(
			`$var: 20px;
			$beta.nested: 50px;
			$alpha: 10px;

			.sel {
				z-index: 10;
				text-align: center;
				background-color: red;
				vertical-align: middle;
			}`,
			`$var: 20px;
			$beta.nested: 50px;
			$alpha: 10px;

			.sel {
				background-color: red;
				text-align: center;
				vertical-align: middle;
				z-index: 10;
			}`);
	});
});