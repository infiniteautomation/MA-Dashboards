/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import RqlNode from './RqlNode';
import {RqlFilter, RqlVisitor} from './RqlFilter';

rqlBuilderFactory.$inject = [];
function rqlBuilderFactory() {
    
    const andOrNot = ['and', 'or', 'not'];
    const sortLimit = ['sort', 'limit'];
    const operators = ['eq', 'ne', 'le', 'ge', 'lt', 'gt', 'in', 'match', 'contains'];

    class RqlBuilder {
        constructor(root = new RqlNode(), visitorOptions = {}) {
            this.path = [root];
            this.visitorOptions = visitorOptions;
        }

        /**
         * @returns {RqlNode}
         */
        build() {
            if (!this.built) {
                this.built = this.root.normalize();
                this.path = [];
            }
            return this.built;
        }

        toString() {
            return this.build().toString();
        }

        copy() {
            this.checkBuilt();
            return new this.constructor(this.root.copy());
        }

        get current() {
            return this.path[this.path.length - 1];
        }
        
        get root() {
            return this.path[0];
        }

        addAndEnter(name, ...args) {
            this.checkBuilt();
            const newCurrent = new RqlNode(name, args);
            this.current.args.push(newCurrent);
            this.path.push(newCurrent);
            return this;
        }

        up() {
            this.checkBuilt();
            if (this.path.length > 1) {
                this.path.pop();
            } else {
                console.warn('Tried to go below root');
            }
            return this;
        }

        add(name, ...args) {
            this.checkBuilt();
            this.current.args.push(new RqlNode(name, args));
            return this;
        }
        
        sortLimit(name, ...args) {
            this.checkBuilt();
            if (this.path.length > 1) {
                console.warn(`Doing ${name} higher than root`);
            }
            
            if (this.current.name !== 'and') {
                const prev = this.path.pop();
                const replacement = new RqlNode('and', [prev]);
                this.path.push(replacement);
            }

            return this.add(name, ...args);
        }

        /**
         * Execute the query (typically against a REST endpoint)
         * @param opts
         * @returns {Promise}
         */
        query(opts) {
            if (this.queryFunction) {
                return this.queryFunction(this, opts);
            }
            throw new Error('Not implemented');
        }

        /**
         * Create a filter which can be used to filter/sort/limit an array
         * @returns {RqlFilter}
         */
        createFilter() {
            const visitor = new RqlVisitor(this.visitorOptions);
            return new RqlFilter(this.build(), visitor);
        }

        checkBuilt() {
            if (this.built) {
                throw new Error('Already built');
            }
        }
    }
    
    andOrNot.forEach(name => {
        RqlBuilder.prototype[name] = function(...args) {
            if (args.length) {
                return this.add(name, ...args);
            }
            return this.addAndEnter(name);
        };
    });
    
    operators.forEach(name => {
        RqlBuilder.prototype[name] = function(...args) {
            return this.add(name, ...args);
        };
    });
    
    sortLimit.forEach(name => {
        RqlBuilder.prototype[name] = function(...args) {
            return this.sortLimit(name, ...args);
        };
    });

    return RqlBuilder;
}

export default rqlBuilderFactory;
