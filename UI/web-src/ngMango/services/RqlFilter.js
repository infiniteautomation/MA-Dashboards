/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

const comparatorPredicates = {
    eq: val => val === 0,
    ne: val => val !== 0,
    le: val => val <= 0,
    ge: val => val >= 0,
    lt: val => val < 0,
    gt: val => val > 0
};

const tokenSubstitutes = {
    '\\\\': `\\\\`,
    '\\*': '\\*',
    '\\?': '\\?',
    '*': '.*',
    '?': '.'
};

export class RqlVisitor {

    constructor(options) {
        Object.assign(this, options);
    }

    visit(node) {
        if (typeof this[node.name] === 'function') {
            return this[node.name](node.args);
        }

        if (!comparatorPredicates.hasOwnProperty(node.name)) {
            throw new Error('Unsupported node type: ' + node.name);
        }

        // default implementation for comparison operations
        const propertyName = node.args[0];
        const target = node.args[1];
        const comparator = this.getComparator(propertyName);
        const predicate = comparatorPredicates[node.name];
        return item => predicate(comparator(this.getProperty(item, propertyName), target));
    }

    and(args) {
        const children = args.map(a => this.visit(a));
        return item => children.every(p => p(item));
    }

    or(args) {
        const children = args.map(a => this.visit(a));
        return item => children.some(p => p(item));
    }

    not(args) {
        return !this.and(args);
    }

    limit(args) {
        if (args.length) {
            this.limitValue = args[0];
            this.offset = args.length > 1 ? args[1] : 0;
        }
        return item => true;
    }

    sort(args) {
        this.sortComparator = args.reduce((prev, arg) => {
            let descending = false;
            let propertyName = null;

            if (Array.isArray(arg)) {
                propertyName = arg[0];
                if (arg.length > 1) {
                    descending = !!arg[1];
                }
            } else if (arg != null) {
                // null propertyName means the object itself
                if (arg.startsWith('-')) {
                    descending = true;
                    propertyName = arg.substring(1);
                } else if (arg.startsWith('+')) {
                    propertyName = arg.substring(1);
                } else {
                    propertyName = arg;
                }
            }

            let comparator = this.getSortComparator(propertyName);
            if (descending) {
                comparator = this.constructor.reverseComparator(comparator);
            }
            return this.constructor.thenComparator(prev, comparator);
        }, null);
        return item => true;
    }

    in(args) {
        const propertyName = args[0];
        const searchIn = Array.isArray(args[1]) ? args[1] : args.slice(1);
        const comparator = this.getComparator(propertyName);
        return item => {
            const propertyValue = this.getProperty(item, propertyName);
            return searchIn.some(arg => comparator(propertyValue, arg) === 0);
        };
    }

    match(args) {
        const propertyName = args[0];
        const matchString = args[1];
        const caseSensitive = !!args[2];

        const pattern = this.constructor.tokenize(Object.keys(tokenSubstitutes), matchString).map(t => {
            return tokenSubstitutes.hasOwnProperty(t) ? tokenSubstitutes[t] : this.constructor.regExpEscape(t);
        }).join('');

        const regex = new RegExp('^' + pattern + '$', caseSensitive ? '' : 'i');
        return item => {
            const propertyValue = this.getProperty(item, propertyName);
            return regex.test(propertyValue);
        };
    }

    contains(args) {
        const propertyName = args[0];
        const target = args[1];
        const comparator = this.getComparator(propertyName);
        return item => {
            const propertyValue = this.getProperty(item, propertyName);
            if (typeof propertyValue === 'string') {
                return propertyValue.includes(target);
            } else if (Array.isArray(propertyValue)) {
                return propertyValue.some(v => {
                    return comparator(v, target) === 0;
                });
            } else {
                throw new Error('Cant search inside ' + typeof propertyValue);
            }
        };
    }

    getProperty(item, propertyName) {
        if (this.propertyNameMap && this.propertyNameMap.hasOwnProperty(propertyName)) {
            propertyName = this.propertyNameMap[propertyName];
        }
        if (propertyName == null) {
            return item;
        }
        return propertyName.split('.')
            .reduce((value, name) => value != null ? value[name] : undefined, item);
    }

    getComparator(propertyName) {
        return this.constructor.compare;
    }

    getSortComparator(propertyName) {
        const comparator = this.getComparator(propertyName);
        return (a, b) => {
            const valueA = this.getProperty(a, propertyName);
            const valueB = this.getProperty(b, propertyName);
            return comparator(valueA, valueB);
        };
    }

    static compare(a, b) {
        if (a === b) return 0;
        // try using valueOf()
        if (a < b) return -1;
        if (a > b) return 1;

        // items are loosely equal, use string comparison
        const strA = String(a);
        const strB = String(b);
        if (strA < strB) return -1;
        if (strA > strB) return 1;
        return 0;
    }

    static reverseComparator(comparator) {
        return (a, b) => -comparator(a, b);
    }

    static thenComparator(first, second) {
        if (first == null) {
            return second;
        }
        return (a, b) => first(a, b) || second(a, b);
    }

    static regExpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    /**
     *
     * @param {RegExp|string[]} delimiters
     * @param {string} target
     * @returns {*[]}
     */
    static tokenize(delimiters, target) {
        if (Array.isArray(delimiters)) {
            const pattern = delimiters
                .map(d => this.regExpEscape(d))
                .join('|');
            delimiters = new RegExp(pattern, 'g');
        }

        const tokens = [];
        let prevIndex = 0;
        let match;
        while ((match = delimiters.exec(target)) != null) {
            tokens.push(target.slice(prevIndex, match.index));
            tokens.push(match[0]);
            prevIndex = delimiters.lastIndex;
        }
        tokens.push(target.slice(prevIndex));
        return tokens.filter(t => !!t);
    }
}

export class RqlFilter {

    /**
     * @param {RqlNode} node
     * @param {RqlVisitor} visitor
     */
    constructor(node, visitor = new RqlVisitor()) {
        this.test = visitor.visit(node);
        this.limit = visitor.limitValue;
        this.offset = visitor.offset;
        this.sort = visitor.sortComparator;
    }

    /**
     * Applies the filtering, sorting, limit and offset
     *
     * @param {*[]} array
     * @returns {*[]}
     */
    apply(array) {
        let result = array.filter(this.test);
        const total = result.length;
        if (this.sort) {
            result.sort(this.sort);
        }
        if (this.limit != null) {
            result = result.slice(this.offset, this.offset + this.limit);
        }
        result.$total = total;
        return result;
    }

}

export default RqlFilter;
