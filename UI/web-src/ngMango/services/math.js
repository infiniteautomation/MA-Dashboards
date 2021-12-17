/*
 * Copyright (C) 2021 Radix IoT LLC. All rights reserved.
 */

import {create, all} from 'mathjs';

MathFactory.$inject = [];
function MathFactory() {

    const math = create(all);

    math.import({
        import: function () { throw new Error('Function import is disabled'); },
        createUnit: function () { throw new Error('Function createUnit is disabled'); },
        evaluate: function () { throw new Error('Function evaluate is disabled'); },
        parse: function () { throw new Error('Function parse is disabled'); },
        simplify: function () { throw new Error('Function simplify is disabled'); },
        derivative: function () { throw new Error('Function derivative is disabled'); }
    }, {override: true});

    return math;
}

export default MathFactory;
