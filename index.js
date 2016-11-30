const postcss = require('postcss');

module.exports = postcss.plugin('postcss-alphabetize', (opts = {}) => {
	let result;
	
	const isVariableDeclaration = /^\$[\w-]+$/;
	const ignore = /!ignore/g;

	/**
	 * @param  {postcss.Rule} nodes
	 * @return {postcss.Rule} nodes
	 */
	function alphabetize(nodes) {
		// Strip multiple newlines
		nodes = stripNewLines(nodes);

		// Sort the nodes alphabetically
		nodes.sort(dynamicSort('prop'));

		// Add a new line after variable declarations
		nodes = addNewLineAfterVars(nodes);
	}

	/**
	 * Remove extraneous newlines
	 * 
	 * @param  {postcss.Rule} nodes
	 * @return {postcss.Rule} nodes
	 */
	function stripNewLines(nodes) {
		each(nodes, (node, i) => {
			node.raws.before = node.raws.before.replace(/\n\s*\n/g, '\n');


			// Remove extraneous newlines on the last declaration if they exist
			if (! node.next() && node.raws.after) {
				node.raws.after = node.raws.after.replace(/\n\s*\n/g, '\n');
			}
		});

		return nodes;
	}

	/**
	 * Add a new line after variable declaration blocks
	 * 
	 * @param {postcss.Rule} nodes
	 */
	function addNewLineAfterVars(nodes) {
		let c = 0;

		each(nodes, (node, i) => {
			if (node.prop && isVar(node.prop)) {
				c++;
			}
		});

		// Ensure previous block is a var declaration
		if (nodes[c].prev() && isVar(nodes[c].prev().prop)) {
			nodes[c].raws.before = nodes[c].raws.before.replace('\n', '\n\n');
		}

		return nodes;
	}

	/**
	 * Sort properties 
	 * 
	 * @param  {string} property
	 * @return {Array}
	 */
	function dynamicSort(prop) {
		return function (a, b) {
			if (proceedWith(a) && proceedWith(b)) {
				let propA = a[prop],
					propB = b[prop];

				return ((propA < propB) ? -1 : (propA > propB) ? 1 : 0);
			}

			return 0;
		}
	}

	/**
	 * Determine whether to proceed with the current sort
	 * 
	 * @param  {postcss.Rule} node
	 * @return {boolean}
	 */
	function proceedWith(node) {
		let val = node.value,
			prop = node.prop,
			sortVars = opts.sortVariables === true;

		return ! (
			(prop && isVar(prop)) || (val && val.includes('!ignore'))
		)
	}

	function isVar(prop) {
		return prop.match(isVariableDeclaration);
	}

	/**
	 * @param  {postcss.Rule} nodes
	 * @param  {Function} callback function
	 */
	function each(arr, cb) {
		let len = arr.length,
			i = 0;

		for (; i < len; i++) {
			cb(arr[i], i);
		}
	}

	return (root, res) => {
		root.walkRules(rule => {
			alphabetize(rule.nodes);
		});
	}
});