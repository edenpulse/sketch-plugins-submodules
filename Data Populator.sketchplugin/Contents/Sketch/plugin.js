let __globals = this;var Sketch = require("sketch");(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.strings = exports.populator = exports.utils = exports.args = exports.placeholders = exports.actions = undefined;

var _actions = require('./library/actions');

var actions = _interopRequireWildcard(_actions);

var _placeholders = require('./library/placeholders');

var placeholders = _interopRequireWildcard(_placeholders);

var _args = require('./library/args');

var args = _interopRequireWildcard(_args);

var _utils = require('./library/utils');

var utils = _interopRequireWildcard(_utils);

var _populator = require('./library/populator');

var populator = _interopRequireWildcard(_populator);

var _strings = require('./library/strings');

var strings = _interopRequireWildcard(_strings);

var _log = require('./library/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.actions = actions;
exports.placeholders = placeholders;
exports.args = args;
exports.utils = utils;
exports.populator = populator;
exports.strings = strings;
exports.log = _log2.default; /**
                              * Core
                              *
                              * Provides common functionality shared between plugins for different platforms.
                              */

},{"./library/actions":2,"./library/args":3,"./library/log":10,"./library/placeholders":11,"./library/populator":12,"./library/strings":13,"./library/utils":14}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractActions = extractActions;
exports.parseAction = parseAction;
exports.resolveAction = resolveAction;

var _placeholders = require('./placeholders');

var Placeholders = _interopRequireWildcard(_placeholders);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Extracts actions from the string, e.g. ... #show({firstName}.length > 3)
 *
 * @param {String} string
 * @returns {Array}
 */
/**
 * Actions
 *
 * Provides functionality to extract, parse and resolve actions.
 */

function extractActions(string) {

  // get individual actions
  var actionStrings = string.match(/#\w*\[([^\]]+)]/g) || [];

  // parse actions
  var extractedActions = actionStrings.map(function (actionString) {
    return parseAction(actionString);
  });

  return extractedActions;
}

/**
 * Parses the action string, #run({firstName}.length > 3, fnToRun)
 *
 * @param {String} actionString
 * @returns {Object}
 *
 * returned action: {
 *   string: {String},
 *   command: {String},
 *   condition: {
 *     string: {String},
 *     placeholders: [{
 *         string: {String},
 *         keypath: {String},
 *         filters: {Array},
 *         substitute: {String},
 *         placeholders: {Array}
 *       }]
 *   },
 *   params: [{
 *     string: {String},
 *     placeholders: {Array as for condition},
 *   }]
 * }
 */
function parseAction(actionString) {

  // keep full action string
  // used later on when executing actions
  var fullActionString = actionString;

  // get command
  var command = actionString.match(/#(\w+)/g)[0];

  // remove command from string
  actionString = actionString.substring(command.length + 1, actionString.length - 1);

  // remove # from command string
  command = command.substring(1);

  // split action string into components
  var actionComponents = actionString.split(/(?![^(]*\)),/g);

  // get condition string
  var conditionString = actionComponents[0];

  // extract placeholders in condition
  var conditionPlaceholders = Placeholders.extractPlaceholders(conditionString);

  // get params
  actionComponents.shift();
  var params = actionComponents.map(function (paramString) {

    // get placeholders in param
    var paramPlaceholders = Placeholders.extractPlaceholders(paramString);

    // return complete param object with placeholders
    return {
      string: paramString.trim(),
      placeholders: paramPlaceholders
    };
  });

  // prepare action
  var action = {
    string: fullActionString,
    command: command,
    condition: {
      string: conditionString,
      placeholders: conditionPlaceholders
    },
    params: params
  };

  return action;
}

/**
 * Resolves the placeholders in the action with the supplied data.
 *
 * @param action {Object}
 * @param data {Object}
 */
function resolveAction(action, data) {

  // copy action object
  action = Object.assign({}, action);

  // create populated condition string
  var populatedConditionString = action.condition.string;
  action.condition.placeholders.forEach(function (placeholder) {

    // populate placeholder found in the condition string
    var populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null');

    // replace original placeholder string
    populatedConditionString = populatedConditionString.replace(placeholder.string, populatedPlaceholder);
  });
  action.condition = populatedConditionString;

  // populate params
  var populatedParams = action.params.map(function (param) {

    // create populated param string
    var populatedParamString = param.string;
    param.placeholders.forEach(function (placeholder) {

      // populate placeholder found in the param string
      var populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null');

      // replace original placeholder string
      populatedParamString = populatedParamString.replace(placeholder.string, populatedPlaceholder);
    });

    return populatedParamString;
  });
  action.params = populatedParams;

  // evaluate condition
  var condition = void 0;
  try {

    // evaluate condition
    // eslint-disable-next-line no-new-func
    condition = false; // (new Function('return ' + populatedConditionString))()
  } catch (e) {

    // signify that there was an error resolving the action
    action.resolveError = e;
  }
  action.condition = condition;

  return action;
}

},{"./log":10,"./placeholders":11}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractArgs = extractArgs;
exports.parseArgs = parseArgs;

var _commandLineArgs = require('command-line-args');

var _commandLineArgs2 = _interopRequireDefault(_commandLineArgs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Extracts standard CLI-style arguments from a string. First removes placeholders
 * from the string.
 *
 * @param {String} string
 * @param {Array} definitions
 */
function extractArgs(string, definitions) {

  // remove placeholders from string
  string = string.replace(/(?![^(]*\)){([^}]+)}/g, '');

  // parse args in the remaining string
  return parseArgs(string, definitions);
}

/**
 * Parses any args found in the provided string using the given definitions.
 *
 * @param {String} string
 * @param {Array} definitions - object containing the possible option definitions to look for
 *
 * definitions: [{
 *   name: {String}, - the full name of the arg, used as arg name in extracted args
 *   alias: {String} - the short name of the arg, e.g. l, v, etc
 * }]
 */
/**
 * Args
 *
 * Provides functionality to extract and parse args.
 */

function parseArgs(string, definitions) {

  // parse args using the provided definitions
  return (0, _commandLineArgs2.default)(definitions, string.split(/\s+/g));
}

},{"command-line-args":21}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Capitalize filter
 */

var name = exports.name = 'capitalize';
var alias = exports.alias = 'capitalize';

/**
 * Converts the input string lowercase with the first char capitalized.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */
function apply(string, param) {
  return String(string).charAt(0).toUpperCase() + String(string).slice(1).toLowerCase();
}

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractFilters = extractFilters;
exports.parseFilter = parseFilter;
exports.removeFiltersString = removeFiltersString;
exports.applyFilter = applyFilter;

var _join = require('./join');

var JoinFilter = _interopRequireWildcard(_join);

var _max = require('./max');

var MaxFilter = _interopRequireWildcard(_max);

var _uppercase = require('./uppercase');

var UppercaseFilter = _interopRequireWildcard(_uppercase);

var _lowercase = require('./lowercase');

var LowercaseFilter = _interopRequireWildcard(_lowercase);

var _capitalize = require('./capitalize');

var CapitalizeFilter = _interopRequireWildcard(_capitalize);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var filters = [JoinFilter, MaxFilter, UppercaseFilter, LowercaseFilter, CapitalizeFilter];

/**
 * Extracts filters from the placeholder string, e.g. firstName, lastName | & •
 *
 * @param {String} string
 * @returns {Array}
 */
/**
 * Filters
 *
 * Provides functionality extract, parse and apply filters.
 */

function extractFilters(string) {

  // prepare filters array
  var extractedFilters = [];

  // get filters string, e.g. & • | upper
  // remove bracketed nested placeholders first, then split on first pipe
  var filtersString = string.replace(/\((.*)\)/g, '').split(/\|(.+)?/g)[1];
  if (filtersString && filtersString.length) {

    // get individual filters
    var filterStrings = filtersString.split(/\|/g);

    // parse filters
    extractedFilters = filterStrings.map(function (filterString) {
      return parseFilter(filterString);
    });
  }

  return extractedFilters;
}

/**
 * Parses the filter string, e.g. & •
 *
 * @param {String} filterString
 * @returns {Object}
 *
 * returned filter: {
 *   command: {String},
 *   param: {String}
 * }
 */
function parseFilter(filterString) {

  // remove leading spaces in filter string
  while (filterString.substring(0, 1) === ' ') {
    filterString = filterString.substring(1, filterString.length);
  }

  // get command
  var command = null;
  for (var i = 0; i < filters.length; i++) {

    if (filterString.startsWith(filters[i].name)) {
      command = filters[i].name;
      break;
    } else if (filterString.startsWith(filters[i].alias)) {
      command = filters[i].alias;
      break;
    }
  }

  if (!command || !command.length) return {};

  // get param by removing the command from the string
  var param = filterString.substring(command.length);

  // create filter
  var filter = {
    command: command.trim()

    // add param to filter
  };if (param.length && param.trim().length) filter.param = param;

  return filter;
}

/**
 * Removes the filters part of a placeholder content string.
 *
 * @param {String} string
 * @returns {String}
 */
function removeFiltersString(string) {

  // get filters string, e.g. & • | upper
  // remove bracketed nested placeholders first, then split on first pipe
  var filtersString = string.replace(/\((.*)\)/g, '').split(/\|(.+)?/g)[1];

  // remove filters string from string
  return string.replace('|' + filtersString, '');
}

/**
 * Applies the supplied filter to the input to produce an output.
 *
 * @param {Object} filter
 * @param {Array/String} input
 */
function applyFilter(filter, input) {

  // find apply function for the specified filter
  var applyFunction = void 0;
  for (var i = 0; i < filters.length; i++) {
    if (filters[i].name === filter.command || filters[i].alias === filter.command) {
      applyFunction = filters[i].apply;
    }
  }

  // return input back as the apply function doesn't exist
  if (!applyFunction) return input;

  // apply filter to input, passing in the param
  return applyFunction(input, filter.param);
}

},{"./capitalize":4,"./join":6,"./lowercase":7,"./max":8,"./uppercase":9}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Join filter
 */

var name = exports.name = 'join';
var alias = exports.alias = '&';

/**
 * Joins an array of strings.
 *
 * @param {Array} inputStrings
 * @param {String} param
 * @returns {String}
 */
function apply(inputStrings, param) {

  // make sure that input strings is an array
  if (!(inputStrings instanceof Array)) return inputStrings;

  // TODO fix this upstream, in populator
  inputStrings = inputStrings.map(function (str) {
    if (str instanceof Object && str.hasOwnProperty('hasValueForKey')) {
      return str.populated;
    } else {
      return str;
    }
  });

  // get delimiter
  var delimiter = param;

  // filter out empty strings
  inputStrings = inputStrings.filter(function (inputString) {
    return inputString && inputString.length;
  });

  // join strings using delimiter
  return inputStrings.join(delimiter);
}

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Lowercase filter
 */

var name = exports.name = 'lower';
var alias = exports.alias = 'lower';

/**
 * Converts the input string to lowercase.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */
function apply(string, param) {
  return String(string).toLowerCase();
}

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Max length filter
 */

var name = exports.name = 'max';
var alias = exports.alias = 'max';

/**
 * Trims the input string to a max number of characters.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */
function apply(string, param) {
  if (!string) return;

  // get max number of characters
  var maxCharacters = Number(param.trim());

  // trim string to max characters
  return string.substring(0, maxCharacters);
}

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Uppercase filter
 */

var name = exports.name = 'upper';
var alias = exports.alias = 'upper';

/**
 * Converts the input string to uppercase.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */
function apply(string, param) {
  return String(string).toUpperCase();
}

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = log;
/**
 * Log
 *
 * Convenience logging functionality.
 */

function log() {
  for (var _len = arguments.length, strings = Array(_len), _key = 0; _key < _len; _key++) {
    strings[_key] = arguments[_key];
  }

  if (!strings.length) return;

  var indent = '';
  if (strings[0][0] === '>') {
    for (var i = 0; i < strings[0].length; ++i) {
      indent += '   ';
    }
    strings.shift();
  }

  strings = strings.map(function (string) {
    if (string instanceof Object && !(string instanceof Error)) {
      return JSON.stringify(string, null, 2);
    } else {
      return string;
    }
  });

  console.log('@datapop |', indent + strings.join(' ').trim());
}

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractPlaceholders = extractPlaceholders;
exports.parsePlaceholder = parsePlaceholder;
exports.populatePlaceholder = populatePlaceholder;

var _get = require('lodash/get');

var _get2 = _interopRequireDefault(_get);

var _filters = require('./filters');

var Filters = _interopRequireWildcard(_filters);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Extracts placeholders from a string. Placeholders are identified by {}.
 *
 * @param {String} string
 * @returns {Array}
 */
/**
 * Placeholders
 *
 * Provides functionality to extract, parse and populate placeholders.
 */

function extractPlaceholders(string) {

  // get placeholders
  var placeholders = [];

  // match placeholders identified by {}
  var regex = /(?![^(]*\)|[^[]*]){([^}]+)}/g;
  var match = regex.exec(string);
  while (match) {

    // parse placeholder
    if (match[0].split('{').length - 1 === match[0].split('}').length - 1) {
      var parsedPlaceholder = parsePlaceholder(match[0]);

      // add to placeholders array
      placeholders.push(parsedPlaceholder);
    }

    // parse next placeholder
    match = regex.exec(string);
  }

  return placeholders;
}

/**
 * Parses the placeholder. The string contains the content of the placeholder
 * without being wrapped in () or {}, e.g. firstName, lastName | & •
 *
 * @param {String} placeholderString
 * @returns {Object}
 *
 * Example placeholders (shown with {}):
 *
 * - {firstName}, {name.first} - John
 * - {firstName, lastName | & • } - John • Doe
 * - {(lastName?, firstName | &, ), DOB | & born on } - Doe, John born on 14/07/1970
 * - {firstName | upper} - JOHN
 * - {firstName | upper | max 2} - JO
 * - {(firstName | upper | max 2), (lastName | max 1) | & • } - JO • D
 * - {keypath?} - The default substitute
 * - {keypath?not available} - not available
 * - {firstName?First name not available, lastName?No last name, DOB? | & - }
 * - TODO: quotation marks {firstName?"First name, not | available \" ,,", lastName?'No, \' | last name', DOB? | & - }
 *   TODO:                '{firstName?"First name, not | available \\" ,,", lastName?\'No, \\\' | last name\', DOB? | & - }'
 *
 * Example nesting:
 * - {(lastName?'', firstName | &, ), DOB | & born on }
 *   - (lastName?'', firstName | &, )
 *     - lastName?''
 *     - firstName
 *   - DOB
 *
 * returned placeholder format: [{
 *   string: {String}, - the original text of the placeholder, e.g. {name.first}
 *   keypath: {String}, - the path to the data, e.g. name.first
 *   filters: {Array}, - filters applied through the pipe character, adding in the correct order
 *   substitute: {String}, - string to use in case the placeholder resolves to an empty string
 *   placeholders: {Array} - nested placeholders with the same format as this placeholder
 * }]
 *
 * Example parsed placeholders:
 *
 * [
 *   {
 *     "string":"{firstName}",
 *     "keypath":"firstName"
 *   },
 *
 *   {
 *     "string":"{name.first}",
 *     "keypath":"name.first"
 *   },
 *
 *   {
 *     "string":"{firstName, lastName | & • }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" • "
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"firstName",
 *         "keypath":"firstName"
 *       },
 *       {
 *         "string":"lastName",
 *         "keypath":"lastName"
 *       }
 *     ]
 *   },
 *   {
 *     "string":"{firstName | upper}",
 *     "filters":[
 *       {
 *         "command":"upper"
 *       }
 *     ],
 *     "keypath":"firstName"
 *   },
 *   {
 *     "string":"{firstName | upper | max 2}",
 *     "filters":[
 *       {
 *         "command":"upper"
 *       },
 *       {
 *         "command":"max",
 *         "param":" 2"
 *       }
 *     ],
 *     "keypath":"firstName"
 *   },
 *   {
 *     "string":"{(firstName | upper | max 2), (lastName | max 1) | & • }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" • "
 *
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"(firstName | upper | max 2)",
 *         "filters":[
 *           {
 *             "command":"upper"
 *           },
 *           {
 *             "command":"max",
 *             "param":" 2"
 *           }
 *         ],
 *         "keypath":"firstName"
 *       },
 *       {
 *         "string":"(lastName | max 1)",
 *         "filters":[
 *           {
 *             "command":"max",
 *             "param":" 1"
 *           }
 *         ],
 *         "keypath":"lastName"
 *       }
 *     ]
 *   },
 *   {
 *     "string":"{keypath?}",
 *     "keypath":"keypath",
 *     "substitute":true
 *   },
 *   {
 *
 *     "string":"{keypath?not available}",
 *     "keypath":"keypath",
 *     "substitute":"not available"
 *   },
 *   {
 *
 *     "string":"{firstName?First name not available, lastName?No last name, DOB? | & - }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" - "
 *
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"firstName?First name not available",
 *         "keypath":"firstName",
 *         "substitute":"First name not available"
 *       },
 *       {
 *         "string":"lastName?No last name",
 *         "keypath":"lastName",
 *         "substitute":"No last name"
 *       },
 *       {
 *         "string":"DOB?",
 *         "keypath":"DOB",
 *         "substitute":true
 *       }
 *     ]
 *   }
 * ]
 */
function parsePlaceholder(placeholderString) {

  // prepare placeholder
  var placeholder = {
    string: placeholderString

    // get placeholder content
  };var placeholderContent = placeholderString;
  if (isGroupedPlaceholder(placeholderString) || isRootPlaceholder(placeholderString)) {
    placeholderContent = placeholderContent.substr(1, placeholderContent.length - 2);
  }

  // get filters
  var filters = Filters.extractFilters(placeholderContent);
  if (filters.length) {

    // get placeholder filters
    placeholder.filters = filters;

    // remove filters string from placeholder content
    placeholderContent = Filters.removeFiltersString(placeholderContent);
  }

  // get nested placeholders
  var groupingLevel = 0;
  var nestedPlaceholders = [];
  var buffer = '';
  for (var i = 0; i < placeholderContent.length; i++) {

    // get character of content
    var char = placeholderContent[i];

    // adjust placeholder grouping level
    if (char === '(') groupingLevel++;
    if (char === ')') groupingLevel--;

    // if comma and not nested or if last character
    if (char === ',' && groupingLevel === 0 || i === placeholderContent.length - 1) {

      // add the character in case it's the last character
      if (char !== ',') buffer += char;

      // trim and add placeholder
      nestedPlaceholders.push(buffer.trim());

      // reset placeholder buffer
      buffer = '';
    } else {

      // append the character to buffer
      buffer += char;
    }
  }

  // parse nested placeholders if there are more than one or the one is a grouped placeholder
  if (nestedPlaceholders.length > 1 || isGroupedPlaceholder(nestedPlaceholders[0])) {

    // set nested placeholders of the placeholder
    placeholder.placeholders = nestedPlaceholders.map(function (nestedPlaceholder) {

      // recur to parse nested placeholder
      return parsePlaceholder(nestedPlaceholder);
    });
  }

  // parse a single ungrouped placeholder, the base case for the recursive function
  else if (nestedPlaceholders[0] && nestedPlaceholders[0].length) {
      var nestedPlaceholder = nestedPlaceholders[0];

      // split into components, dividing into the keypath and substitute
      var substituteMarkerIndex = nestedPlaceholder.indexOf('?');
      var placeholderComponents = substituteMarkerIndex === -1 ? [nestedPlaceholder] : [nestedPlaceholder.slice(0, substituteMarkerIndex), nestedPlaceholder.slice(substituteMarkerIndex + 1)];

      // check if has substitute
      if (placeholderComponents.length === 2) {

        // set keypath
        placeholder.keypath = placeholderComponents[0].trim();

        // set substitute
        if (placeholderComponents[1]) {
          placeholder.substitute = placeholderComponents[1].trim();
        } else {

          // set to true to signify that a default substitute should be used
          placeholder.substitute = true;
        }
      } else {

        // set keypath to the placeholder itself since there is no substitute
        placeholder.keypath = nestedPlaceholder;
      }
    }

  return placeholder;
}

/**
 * Populates a placeholder with data, returning the populated string.
 *
 * @param {Object} placeholder
 * @param {Object} data
 * @param {String} defaultSubstitute
 * @returns {String}
 */
function populatePlaceholder(placeholder, data, defaultSubstitute, xd) {

  // prepare populated string/array
  var populated = void 0;
  var hasValueForKey = true;

  // populate nested placeholders
  if (placeholder.placeholders) {

    // populate and add to array of populated nested placeholders
    populated = placeholder.placeholders.map(function (nestedPlaceholder) {
      return populatePlaceholder(nestedPlaceholder, data, defaultSubstitute, xd);
    });
  }

  // no nested placeholders, this is the base case
  else {

      // populate with data for keypath
      populated = (0, _get2.default)(data, placeholder.keypath);

      // check if substitute is needed
      if (!populated) {
        hasValueForKey = false;

        // true signifies to use default substitute
        if (placeholder.substitute === true) {
          populated = defaultSubstitute;
        }

        // use specified substitute
        else if (placeholder.substitute && placeholder.substitute.length) {

            if (placeholder.substitute[0] === '?') {

              // iterate over substitute stack in the given order
              // the first substitute key that returns data is used
              var substituteStack = placeholder.substitute.substring(1).split('?');
              for (var i = 0; i < substituteStack.length; ++i) {
                populated = (0, _get2.default)(data, substituteStack[i]);
                if (populated) break;
              }

              // use default if placeholder substitute didn't return any data
              if (!populated) populated = defaultSubstitute;
            } else {
              populated = placeholder.substitute;
            }
          }

          // return empty string when no substitute should be used
          else {
              populated = '';
            }
      }
    }

  // apply filters
  if (placeholder.filters) {
    placeholder.filters.forEach(function (filter) {
      populated = Filters.applyFilter(filter, populated);
    });
  }

  // make sure that populated is always a string before returning
  // it could be an array if a filter apply function was not found
  if (populated instanceof Array) {
    populated = populated.join(' ');
  }

  if (!xd) {
    return String(populated);
  } else {
    return {
      populated: String(populated),
      hasValueForKey: hasValueForKey
    };
  }
}

/**
 * Checks if the placeholder is grouped. A placeholder is grouped if it's wrapped
 * within parentheses.
 *
 * @param {String} placeholder
 * @returns {Boolean}
 */
function isGroupedPlaceholder(placeholder) {
  return placeholder && placeholder[0] === '(' && placeholder[placeholder.length - 1] === ')';
}

/**
 * Checks if the placeholder is a root placeholder. A placeholder is root if it's wrapped
 * within {}.
 *
 * @param {String} placeholder
 * @returns {Boolean}
 */
function isRootPlaceholder(placeholder) {
  return placeholder && placeholder[0] === '{' && placeholder[placeholder.length - 1] === '}';
}

},{"./filters":5,"lodash/get":73}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectDataRow = selectDataRow;

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function selectDataRow(data, usedRows, randomize) {

  var dataRow = void 0;
  if (data instanceof Array) {
    if (randomize) {

      var lastRandomIndex = usedRows.length ? usedRows[usedRows.length - 1] : -1;

      // reset used rows
      if (usedRows.length === data.length) {
        usedRows.length = 0;
      }

      // get random index
      var randomIndex = void 0;
      while (!randomIndex && randomIndex !== 0) {

        // get random in range
        var random = Utils.randomInteger(0, data.length);

        // make sure index doesn't exist in already chosen random indexes
        if (usedRows.indexOf(random) === -1) {

          // make sure it's not the same as the last chosen random index
          if (data.length > 1) {
            if (random !== lastRandomIndex) {
              randomIndex = random;
            }
          } else {
            randomIndex = random;
          }
        }
      }

      // store selected random index
      usedRows.push(randomIndex);

      // get data row for random index
      dataRow = data[randomIndex];
    } else {

      if (usedRows.length > data.length - 1) {
        usedRows.length = 0;
      }

      dataRow = data[usedRows.length];
      usedRows.push(dataRow);
    }
  } else {
    dataRow = data;
  }

  return dataRow;
} /**
   * Placeholders
   *
   * Provides shared populator functionality.
   */

},{"./utils":14}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _en;

exports.default = function (stringKey) {
  var string = strings.en[stringKey];

  var index = 0;
  while (string.indexOf('{data}') > -1) {
    string = string.replace('{data}', arguments.length <= index + 1 ? undefined : arguments[index + 1]);
    index++;
  }

  return string;
};

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Strings
 *
 * Provides access to strings used in the UI across the plugin.
 */

// Data Populator
var DATA_POPULATOR_TITLE = exports.DATA_POPULATOR_TITLE = 'dataPopulatorTitle';
var DATA_POPULATOR_DESCRIPTION = exports.DATA_POPULATOR_DESCRIPTION = 'dataPopulatorDescription';
var DATA_POPULATOR_URL = exports.DATA_POPULATOR_URL = 'dataPopulatorURL';

// Populate with Preset
var POPULATE_WITH_PRESET_TITLE = exports.POPULATE_WITH_PRESET_TITLE = 'populateWithPresetTitle';
var POPULATE_WITH_PRESET_DESCRIPTION = exports.POPULATE_WITH_PRESET_DESCRIPTION = 'populateWithPresetDescription';
var PRESET = exports.PRESET = 'preset';
var NO_PRESETS_FOUND = exports.NO_PRESETS_FOUND = 'noPresetsFound';
var CONNECTION_FAILED = exports.CONNECTION_FAILED = 'connectionFailed';
var UNABLE_TO_DOWNLOAD_PRESETS = exports.UNABLE_TO_DOWNLOAD_PRESETS = 'unableToDownloadPresets';
var NO_JSON_FILES_IN_PRESETS_FOLDER = exports.NO_JSON_FILES_IN_PRESETS_FOLDER = 'noJSONFilesInPresetsFolder';
var NO_PRESETS_FOLDER = exports.NO_PRESETS_FOLDER = 'noPresetsFolder';
var CREATE_PRESET_FOLDER = exports.CREATE_PRESET_FOLDER = 'createPresetsFolder';
var INVALID_PRESET = exports.INVALID_PRESET = 'invalidPreset';
var SELECTED_PRESET_INVALID = exports.SELECTED_PRESET_INVALID = 'selectedPresetInvalid';
var UNABLE_TO_LOAD_SELECTED_PRESET = exports.UNABLE_TO_LOAD_SELECTED_PRESET = 'unableToLoadSelectedPreset';
var UNABLE_TO_LOAD_LAST_USED_PRESET = exports.UNABLE_TO_LOAD_LAST_USED_PRESET = 'unableToLoadLastUsedPreset';

// Populate with JSON
var POPULATE_WITH_JSON_TITLE = exports.POPULATE_WITH_JSON_TITLE = 'populateWithJSONTitle';
var POPULATE_WITH_JSON_DESCRIPTION = exports.POPULATE_WITH_JSON_DESCRIPTION = 'populateWithJSONDescription';
var JSON_FILE = exports.JSON_FILE = 'JSONFile';
var BROWSE = exports.BROWSE = 'browse';
var NO_FILE_SELECTED = exports.NO_FILE_SELECTED = 'noFileSelected';
var SELECT_JSON_FILE = exports.SELECT_JSON_FILE = 'selectJSONFile';
var INVALID_JSON_FILE = exports.INVALID_JSON_FILE = 'invalidJSONFile';
var SELECTED_JSON_FILE_INVALID = exports.SELECTED_JSON_FILE_INVALID = 'selectedJSONFileInvalid';
var UNABLE_TO_LOAD_SELECTED_JSON_FILE = exports.UNABLE_TO_LOAD_SELECTED_JSON_FILE = 'unableToLoadJSONFile';

// Populate from URL
var POPULATE_FROM_URL_TITLE = exports.POPULATE_FROM_URL_TITLE = 'populateFromURLTitle';
var POPULATE_FROM_URL_DESCRIPTION = exports.POPULATE_FROM_URL_DESCRIPTION = 'populateFromURLDescription';
var URL = exports.URL = 'URL';
var URL_PLACEHOLDER = exports.URL_PLACEHOLDER = 'URLPlaceholder';
var NO_URL_ENTERED = exports.NO_URL_ENTERED = 'noURLEntered';
var ENTER_URL = exports.ENTER_URL = 'enterURL';
var INVALID_URL = exports.INVALID_URL = 'invalidURL';
var URL_ENTERED_INVALID = exports.URL_ENTERED_INVALID = 'URLEnteredInvalid';
var UNABLE_TO_LOAD_JSON_AT_URL = exports.UNABLE_TO_LOAD_JSON_AT_URL = 'unableToLoadJSONAtURL';
var UNABLE_TO_LOAD_JSON_AT_LAST_USED_URL = exports.UNABLE_TO_LOAD_JSON_AT_LAST_USED_URL = 'unableToLoadJSONAtLastUsedURL';
var HEADERS = exports.HEADERS = 'headers';
var ADD = exports.ADD = 'add';
var NAME = exports.NAME = 'name';
var VALUE = exports.VALUE = 'value';
var REMOVE = exports.REMOVE = 'remove';
var LOAD = exports.LOAD = 'load';

// Populate Again
var POPULATE_AGAIN_TITLE = exports.POPULATE_AGAIN_TITLE = 'populateAgainTitle';
var POPULATE_AGAIN_DESCRIPTION = exports.POPULATE_AGAIN_DESCRIPTION = 'populateAgainDescription';

// Populate
var DATA_PATH = exports.DATA_PATH = 'dataPath';
var DATA_PATH_PLACEHOLDER = exports.DATA_PATH_PLACEHOLDER = 'dataPathPlaceholder';
var DATA_PATH_HELP_TEXT = exports.DATA_PATH_HELP_TEXT = 'dataPathHelpText';
var DATA_OPTIONS = exports.DATA_OPTIONS = 'dataOptions';
var RANDOMIZE_DATA_ORDER = exports.RANDOMIZE_DATA_ORDER = 'randomizeDataOrder';
var TRIM_TEXT = exports.TRIM_TEXT = 'trimText';
var INSERT_ELLIPSIS = exports.INSERT_ELLIPSIS = 'insertEllipsis';
var DEFAULT_SUBSTITUTE = exports.DEFAULT_SUBSTITUTE = 'defaultSubstitute';
var DEFAULT_SUBSTITUTE_HELP_TEXT = exports.DEFAULT_SUBSTITUTE_HELP_TEXT = 'defaultSubstituteHelpText';
var DEFAULT_SUBSTITUTE_PLACEHOLDER = exports.DEFAULT_SUBSTITUTE_PLACEHOLDER = 'defaultSubstitutePlaceholder';
var LAYOUT_OPTIONS = exports.LAYOUT_OPTIONS = 'layoutOptions';
var CREATE_GRID = exports.CREATE_GRID = 'createGrid';
var ROWS = exports.ROWS = 'rows';
var COLUMNS = exports.COLUMNS = 'columns';
var MARGIN = exports.MARGIN = 'margin';

var RELOAD = exports.RELOAD = 'reload';
var CANCEL = exports.CANCEL = 'cancel';
var OK = exports.OK = 'OK';
var POPULATE = exports.POPULATE = 'populate';

var NO_LAYERS_SELECTED = exports.NO_LAYERS_SELECTED = 'noLayersSelected';
var SELECT_LAYERS_TO_POPULATE = exports.SELECT_LAYERS_TO_POPULATE = 'selectLayersToPopulate';
var POPULATING_FAILED = exports.POPULATING_FAILED = 'populatingFailed';
var NO_MATCHING_KEYS = exports.NO_MATCHING_KEYS = 'noMatchingKeys';
var UNABLE_TO_PREVIEW_JSON = exports.UNABLE_TO_PREVIEW_JSON = 'unableToPreviewJSON';
var LOADING_DATA = exports.LOADING_DATA = 'loadingData';

var CLICKED_CANCEL_BUTTON = exports.CLICKED_CANCEL_BUTTON = 'clickedCancelButton';
var CLOSED_DIALOG_WITH_ESC_KEY = exports.CLOSED_DIALOG_WITH_ESC_KEY = 'closedDialogWithESCKey';

// Last Used Data
var LAST_USED_DATA_TITLE = exports.LAST_USED_DATA_TITLE = 'lastUsedDataTitle';
var LAST_USED_DATA_DESCRIPTION = exports.LAST_USED_DATA_DESCRIPTION = 'lastUsedDataDescription';
var COMMAND = exports.COMMAND = 'command';
var LOADING_FAILED = exports.LOADING_FAILED = 'loadingFailed';
var NO_LAST_USED_DATA = exports.NO_LAST_USED_DATA = 'noLastUsedData';
var FIRST_TIME_USING_DATA_POPULATOR = exports.FIRST_TIME_USING_DATA_POPULATOR = 'firstTimeUsingDataPopulator';

// Clear layers
var CLEAR_LAYERS_TITLE = exports.CLEAR_LAYERS_TITLE = 'clearLayersTitle';
var CLEAR_LAYERS_DESCRIPTION = exports.CLEAR_LAYERS_DESCRIPTION = 'clearLayersDescription';
var SELECT_LAYERS_TO_CLEAR = exports.SELECT_LAYERS_TO_CLEAR = 'selectLayersToClear';

// Presets library
var REVEAL_PRESETS_LIBRARY_TITLE = exports.REVEAL_PRESETS_LIBRARY_TITLE = 'revealPresetsTitle';
var REVEAL_PRESETS_LIBRARY_DESCRIPTION = exports.REVEAL_PRESETS_LIBRARY_DESCRIPTION = 'revealPresetsLibraryDescription';
var SET_PRESETS_LIBRARY_TITLE = exports.SET_PRESETS_LIBRARY_TITLE = 'setPresetsLibraryTitle';
var SET_PRESETS_LIBRARY_DESCRIPTION = exports.SET_PRESETS_LIBRARY_DESCRIPTION = 'setPresetsLibraryDescription';
var PRESETS_LIBRARY_NOT_FOUND = exports.PRESETS_LIBRARY_NOT_FOUND = 'presetsLibraryNotFound';

// Need help?
var NEED_HELP_TITLE = exports.NEED_HELP_TITLE = 'needHelpTitle';
var NEED_HELP_DESCRIPTION = exports.NEED_HELP_DESCRIPTION = 'needHelpDescription';

var strings = exports.strings = {
  en: (_en = {}, _defineProperty(_en, DATA_POPULATOR_TITLE, 'Data Populator'), _defineProperty(_en, DATA_POPULATOR_DESCRIPTION, 'A plugin to populate your design mockups with meaningful data. Goodbye Lorem Ipsum. Hello JSON.'), _defineProperty(_en, DATA_POPULATOR_URL, 'http://datapopulator.com'), _defineProperty(_en, POPULATE_WITH_PRESET_TITLE, 'Populate with Preset'), _defineProperty(_en, POPULATE_WITH_PRESET_DESCRIPTION, 'Please select the preset you\'d like to populate your design with and configure the options.'), _defineProperty(_en, PRESET, 'Preset'), _defineProperty(_en, NO_PRESETS_FOUND, 'No presets found.'), _defineProperty(_en, CONNECTION_FAILED, 'Connection failed'), _defineProperty(_en, UNABLE_TO_DOWNLOAD_PRESETS, 'Unable to download the default presets at \'https://www.datapopulator.com/demodata/\' provided by precious design studio.'), _defineProperty(_en, NO_JSON_FILES_IN_PRESETS_FOLDER, 'There are no JSON files in the presets folder to populate with.'), _defineProperty(_en, NO_PRESETS_FOLDER, 'No presets folder'), _defineProperty(_en, CREATE_PRESET_FOLDER, 'Please create a folder named \'presets\' in {data}.'), _defineProperty(_en, INVALID_PRESET, 'Invalid preset'), _defineProperty(_en, SELECTED_PRESET_INVALID, 'The preset you selected is invalid.'), _defineProperty(_en, UNABLE_TO_LOAD_SELECTED_PRESET, 'Unable to load the selected preset.'), _defineProperty(_en, UNABLE_TO_LOAD_LAST_USED_PRESET, 'Unable to load the last used preset.'), _defineProperty(_en, POPULATE_WITH_JSON_TITLE, 'Populate with JSON'), _defineProperty(_en, POPULATE_WITH_JSON_DESCRIPTION, 'Please select the JSON file you\'d like to populate your design with and configure the options.'), _defineProperty(_en, JSON_FILE, 'JSON File'), _defineProperty(_en, BROWSE, 'Browse'), _defineProperty(_en, NO_FILE_SELECTED, 'No file selected'), _defineProperty(_en, SELECT_JSON_FILE, 'Please select a JSON file to populate with.'), _defineProperty(_en, INVALID_JSON_FILE, 'Invalid JSON file'), _defineProperty(_en, SELECTED_JSON_FILE_INVALID, 'The selected JSON file is invalid.'), _defineProperty(_en, UNABLE_TO_LOAD_SELECTED_JSON_FILE, 'Unable to load the selected JSON file.'), _defineProperty(_en, POPULATE_FROM_URL_TITLE, 'Populate from URL'), _defineProperty(_en, POPULATE_FROM_URL_DESCRIPTION, 'Please enter the URL of the API from which you\'d like to fetch live data to populate your design with and configure the options.'), _defineProperty(_en, URL, 'URL'), _defineProperty(_en, URL_PLACEHOLDER, 'Must start with https://'), _defineProperty(_en, NO_URL_ENTERED, 'No URL entered'), _defineProperty(_en, ENTER_URL, 'Please enter the URL of the API from which you\'d like to fetch data to populate with.'), _defineProperty(_en, INVALID_URL, 'Invalid URL'), _defineProperty(_en, URL_ENTERED_INVALID, 'The URL you entered is invalid.'), _defineProperty(_en, UNABLE_TO_LOAD_JSON_AT_URL, 'Unable to load the JSON at the specified URL.'), _defineProperty(_en, UNABLE_TO_LOAD_JSON_AT_LAST_USED_URL, 'Unable to load the JSON at the last used URL.'), _defineProperty(_en, HEADERS, 'Headers'), _defineProperty(_en, ADD, 'Add'), _defineProperty(_en, NAME, 'Name'), _defineProperty(_en, VALUE, 'Value'), _defineProperty(_en, REMOVE, 'Remove'), _defineProperty(_en, LOAD, 'Load'), _defineProperty(_en, POPULATE_AGAIN_TITLE, 'Populate Again'), _defineProperty(_en, POPULATE_AGAIN_DESCRIPTION, 'Re-populate the selected layers with the last used data.'), _defineProperty(_en, DATA_PATH, 'Data Path'), _defineProperty(_en, DATA_PATH_PLACEHOLDER, 'Root Level'), _defineProperty(_en, DATA_PATH_HELP_TEXT, 'The JSON key used as the starting point for populating. The key with the most objects is automatically detected.'), _defineProperty(_en, DATA_OPTIONS, 'Data Options'), _defineProperty(_en, RANDOMIZE_DATA_ORDER, 'Randomize data order'), _defineProperty(_en, TRIM_TEXT, 'Trim overflowing text (area text layers)'), _defineProperty(_en, INSERT_ELLIPSIS, 'Insert ellipsis after trimmed text'), _defineProperty(_en, DEFAULT_SUBSTITUTE, 'Default Substitute'), _defineProperty(_en, DEFAULT_SUBSTITUTE_HELP_TEXT, 'The substitute text used if you append a \'?\' to your placeholder i.e. {placeholder?}. Can be customized per placeholder as well: {placeholder?custom substitute}.'), _defineProperty(_en, DEFAULT_SUBSTITUTE_PLACEHOLDER, 'e.g. No Data'), _defineProperty(_en, LAYOUT_OPTIONS, 'Layout Options'), _defineProperty(_en, CREATE_GRID, 'Create grid'), _defineProperty(_en, ROWS, 'Rows'), _defineProperty(_en, COLUMNS, 'Columns'), _defineProperty(_en, MARGIN, 'Margin'), _defineProperty(_en, RELOAD, 'Reload'), _defineProperty(_en, CANCEL, 'Cancel'), _defineProperty(_en, OK, 'OK'), _defineProperty(_en, POPULATE, 'Populate'), _defineProperty(_en, NO_LAYERS_SELECTED, 'No layers selected'), _defineProperty(_en, SELECT_LAYERS_TO_POPULATE, 'Please select the layers to populate.'), _defineProperty(_en, POPULATING_FAILED, 'Populating failed'), _defineProperty(_en, NO_MATCHING_KEYS, 'The selected layers\' placeholders did not match any keys in the JSON data.'), _defineProperty(_en, UNABLE_TO_PREVIEW_JSON, 'Unable to preview JSON'), _defineProperty(_en, LOADING_DATA, 'Loading data...'), _defineProperty(_en, CLICKED_CANCEL_BUTTON, 'Clicked cancel button'), _defineProperty(_en, CLOSED_DIALOG_WITH_ESC_KEY, 'Closed dialog with ESC key'), _defineProperty(_en, LAST_USED_DATA_TITLE, 'Last Used Data'), _defineProperty(_en, LAST_USED_DATA_DESCRIPTION, 'Your last used command, JSON, data path, data options and default substitute are shown below.'), _defineProperty(_en, COMMAND, 'Command'), _defineProperty(_en, LOADING_FAILED, 'Loading failed'), _defineProperty(_en, NO_LAST_USED_DATA, 'No last used data'), _defineProperty(_en, FIRST_TIME_USING_DATA_POPULATOR, 'As this is your first time using the Data Populator plugin, please use one of the other commands such as \'Populate with Preset\' or \'Populate from URL\'.'), _defineProperty(_en, CLEAR_LAYERS_TITLE, 'Clear Layers'), _defineProperty(_en, CLEAR_LAYERS_DESCRIPTION, 'Clear populated data from the selected layers.'), _defineProperty(_en, SELECT_LAYERS_TO_CLEAR, 'Please select the layers to clear.'), _defineProperty(_en, REVEAL_PRESETS_LIBRARY_TITLE, 'Reveal Presets Library'), _defineProperty(_en, REVEAL_PRESETS_LIBRARY_DESCRIPTION, 'Open the folder storing your presets library.'), _defineProperty(_en, SET_PRESETS_LIBRARY_TITLE, 'Set Presets Library'), _defineProperty(_en, SET_PRESETS_LIBRARY_DESCRIPTION, 'Choose the folder containing your preset library.'), _defineProperty(_en, PRESETS_LIBRARY_NOT_FOUND, "Presets library was not found. Please set it via 'Set Presets Library'"), _defineProperty(_en, NEED_HELP_TITLE, 'Need Help?'), _defineProperty(_en, NEED_HELP_DESCRIPTION, 'Find useful tips & tricks and ask for help.'), _en)

  /**
   * Returns the string that corresponds to the passed in key.
   *
   * @returns {String}
   */
};

},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.randomInteger = randomInteger;
exports.mergeStringWithValues = mergeStringWithValues;
exports.parsePrimitives = parsePrimitives;
/**
 * Utils
 *
 * Provides utility and miscellaneous functionality.
 */

/**
 * Generates a random integer between min and max inclusive.
 *
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Substitutes the placeholders in the string using the provided values.
 *
 * @param {String} string - String with placeholders in the {placeholder} format.
 * @param {Object} values - Object with values to substitute for placeholders.
 * @returns {String} - String with placeholders substituted for values.
 */
function mergeStringWithValues(string, values) {

  // get properties in values
  var properties = Object.keys(values);

  properties.forEach(function (property) {

    // escape regex
    var sanitisedProperty = property.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
    sanitisedProperty = '{' + sanitisedProperty + '}';

    // build regex
    var exp = RegExp(sanitisedProperty, 'g');

    // replace instances of property placeholder with value
    string = string.replace(exp, values[property]);
  });

  return string;
}

/**
 * Parses the string and returns the value of the correct type.
 *
 * @param {String} value
 * @returns {*}
 */
function parsePrimitives(value) {

  if (value === '') {
    return value;
  } else if (value === 'true' || value === '1') {
    value = true;
  } else if (value === 'false' || value === '0') {
    value = false;
  } else if (value === 'null') {
    value = null;
  } else if (value === 'undefined') {
    value = undefined;
  } else if (!isNaN(value) && value !== '') {
    value = parseFloat(value);
  }

  return value;
}

},{}],15:[function(require,module,exports){
'use strict';

var t = require('typical');

/**
 * @module array-back
 * @example
 * var arrayify = require("array-back")
 */
module.exports = arrayify;

/**
 * Takes any input and guarantees an array back.
 *
 * - converts array-like objects (e.g. `arguments`) to a real array
 * - converts `undefined` to an empty array
 * - converts any another other, singular value (including `null`) into an array containing that value
 * - ignores input which is already an array
 *
 * @param {*} - the input value to convert to an array
 * @returns {Array}
 * @alias module:array-back
 * @example
 * > a.arrayify(undefined)
 * []
 *
 * > a.arrayify(null)
 * [ null ]
 *
 * > a.arrayify(0)
 * [ 0 ]
 *
 * > a.arrayify([ 1, 2 ])
 * [ 1, 2 ]
 *
 * > function f(){ return a.arrayify(arguments); }
 * > f(1,2,3)
 * [ 1, 2, 3 ]
 */
function arrayify(input) {
  if (input === undefined) {
    return [];
  } else if (t.isArrayLike(input)) {
    return Array.prototype.slice.call(input);
  } else {
    return Array.isArray(input) ? input : [input];
  }
}

},{"typical":82}],16:[function(require,module,exports){
(function (process){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var arrayify = require('array-back');
var option = require('./option');
var findReplace = require('find-replace');

var Argv = function () {
  function Argv(argv) {
    _classCallCheck(this, Argv);

    if (argv) {
      argv = arrayify(argv);
    } else {
      argv = process.argv.slice(0);
      argv.splice(0, 2);
    }

    this.list = argv;
  }

  _createClass(Argv, [{
    key: 'clear',
    value: function clear() {
      this.list.length = 0;
    }
  }, {
    key: 'expandOptionEqualsNotation',
    value: function expandOptionEqualsNotation() {
      var _this = this;

      var optEquals = option.optEquals;
      if (this.list.some(optEquals.test.bind(optEquals))) {
        (function () {
          var expandedArgs = [];
          _this.list.forEach(function (arg) {
            var matches = arg.match(optEquals.re);
            if (matches) {
              expandedArgs.push(matches[1], option.VALUE_MARKER + matches[2]);
            } else {
              expandedArgs.push(arg);
            }
          });
          _this.clear();
          _this.list = expandedArgs;
        })();
      }
    }
  }, {
    key: 'expandGetoptNotation',
    value: function expandGetoptNotation() {
      var combinedArg = option.combined;
      var hasGetopt = this.list.some(combinedArg.test.bind(combinedArg));
      if (hasGetopt) {
        findReplace(this.list, combinedArg.re, function (arg) {
          arg = arg.slice(1);
          return arg.split('').map(function (letter) {
            return '-' + letter;
          });
        });
      }
    }
  }, {
    key: 'validate',
    value: function validate(definitions) {
      var invalidOption = void 0;

      var optionWithoutDefinition = this.list.filter(function (arg) {
        return option.isOption(arg);
      }).some(function (arg) {
        if (definitions.get(arg) === undefined) {
          invalidOption = arg;
          return true;
        }
      });
      if (optionWithoutDefinition) {
        halt('UNKNOWN_OPTION', 'Unknown option: ' + invalidOption);
      }
    }
  }]);

  return Argv;
}();

function halt(name, message) {
  var err = new Error(message);
  err.name = name;
  throw err;
}

module.exports = Argv;

}).call(this,require('_process'))
},{"./option":20,"_process":111,"array-back":15,"find-replace":28}],17:[function(require,module,exports){
'use strict';

var arrayify = require('array-back');
var Definitions = require('./definitions');
var option = require('./option');
var t = require('typical');
var Argv = require('./argv');

module.exports = commandLineArgs;

function commandLineArgs(definitions, argv) {
  definitions = new Definitions(definitions);
  argv = new Argv(argv);
  argv.expandOptionEqualsNotation();
  argv.expandGetoptNotation();
  argv.validate(definitions);

  var output = definitions.createOutput();
  var def = void 0;

  argv.list.forEach(function (item) {
    if (option.isOption(item)) {
      def = definitions.get(item);
      if (!t.isDefined(output[def.name])) outputSet(output, def.name, def.getInitialValue());
      if (def.isBoolean()) {
        outputSet(output, def.name, true);
        def = null;
      }
    } else {
      var reBeginsWithValueMarker = new RegExp('^' + option.VALUE_MARKER);
      var value = reBeginsWithValueMarker.test(item) ? item.replace(reBeginsWithValueMarker, '') : item;
      if (!def) {
        def = definitions.getDefault();
        if (!def) return;
        if (!t.isDefined(output[def.name])) outputSet(output, def.name, def.getInitialValue());
      }

      var outputValue = def.type ? def.type(value) : value;
      outputSet(output, def.name, outputValue);

      if (!def.multiple) def = null;
    }
  });

  for (var key in output) {
    var value = output[key];
    if (Array.isArray(value) && value._initial) delete value._initial;
  }

  if (definitions.isGrouped()) {
    return groupOutput(definitions, output);
  } else {
    return output;
  }
}

function outputSet(output, property, value) {
  if (output[property] && output[property]._initial) {
    output[property] = [];
    delete output[property]._initial;
  }
  if (Array.isArray(output[property])) {
    output[property].push(value);
  } else {
    output[property] = value;
  }
}

function groupOutput(definitions, output) {
  var grouped = {
    _all: output
  };

  definitions.whereGrouped().forEach(function (def) {
    arrayify(def.group).forEach(function (groupName) {
      grouped[groupName] = grouped[groupName] || {};
      if (t.isDefined(output[def.name])) {
        grouped[groupName][def.name] = output[def.name];
      }
    });
  });

  definitions.whereNotGrouped().forEach(function (def) {
    if (t.isDefined(output[def.name])) {
      if (!grouped._none) grouped._none = {};
      grouped._none[def.name] = output[def.name];
    }
  });
  return grouped;
}

},{"./argv":16,"./definitions":19,"./option":20,"array-back":15,"typical":82}],18:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var t = require('typical');

var OptionDefinition = function () {
  function OptionDefinition(definition) {
    _classCallCheck(this, OptionDefinition);

    this.name = definition.name;

    this.type = definition.type;

    this.alias = definition.alias;

    this.multiple = definition.multiple;

    this.defaultOption = definition.defaultOption;

    this.defaultValue = definition.defaultValue;

    this.group = definition.group;

    for (var prop in definition) {
      if (!this[prop]) this[prop] = definition[prop];
    }
  }

  _createClass(OptionDefinition, [{
    key: 'getInitialValue',
    value: function getInitialValue() {
      if (this.multiple) {
        return [];
      } else if (this.isBoolean() || !this.type) {
        return true;
      } else {
        return null;
      }
    }
  }, {
    key: 'isBoolean',
    value: function isBoolean() {
      if (this.type) {
        return this.type === Boolean || t.isFunction(this.type) && this.type.name === 'Boolean';
      } else {
        return false;
      }
    }
  }]);

  return OptionDefinition;
}();

module.exports = OptionDefinition;

},{"typical":82}],19:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var arrayify = require('array-back');
var option = require('./option');
var Definition = require('./definition');
var t = require('typical');

var Definitions = function () {
  function Definitions(definitions) {
    var _this = this;

    _classCallCheck(this, Definitions);

    this.list = [];
    arrayify(definitions).forEach(function (def) {
      return _this.list.push(new Definition(def));
    });
    this.validate();
  }

  _createClass(Definitions, [{
    key: 'validate',
    value: function validate(argv) {
      var someHaveNoName = this.list.some(function (def) {
        return !def.name;
      });
      if (someHaveNoName) {
        halt('NAME_MISSING', 'Invalid option definitions: the `name` property is required on each definition');
      }

      var someDontHaveFunctionType = this.list.some(function (def) {
        return def.type && typeof def.type !== 'function';
      });
      if (someDontHaveFunctionType) {
        halt('INVALID_TYPE', 'Invalid option definitions: the `type` property must be a setter fuction (default: `Boolean`)');
      }

      var invalidOption = void 0;

      var numericAlias = this.list.some(function (def) {
        invalidOption = def;
        return t.isDefined(def.alias) && t.isNumber(def.alias);
      });
      if (numericAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: to avoid ambiguity an alias cannot be numeric [--' + invalidOption.name + ' alias is -' + invalidOption.alias + ']');
      }

      var multiCharacterAlias = this.list.some(function (def) {
        invalidOption = def;
        return t.isDefined(def.alias) && def.alias.length !== 1;
      });
      if (multiCharacterAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: an alias must be a single character');
      }

      var hypenAlias = this.list.some(function (def) {
        invalidOption = def;
        return def.alias === '-';
      });
      if (hypenAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: an alias cannot be "-"');
      }

      var duplicateName = hasDuplicates(this.list.map(function (def) {
        return def.name;
      }));
      if (duplicateName) {
        halt('DUPLICATE_NAME', 'Two or more option definitions have the same name');
      }

      var duplicateAlias = hasDuplicates(this.list.map(function (def) {
        return def.alias;
      }));
      if (duplicateAlias) {
        halt('DUPLICATE_ALIAS', 'Two or more option definitions have the same alias');
      }

      var duplicateDefaultOption = hasDuplicates(this.list.map(function (def) {
        return def.defaultOption;
      }));
      if (duplicateDefaultOption) {
        halt('DUPLICATE_DEFAULT_OPTION', 'Only one option definition can be the defaultOption');
      }
    }
  }, {
    key: 'createOutput',
    value: function createOutput() {
      var output = {};
      this.list.forEach(function (def) {
        if (t.isDefined(def.defaultValue)) output[def.name] = def.defaultValue;
        if (Array.isArray(output[def.name])) {
          output[def.name]._initial = true;
        }
      });
      return output;
    }
  }, {
    key: 'get',
    value: function get(arg) {
      return option.short.test(arg) ? this.list.find(function (def) {
        return def.alias === option.short.name(arg);
      }) : this.list.find(function (def) {
        return def.name === option.long.name(arg);
      });
    }
  }, {
    key: 'getDefault',
    value: function getDefault() {
      return this.list.find(function (def) {
        return def.defaultOption === true;
      });
    }
  }, {
    key: 'isGrouped',
    value: function isGrouped() {
      return this.list.some(function (def) {
        return def.group;
      });
    }
  }, {
    key: 'whereGrouped',
    value: function whereGrouped() {
      return this.list.filter(containsValidGroup);
    }
  }, {
    key: 'whereNotGrouped',
    value: function whereNotGrouped() {
      return this.list.filter(function (def) {
        return !containsValidGroup(def);
      });
    }
  }]);

  return Definitions;
}();

function halt(name, message) {
  var err = new Error(message);
  err.name = name;
  throw err;
}

function containsValidGroup(def) {
  return arrayify(def.group).some(function (group) {
    return group;
  });
}

function hasDuplicates(array) {
  var items = {};
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (items[value]) {
      return true;
    } else {
      if (t.isDefined(value)) items[value] = true;
    }
  }
}

module.exports = Definitions;

},{"./definition":18,"./option":20,"array-back":15,"typical":82}],20:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Arg = function () {
  function Arg(re) {
    _classCallCheck(this, Arg);

    this.re = re;
  }

  _createClass(Arg, [{
    key: 'name',
    value: function name(arg) {
      return arg.match(this.re)[1];
    }
  }, {
    key: 'test',
    value: function test(arg) {
      return this.re.test(arg);
    }
  }]);

  return Arg;
}();

var option = {
  short: new Arg(/^-([^\d-])$/),
  long: new Arg(/^--(\S+)/),
  combined: new Arg(/^-([^\d-]{2,})$/),
  isOption: function isOption(arg) {
    return this.short.test(arg) || this.long.test(arg);
  },

  optEquals: new Arg(/^(--\S+?)=(.*)/),
  VALUE_MARKER: '552f3a31-14cd-4ced-bd67-656a659e9efb' };

module.exports = option;

},{}],21:[function(require,module,exports){
'use strict';

var detect = require('feature-detect-es6');

if (detect.all('class', 'arrowFunction')) {
  module.exports = require('./src/lib/command-line-args');
} else {
  module.exports = require('./es5/lib/command-line-args');
}

/* for node 0.12 */
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function value(predicate) {
      'use strict';

      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
    }
  });
}

},{"./es5/lib/command-line-args":17,"./src/lib/command-line-args":23,"feature-detect-es6":27}],22:[function(require,module,exports){
(function (process){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var arrayify = require('array-back');
var option = require('./option');
var findReplace = require('find-replace');

/**
 * Handles parsing different argv notations
 *
 * @module argv
 * @private
 */

var Argv = function () {
  function Argv(argv) {
    _classCallCheck(this, Argv);

    if (argv) {
      argv = arrayify(argv);
    } else {
      /* if no argv supplied, assume we are parsing process.argv */
      argv = process.argv.slice(0);
      argv.splice(0, 2);
    }

    this.list = argv;
  }

  _createClass(Argv, [{
    key: 'clear',
    value: function clear() {
      this.list.length = 0;
    }

    /**
     * expand --option=value style args. The value is clearly marked to indicate it is definitely a value (which would otherwise be unclear if the value is `--value`, which would be parsed as an option). The special marker is removed in parsing phase.
     */

  }, {
    key: 'expandOptionEqualsNotation',
    value: function expandOptionEqualsNotation() {
      var optEquals = option.optEquals;
      if (this.list.some(optEquals.test.bind(optEquals))) {
        var expandedArgs = [];
        this.list.forEach(function (arg) {
          var matches = arg.match(optEquals.re);
          if (matches) {
            expandedArgs.push(matches[1], option.VALUE_MARKER + matches[2]);
          } else {
            expandedArgs.push(arg);
          }
        });
        this.clear();
        this.list = expandedArgs;
      }
    }

    /**
     * expand getopt-style combined options
     */

  }, {
    key: 'expandGetoptNotation',
    value: function expandGetoptNotation() {
      var combinedArg = option.combined;
      var hasGetopt = this.list.some(combinedArg.test.bind(combinedArg));
      if (hasGetopt) {
        findReplace(this.list, combinedArg.re, function (arg) {
          arg = arg.slice(1);
          return arg.split('').map(function (letter) {
            return '-' + letter;
          });
        });
      }
    }

    /**
     * Inspect the user-supplied options for validation issues.
     * @throws `UNKNOWN_OPTION`
     */

  }, {
    key: 'validate',
    value: function validate(definitions) {
      var invalidOption = void 0;

      var optionWithoutDefinition = this.list.filter(function (arg) {
        return option.isOption(arg);
      }).some(function (arg) {
        if (definitions.get(arg) === undefined) {
          invalidOption = arg;
          return true;
        }
      });
      if (optionWithoutDefinition) {
        halt('UNKNOWN_OPTION', 'Unknown option: ' + invalidOption);
      }
    }
  }]);

  return Argv;
}();

function halt(name, message) {
  var err = new Error(message);
  err.name = name;
  throw err;
}

module.exports = Argv;

}).call(this,require('_process'))
},{"./option":26,"_process":111,"array-back":15,"find-replace":28}],23:[function(require,module,exports){
'use strict';

var arrayify = require('array-back');
var Definitions = require('./definitions');
var option = require('./option');
var t = require('typical');
var Argv = require('./argv');

/**
 * @module command-line-args
 */
module.exports = commandLineArgs;

/**
 * Returns an object containing all options set on the command line. By default it parses the global  [`process.argv`](https://nodejs.org/api/process.html#process_process_argv) array.
 *
 * @param {module:definition[]} - An array of [OptionDefinition](#exp_module_definition--OptionDefinition) objects
 * @param [argv] {string[]} - An array of strings, which if passed will be parsed instead  of `process.argv`.
 * @returns {object}
 * @throws `UNKNOWN_OPTION` if the user sets an option without a definition
 * @throws `NAME_MISSING` if an option definition is missing the required `name` property
 * @throws `INVALID_TYPE` if an option definition has a `type` value that's not a function
 * @throws `INVALID_ALIAS` if an alias is numeric, a hyphen or a length other than 1
 * @throws `DUPLICATE_NAME` if an option definition name was used more than once
 * @throws `DUPLICATE_ALIAS` if an option definition alias was used more than once
 * @throws `DUPLICATE_DEFAULT_OPTION` if more than one option definition has `defaultOption: true`
 * @alias module:command-line-args
 * @example
 * ```js
 * const commandLineArgs = require('command-line-args')
 * const options = commandLineArgs([
 *   { name: 'file' },
 *   { name: 'verbose' },
 *   { name: 'depth'}
 * ])
 * ```
 */
function commandLineArgs(definitions, argv) {
  definitions = new Definitions(definitions);
  argv = new Argv(argv);
  argv.expandOptionEqualsNotation();
  argv.expandGetoptNotation();
  argv.validate(definitions);

  /* create output initialised with default values */
  var output = definitions.createOutput();
  var def = void 0;

  /* walk argv building the output */
  argv.list.forEach(function (item) {
    if (option.isOption(item)) {
      def = definitions.get(item);
      if (!t.isDefined(output[def.name])) outputSet(output, def.name, def.getInitialValue());
      if (def.isBoolean()) {
        outputSet(output, def.name, true);
        def = null;
      }
    } else {
      /* if the value marker is present at the beginning, strip it */
      var reBeginsWithValueMarker = new RegExp('^' + option.VALUE_MARKER);
      var value = reBeginsWithValueMarker.test(item) ? item.replace(reBeginsWithValueMarker, '') : item;
      if (!def) {
        def = definitions.getDefault();
        if (!def) return;
        if (!t.isDefined(output[def.name])) outputSet(output, def.name, def.getInitialValue());
      }

      var outputValue = def.type ? def.type(value) : value;
      outputSet(output, def.name, outputValue);

      if (!def.multiple) def = null;
    }
  });

  /* clear _initial flags */
  for (var key in output) {
    var value = output[key];
    if (Array.isArray(value) && value._initial) delete value._initial;
  }

  /* group the output values */
  if (definitions.isGrouped()) {
    return groupOutput(definitions, output);
  } else {
    return output;
  }
}

function outputSet(output, property, value) {
  if (output[property] && output[property]._initial) {
    output[property] = [];
    delete output[property]._initial;
  }
  if (Array.isArray(output[property])) {
    output[property].push(value);
  } else {
    output[property] = value;
  }
}

function groupOutput(definitions, output) {
  var grouped = {
    _all: output
  };

  definitions.whereGrouped().forEach(function (def) {
    arrayify(def.group).forEach(function (groupName) {
      grouped[groupName] = grouped[groupName] || {};
      if (t.isDefined(output[def.name])) {
        grouped[groupName][def.name] = output[def.name];
      }
    });
  });

  definitions.whereNotGrouped().forEach(function (def) {
    if (t.isDefined(output[def.name])) {
      if (!grouped._none) grouped._none = {};
      grouped._none[def.name] = output[def.name];
    }
  });
  return grouped;
}

},{"./argv":22,"./definitions":25,"./option":26,"array-back":15,"typical":82}],24:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var t = require('typical');

/**
 * @module definition
 */

/**
 * Describes a command-line option. Additionally, you can add `description` and `typeLabel` propeties and make use of [command-line-usage](https://github.com/75lb/command-line-usage).
 * @alias module:definition
 * @typicalname option
 */

var OptionDefinition = function () {
  function OptionDefinition(definition) {
    _classCallCheck(this, OptionDefinition);

    /**
    * The only required definition property is `name`, so the simplest working example is
    * ```js
    * [
    *   { name: "file" },
    *   { name: "verbose" },
    *   { name: "depth"}
    * ]
    * ```
    *
    * In this case, the value of each option will be either a Boolean or string.
    *
    * | #   | Command line args | .parse() output |
    * | --- | -------------------- | ------------ |
    * | 1   | `--file` | `{ file: true }` |
    * | 2   | `--file lib.js --verbose` | `{ file: "lib.js", verbose: true }` |
    * | 3   | `--verbose very` | `{ verbose: "very" }` |
    * | 4   | `--depth 2` | `{ depth: "2" }` |
    *
    * Unicode option names and aliases are valid, for example:
    * ```js
    * [
    *   { name: 'один' },
    *   { name: '两' },
    *   { name: 'три', alias: 'т' }
    * ]
    * ```
    * @type {string}
    */
    this.name = definition.name;

    /**
    * The `type` value is a setter function (you receive the output from this), enabling you to be specific about the type and value received.
    *
    * You can use a class, if you like:
    *
    * ```js
    * const fs = require('fs')
    *
    * function FileDetails(filename){
    *   if (!(this instanceof FileDetails)) return new FileDetails(filename)
    *   this.filename = filename
    *   this.exists = fs.existsSync(filename)
    * }
    *
    * const cli = commandLineArgs([
    *   { name: 'file', type: FileDetails },
    *   { name: 'depth', type: Number }
    * ])
    * ```
    *
    * | #   | Command line args| .parse() output |
    * | --- | ----------------- | ------------ |
    * | 1   | `--file asdf.txt` | `{ file: { filename: 'asdf.txt', exists: false } }` |
    *
    * The `--depth` option expects a `Number`. If no value was set, you will receive `null`.
    *
    * | #   | Command line args | .parse() output |
    * | --- | ----------------- | ------------ |
    * | 2   | `--depth` | `{ depth: null }` |
    * | 3   | `--depth 2` | `{ depth: 2 }` |
    *
    * @type {function}
    */
    this.type = definition.type;

    /**
    * getopt-style short option names. Can be any single character (unicode included) except a digit or hypen.
    *
    * ```js
    * [
    *   { name: "hot", alias: "h", type: Boolean },
    *   { name: "discount", alias: "d", type: Boolean },
    *   { name: "courses", alias: "c" , type: Number }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `-hcd` | `{ hot: true, courses: null, discount: true }` |
    * | 2   | `-hdc 3` | `{ hot: true, discount: true, courses: 3 }` |
    *
    * @type {string}
    */
    this.alias = definition.alias;

    /**
    * Set this flag if the option takes a list of values. You will receive an array of values, each passed through the `type` function (if specified).
    *
    * ```js
    * [
    *   { name: "files", type: String, multiple: true }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `--files one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 2   | `--files one.js --files two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 3   | `--files *` | `{ files: [ 'one.js', 'two.js' ] }` |
    *
    * @type {boolean}
    */
    this.multiple = definition.multiple;

    /**
    * Any unclaimed command-line args will be set on this option. This flag is typically set on the most commonly-used option to make for more concise usage (i.e. `$ myapp *.js` instead of `$ myapp --files *.js`).
    *
    * ```js
    * [
    *   { name: "files", type: String, multiple: true, defaultOption: true }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `--files one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 2   | `one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 3   | `*` | `{ files: [ 'one.js', 'two.js' ] }` |
    *
    * @type {boolean}
    */
    this.defaultOption = definition.defaultOption;

    /**
    * An initial value for the option.
    *
    * ```js
    * [
    *   { name: "files", type: String, multiple: true, defaultValue: [ "one.js" ] },
    *   { name: "max", type: Number, defaultValue: 3 }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   |  | `{ files: [ 'one.js' ], max: 3 }` |
    * | 2   | `--files two.js` | `{ files: [ 'two.js' ], max: 3 }` |
    * | 3   | `--max 4` | `{ files: [ 'one.js' ], max: 4 }` |
    *
    * @type {*}
    */
    this.defaultValue = definition.defaultValue;

    /**
    * When your app has a large amount of options it makes sense to organise them in groups.
    *
    * There are two automatic groups: `_all` (contains all options) and `_none` (contains options without a `group` specified in their definition).
    *
    * ```js
    * [
    *   { name: "verbose", group: "standard" },
    *   { name: "help", group: [ "standard", "main" ] },
    *   { name: "compress", group: [ "server", "main" ] },
    *   { name: "static", group: "server" },
    *   { name: "debug" }
    * ]
    * ```
    *
    *<table>
    *  <tr>
    *    <th>#</th><th>Command Line</th><th>.parse() output</th>
    *  </tr>
    *  <tr>
    *    <td>1</td><td><code>--verbose</code></td><td><pre><code>
    *{
    *  _all: { verbose: true },
    *  standard: { verbose: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>2</td><td><code>--debug</code></td><td><pre><code>
    *{
    *  _all: { debug: true },
    *  _none: { debug: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>3</td><td><code>--verbose --debug --compress</code></td><td><pre><code>
    *{
    *  _all: {
    *    verbose: true,
    *    debug: true,
    *    compress: true
    *  },
    *  standard: { verbose: true },
    *  server: { compress: true },
    *  main: { compress: true },
    *  _none: { debug: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>4</td><td><code>--compress</code></td><td><pre><code>
    *{
    *  _all: { compress: true },
    *  server: { compress: true },
    *  main: { compress: true }
    *}
    *</code></pre></td>
    *  </tr>
    *</table>
    *
    * @type {string|string[]}
    */
    this.group = definition.group;

    /* pick up any remaining properties */
    for (var prop in definition) {
      if (!this[prop]) this[prop] = definition[prop];
    }
  }

  _createClass(OptionDefinition, [{
    key: 'getInitialValue',
    value: function getInitialValue() {
      if (this.multiple) {
        return [];
      } else if (this.isBoolean() || !this.type) {
        return true;
      } else {
        return null;
      }
    }
  }, {
    key: 'isBoolean',
    value: function isBoolean() {
      if (this.type) {
        return this.type === Boolean || t.isFunction(this.type) && this.type.name === 'Boolean';
      } else {
        return false;
      }
    }
  }]);

  return OptionDefinition;
}();

module.exports = OptionDefinition;

},{"typical":82}],25:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var arrayify = require('array-back');
var option = require('./option');
var Definition = require('./definition');
var t = require('typical');

/**
 * @module definitions
 * @private
 */

/**
 * @alias module:definitions
 */

var Definitions = function () {
  function Definitions(definitions) {
    var _this = this;

    _classCallCheck(this, Definitions);

    this.list = [];
    arrayify(definitions).forEach(function (def) {
      return _this.list.push(new Definition(def));
    });
    this.validate();
  }

  /**
   * validate option definitions
   * @returns {string}
   */


  _createClass(Definitions, [{
    key: 'validate',
    value: function validate(argv) {
      var someHaveNoName = this.list.some(function (def) {
        return !def.name;
      });
      if (someHaveNoName) {
        halt('NAME_MISSING', 'Invalid option definitions: the `name` property is required on each definition');
      }

      var someDontHaveFunctionType = this.list.some(function (def) {
        return def.type && typeof def.type !== 'function';
      });
      if (someDontHaveFunctionType) {
        halt('INVALID_TYPE', 'Invalid option definitions: the `type` property must be a setter fuction (default: `Boolean`)');
      }

      var invalidOption = void 0;

      var numericAlias = this.list.some(function (def) {
        invalidOption = def;
        return t.isDefined(def.alias) && t.isNumber(def.alias);
      });
      if (numericAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: to avoid ambiguity an alias cannot be numeric [--' + invalidOption.name + ' alias is -' + invalidOption.alias + ']');
      }

      var multiCharacterAlias = this.list.some(function (def) {
        invalidOption = def;
        return t.isDefined(def.alias) && def.alias.length !== 1;
      });
      if (multiCharacterAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: an alias must be a single character');
      }

      var hypenAlias = this.list.some(function (def) {
        invalidOption = def;
        return def.alias === '-';
      });
      if (hypenAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: an alias cannot be "-"');
      }

      var duplicateName = hasDuplicates(this.list.map(function (def) {
        return def.name;
      }));
      if (duplicateName) {
        halt('DUPLICATE_NAME', 'Two or more option definitions have the same name');
      }

      var duplicateAlias = hasDuplicates(this.list.map(function (def) {
        return def.alias;
      }));
      if (duplicateAlias) {
        halt('DUPLICATE_ALIAS', 'Two or more option definitions have the same alias');
      }

      var duplicateDefaultOption = hasDuplicates(this.list.map(function (def) {
        return def.defaultOption;
      }));
      if (duplicateDefaultOption) {
        halt('DUPLICATE_DEFAULT_OPTION', 'Only one option definition can be the defaultOption');
      }
    }

    /**
     * Initialise .parse() output object.
     * @returns {object}
     */

  }, {
    key: 'createOutput',
    value: function createOutput() {
      var output = {};
      this.list.forEach(function (def) {
        if (t.isDefined(def.defaultValue)) output[def.name] = def.defaultValue;
        if (Array.isArray(output[def.name])) {
          output[def.name]._initial = true;
        }
      });
      return output;
    }

    /**
     * @param {string}
     * @returns {Definition}
     */

  }, {
    key: 'get',
    value: function get(arg) {
      return option.short.test(arg) ? this.list.find(function (def) {
        return def.alias === option.short.name(arg);
      }) : this.list.find(function (def) {
        return def.name === option.long.name(arg);
      });
    }
  }, {
    key: 'getDefault',
    value: function getDefault() {
      return this.list.find(function (def) {
        return def.defaultOption === true;
      });
    }
  }, {
    key: 'isGrouped',
    value: function isGrouped() {
      return this.list.some(function (def) {
        return def.group;
      });
    }
  }, {
    key: 'whereGrouped',
    value: function whereGrouped() {
      return this.list.filter(containsValidGroup);
    }
  }, {
    key: 'whereNotGrouped',
    value: function whereNotGrouped() {
      return this.list.filter(function (def) {
        return !containsValidGroup(def);
      });
    }
  }]);

  return Definitions;
}();

function halt(name, message) {
  var err = new Error(message);
  err.name = name;
  throw err;
}

function containsValidGroup(def) {
  return arrayify(def.group).some(function (group) {
    return group;
  });
}

function hasDuplicates(array) {
  var items = {};
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (items[value]) {
      return true;
    } else {
      if (t.isDefined(value)) items[value] = true;
    }
  }
}

module.exports = Definitions;

},{"./definition":24,"./option":26,"array-back":15,"typical":82}],26:[function(require,module,exports){
'use strict';

/**
 * A module for testing for and extracting names from options (e.g. `--one`, `-o`)
 *
 * @module option
 * @private
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Arg = function () {
  function Arg(re) {
    _classCallCheck(this, Arg);

    this.re = re;
  }

  _createClass(Arg, [{
    key: 'name',
    value: function name(arg) {
      return arg.match(this.re)[1];
    }
  }, {
    key: 'test',
    value: function test(arg) {
      return this.re.test(arg);
    }
  }]);

  return Arg;
}();

var option = {
  short: new Arg(/^-([^\d-])$/),
  long: new Arg(/^--(\S+)/),
  combined: new Arg(/^-([^\d-]{2,})$/),
  isOption: function isOption(arg) {
    return this.short.test(arg) || this.long.test(arg);
  },

  optEquals: new Arg(/^(--\S+?)=(.*)/),
  VALUE_MARKER: '552f3a31-14cd-4ced-bd67-656a659e9efb' // must be unique
};

module.exports = option;

},{}],27:[function(require,module,exports){
'use strict';

var arrayify = require('array-back');

/**
 * Detect which ES6 (ES2015 and above) features are available.
 *
 * @module feature-detect-es6
 * @typicalname detect
 * @example
 * var detect = require('feature-detect-es6')
 *
 * if (detect.all('class', 'spread', 'let', 'arrowFunction')){
 *   // safe to run ES6 code natively..
 * } else {
 *   // run your transpiled ES5..
 * }
 */

/**
 * Returns true if the `class` statement is available.
 *
 * @returns {boolean}
 */
exports.class = function () {
  return evaluates('class Something {}');
};

/**
 * Returns true if the arrow functions available.
 *
 * @returns {boolean}
 */
exports.arrowFunction = function () {
  return evaluates('var f = x => 1');
};

/**
 * Returns true if the `let` statement is available.
 *
 * @returns {boolean}
 */
exports.let = function () {
  return evaluates('let a = 1');
};

/**
 * Returns true if the `const` statement is available.
 *
 * @returns {boolean}
 */
exports.const = function () {
  return evaluates('const a = 1');
};

/**
 * Returns true if the [new Array features](http://exploringjs.com/es6/ch_arrays.html) are available (exluding `Array.prototype.values` which has zero support anywhere).
 *
 * @returns {boolean}
 */
exports.newArrayFeatures = function () {
  return typeof Array.prototype.find !== 'undefined' && typeof Array.prototype.findIndex !== 'undefined' && typeof Array.from !== 'undefined' && typeof Array.of !== 'undefined' && typeof Array.prototype.entries !== 'undefined' && typeof Array.prototype.keys !== 'undefined' && typeof Array.prototype.copyWithin !== 'undefined' && typeof Array.prototype.fill !== 'undefined';
};

/**
 * Returns true if the new functions of Object are available.
 *
 * @returns {boolean}
 */
exports.newObjectFeatures = function () {
  return typeof Object.assign !== 'undefined' && typeof Object.setPrototypeOf !== 'undefined' && typeof Object.getOwnPropertySymbols !== 'undefined' && typeof Object.is !== 'undefined';
};

/**
 * Returns true if `Map`, `WeakMap`, `Set` and `WeakSet` are available.
 *
 * @returns {boolean}
 */
exports.collections = function () {
  return typeof Map !== 'undefined' && typeof WeakMap !== 'undefined' && typeof Set !== 'undefined' && typeof WeakSet !== 'undefined';
};

/**
 * Returns true if generators are available.
 *
 * @returns {boolean}
 */
exports.generators = function () {
  return evaluates('function* test() {}');
};

/**
 * Returns true if `Promise` is available.
 *
 * @returns {boolean}
 */
exports.promises = function () {
  return typeof Promise !== 'undefined';
};

/**
 * Returns true if template strings are available.
 *
 * @returns {boolean}
 */
exports.templateStrings = function () {
  return evaluates('var a = `a`');
};

/**
 * Returns true if `Symbol` is available.
 *
 * @returns {boolean}
 */
exports.symbols = function () {
  return typeof Symbol !== 'undefined' && typeof Symbol.for === 'function';
};

/**
 * Returns true if destructuring is available.
 *
 * @returns {boolean}
 */
exports.destructuring = function () {
  return evaluates("var { first: f, last: l } = { first: 'Jane', last: 'Doe' }");
};

/**
 * Returns true if the spread operator (`...`) is available.
 *
 * @returns {boolean}
 */
exports.spread = function () {
  return evaluates('Math.max(...[ 5, 10 ])');
};

/**
 * Returns true if default parameter values are available.
 *
 * @returns {boolean}
 */
exports.defaultParamValues = function () {
  return evaluates('function test (one = 1) {}');
};

/**
 * Returns true if async functions are available.
 *
 * @returns {boolean}
 */
exports.asyncFunctions = function () {
  return evaluates('async function test () {}');
};

function evaluates(statement) {
  try {
    eval(statement);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Returns true if *all* specified features are detected.
 *
 * @returns {boolean}
 * @param [...feature] {string} - the features to detect.
 * @example
 * var result = detect.all('class', 'spread', 'let', 'arrowFunction')
 */
exports.all = function () {
  return arrayify(arguments).every(function (testName) {
    var method = exports[testName];
    if (method && typeof method === 'function') {
      return method();
    } else {
      throw new Error('no detection available by this name: ' + testName);
    }
  });
};

},{"array-back":15}],28:[function(require,module,exports){
'use strict';

var arrayify = require('array-back');
var testValue = require('test-value');

/**
 * Find and either replace or remove items from an array.
 *
 * @module find-replace
 * @example
 * > findReplace = require('find-replace')
 *
 * > findReplace([ 1, 2, 3], 2, 'two')
 * [ 1, 'two', 3 ]
 *
 * > findReplace([ 1, 2, 3], 2, [ 'two', 'zwei' ])
 * [ 1, [ 'two', 'zwei' ], 3 ]
 *
 * > findReplace([ 1, 2, 3], 2, 'two', 'zwei')
 * [ 1, 'two', 'zwei', 3 ]
 *
 * > findReplace([ 1, 2, 3], 2) // no replacement, so remove
 * [ 1, 3 ]
 */
module.exports = findReplace;

/**
 * @param {array} - the input array
 * @param {valueTest} - a [test-value](https://github.com/75lb/test-value) query to match the value you're looking for
 * @param [replaceWith] {...any} - If specified, found values will be replaced with these values, else  removed.
 * @returns {array}
 * @alias module:find-replace
 */
function findReplace(array, valueTest) {
  var found = [];
  var replaceWiths = arrayify(arguments);
  replaceWiths.splice(0, 2);

  arrayify(array).forEach(function (value, index) {
    var expanded = [];
    replaceWiths.forEach(function (replaceWith) {
      if (typeof replaceWith === 'function') {
        expanded = expanded.concat(replaceWith(value));
      } else {
        expanded.push(replaceWith);
      }
    });

    if (testValue(value, valueTest)) {
      found.push({
        index: index,
        replaceWithValue: expanded
      });
    }
  });

  found.reverse().forEach(function (item) {
    var spliceArgs = [item.index, 1].concat(item.replaceWithValue);
    array.splice.apply(array, spliceArgs);
  });

  return array;
}

},{"array-back":15,"test-value":81}],29:[function(require,module,exports){
'use strict';

var hashClear = require('./_hashClear'),
    hashDelete = require('./_hashDelete'),
    hashGet = require('./_hashGet'),
    hashHas = require('./_hashHas'),
    hashSet = require('./_hashSet');

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;

},{"./_hashClear":47,"./_hashDelete":48,"./_hashGet":49,"./_hashHas":50,"./_hashSet":51}],30:[function(require,module,exports){
'use strict';

var listCacheClear = require('./_listCacheClear'),
    listCacheDelete = require('./_listCacheDelete'),
    listCacheGet = require('./_listCacheGet'),
    listCacheHas = require('./_listCacheHas'),
    listCacheSet = require('./_listCacheSet');

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;

},{"./_listCacheClear":55,"./_listCacheDelete":56,"./_listCacheGet":57,"./_listCacheHas":58,"./_listCacheSet":59}],31:[function(require,module,exports){
'use strict';

var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;

},{"./_getNative":44,"./_root":68}],32:[function(require,module,exports){
'use strict';

var mapCacheClear = require('./_mapCacheClear'),
    mapCacheDelete = require('./_mapCacheDelete'),
    mapCacheGet = require('./_mapCacheGet'),
    mapCacheHas = require('./_mapCacheHas'),
    mapCacheSet = require('./_mapCacheSet');

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;

},{"./_mapCacheClear":60,"./_mapCacheDelete":61,"./_mapCacheGet":62,"./_mapCacheHas":63,"./_mapCacheSet":64}],33:[function(require,module,exports){
'use strict';

var root = require('./_root');

/** Built-in value references. */
var _Symbol = root.Symbol;

module.exports = _Symbol;

},{"./_root":68}],34:[function(require,module,exports){
"use strict";

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],35:[function(require,module,exports){
'use strict';

var eq = require('./eq');

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;

},{"./eq":72}],36:[function(require,module,exports){
'use strict';

var castPath = require('./_castPath'),
    toKey = require('./_toKey');

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return index && index == length ? object : undefined;
}

module.exports = baseGet;

},{"./_castPath":40,"./_toKey":70}],37:[function(require,module,exports){
'use strict';

var _Symbol = require('./_Symbol'),
    getRawTag = require('./_getRawTag'),
    objectToString = require('./_objectToString');

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
    if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}

module.exports = baseGetTag;

},{"./_Symbol":33,"./_getRawTag":45,"./_objectToString":67}],38:[function(require,module,exports){
'use strict';

var isFunction = require('./isFunction'),
    isMasked = require('./_isMasked'),
    isObject = require('./isObject'),
    toSource = require('./_toSource');

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;

},{"./_isMasked":54,"./_toSource":71,"./isFunction":75,"./isObject":76}],39:[function(require,module,exports){
'use strict';

var _Symbol = require('./_Symbol'),
    arrayMap = require('./_arrayMap'),
    isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = value + '';
  return result == '0' && 1 / value == -INFINITY ? '-0' : result;
}

module.exports = baseToString;

},{"./_Symbol":33,"./_arrayMap":34,"./isArray":74,"./isSymbol":78}],40:[function(require,module,exports){
'use strict';

var isArray = require('./isArray'),
    isKey = require('./_isKey'),
    stringToPath = require('./_stringToPath'),
    toString = require('./toString');

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray(value)) {
    return value;
  }
  return isKey(value, object) ? [value] : stringToPath(toString(value));
}

module.exports = castPath;

},{"./_isKey":52,"./_stringToPath":69,"./isArray":74,"./toString":80}],41:[function(require,module,exports){
'use strict';

var root = require('./_root');

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;

},{"./_root":68}],42:[function(require,module,exports){
(function (global){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/** Detect free variable `global` from Node.js. */
var freeGlobal = (typeof global === 'undefined' ? 'undefined' : _typeof(global)) == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],43:[function(require,module,exports){
'use strict';

var isKeyable = require('./_isKeyable');

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

module.exports = getMapData;

},{"./_isKeyable":53}],44:[function(require,module,exports){
'use strict';

var baseIsNative = require('./_baseIsNative'),
    getValue = require('./_getValue');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;

},{"./_baseIsNative":38,"./_getValue":46}],45:[function(require,module,exports){
'use strict';

var _Symbol = require('./_Symbol');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;

},{"./_Symbol":33}],46:[function(require,module,exports){
"use strict";

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;

},{}],47:[function(require,module,exports){
'use strict';

var nativeCreate = require('./_nativeCreate');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;

},{"./_nativeCreate":66}],48:[function(require,module,exports){
"use strict";

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;

},{}],49:[function(require,module,exports){
'use strict';

var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;

},{"./_nativeCreate":66}],50:[function(require,module,exports){
'use strict';

var nativeCreate = require('./_nativeCreate');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

module.exports = hashHas;

},{"./_nativeCreate":66}],51:[function(require,module,exports){
'use strict';

var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;

},{"./_nativeCreate":66}],52:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}

module.exports = isKey;

},{"./isArray":74,"./isSymbol":78}],53:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

module.exports = isKeyable;

},{}],54:[function(require,module,exports){
'use strict';

var coreJsData = require('./_coreJsData');

/** Used to detect methods masquerading as native. */
var maskSrcKey = function () {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}

module.exports = isMasked;

},{"./_coreJsData":41}],55:[function(require,module,exports){
"use strict";

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;

},{}],56:[function(require,module,exports){
'use strict';

var assocIndexOf = require('./_assocIndexOf');

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

module.exports = listCacheDelete;

},{"./_assocIndexOf":35}],57:[function(require,module,exports){
'use strict';

var assocIndexOf = require('./_assocIndexOf');

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;

},{"./_assocIndexOf":35}],58:[function(require,module,exports){
'use strict';

var assocIndexOf = require('./_assocIndexOf');

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;

},{"./_assocIndexOf":35}],59:[function(require,module,exports){
'use strict';

var assocIndexOf = require('./_assocIndexOf');

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;

},{"./_assocIndexOf":35}],60:[function(require,module,exports){
'use strict';

var Hash = require('./_Hash'),
    ListCache = require('./_ListCache'),
    Map = require('./_Map');

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash(),
    'map': new (Map || ListCache)(),
    'string': new Hash()
  };
}

module.exports = mapCacheClear;

},{"./_Hash":29,"./_ListCache":30,"./_Map":31}],61:[function(require,module,exports){
'use strict';

var getMapData = require('./_getMapData');

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;

},{"./_getMapData":43}],62:[function(require,module,exports){
'use strict';

var getMapData = require('./_getMapData');

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;

},{"./_getMapData":43}],63:[function(require,module,exports){
'use strict';

var getMapData = require('./_getMapData');

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;

},{"./_getMapData":43}],64:[function(require,module,exports){
'use strict';

var getMapData = require('./_getMapData');

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;

},{"./_getMapData":43}],65:[function(require,module,exports){
'use strict';

var memoize = require('./memoize');

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize(func, function (key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

module.exports = memoizeCapped;

},{"./memoize":79}],66:[function(require,module,exports){
'use strict';

var getNative = require('./_getNative');

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;

},{"./_getNative":44}],67:[function(require,module,exports){
"use strict";

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

},{}],68:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":42}],69:[function(require,module,exports){
'use strict';

var memoizeCapped = require('./_memoizeCapped');

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoizeCapped(function (string) {
  var result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
      result.push('');
    }
  string.replace(rePropName, function (match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : number || match);
  });
  return result;
});

module.exports = stringToPath;

},{"./_memoizeCapped":65}],70:[function(require,module,exports){
'use strict';

var isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = value + '';
  return result == '0' && 1 / value == -INFINITY ? '-0' : result;
}

module.exports = toKey;

},{"./isSymbol":78}],71:[function(require,module,exports){
'use strict';

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return func + '';
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;

},{}],72:[function(require,module,exports){
"use strict";

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || value !== value && other !== other;
}

module.exports = eq;

},{}],73:[function(require,module,exports){
'use strict';

var baseGet = require('./_baseGet');

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

module.exports = get;

},{"./_baseGet":36}],74:[function(require,module,exports){
"use strict";

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;

},{}],75:[function(require,module,exports){
'use strict';

var baseGetTag = require('./_baseGetTag'),
    isObject = require('./isObject');

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
    if (!isObject(value)) {
        return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;

},{"./_baseGetTag":37,"./isObject":76}],76:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],77:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

module.exports = isObjectLike;

},{}],78:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
    return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'symbol' || isObjectLike(value) && baseGetTag(value) == symbolTag;
}

module.exports = isSymbol;

},{"./_baseGetTag":37,"./isObjectLike":77}],79:[function(require,module,exports){
'use strict';

var MapCache = require('./_MapCache');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || resolver != null && typeof resolver != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function memoized() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache)();
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

module.exports = memoize;

},{"./_MapCache":32}],80:[function(require,module,exports){
'use strict';

var baseToString = require('./_baseToString');

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

module.exports = toString;

},{"./_baseToString":39}],81:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var arrayify = require('array-back');
var t = require('typical');

/**
 * @module test-value
 * @example
 * var testValue = require('test-value')
 */
module.exports = testValue;

/**
 * @alias module:test-value
 * @param {any} - a value to test
 * @param {any} - the test query
 * @param [options] {object}
 * @param [options.strict] {boolean} - Treat an object like a value not a query. 
 * @returns {boolean}
 */
function testValue(value, test, options) {
  options = options || {};
  if (test !== Object.prototype && t.isPlainObject(test) && t.isObject(value) && !options.strict) {
    return Object.keys(test).every(function (prop) {
      var queryValue = test[prop];

      /* get flags */
      var isNegated = false;
      var isContains = false;

      if (prop.charAt(0) === '!') {
        isNegated = true;
      } else if (prop.charAt(0) === '+') {
        isContains = true;
      }

      /* strip flag char */
      prop = isNegated || isContains ? prop.slice(1) : prop;
      var objectValue = value[prop];

      if (isContains) {
        queryValue = arrayify(queryValue);
        objectValue = arrayify(objectValue);
      }

      var result = testValue(objectValue, queryValue, options);
      return isNegated ? !result : result;
    });
  } else if (test !== Array.prototype && Array.isArray(test)) {
    var tests = test;
    if (value === Array.prototype || !Array.isArray(value)) value = [value];
    return value.some(function (val) {
      return tests.some(function (test) {
        return testValue(val, test, options);
      });
    });

    /*
    regexes queries will always return `false` for `null`, `undefined`, `NaN`.
    This is to prevent a query like `/.+/` matching the string `undefined`.
    */
  } else if (test instanceof RegExp) {
    if (['boolean', 'string', 'number'].indexOf(typeof value === 'undefined' ? 'undefined' : _typeof(value)) === -1) {
      return false;
    } else {
      return test.test(value);
    }
  } else if (test !== Function.prototype && typeof test === 'function') {
    return test(value);
  } else {
    return test === value;
  }
}

/**
 * Returns a callback suitable for use by `Array` methods like `some`, `filter`, `find` etc.
 * @param {any} - the test query
 * @returns {function}
 */
testValue.where = function (test) {
  return function (value) {
    return testValue(value, test);
  };
};

},{"array-back":15,"typical":82}],82:[function(require,module,exports){
'use strict';

/**
 * For type-checking Javascript values.
 * @module typical
 * @typicalname t
 * @example
 * const t = require('typical')
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.isNumber = isNumber;
exports.isString = isString;
exports.isBoolean = isBoolean;
exports.isPlainObject = isPlainObject;
exports.isArrayLike = isArrayLike;
exports.isObject = isObject;
exports.isDefined = isDefined;
exports.isFunction = isFunction;
exports.isClass = isClass;
exports.isPrimitive = isPrimitive;
exports.isPromise = isPromise;
exports.isIterable = isIterable;

/**
 * Returns true if input is a number
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * > t.isNumber(0)
 * true
 * > t.isNumber(1)
 * true
 * > t.isNumber(1.1)
 * true
 * > t.isNumber(0xff)
 * true
 * > t.isNumber(0644)
 * true
 * > t.isNumber(6.2e5)
 * true
 * > t.isNumber(NaN)
 * false
 * > t.isNumber(Infinity)
 * false
 */
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * A plain object is a simple object literal, it is not an instance of a class. Returns true if the input `typeof` is `object` and directly decends from `Object`.
 *
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * > t.isPlainObject({ clive: 'hater' })
 * true
 * > t.isPlainObject(new Date())
 * false
 * > t.isPlainObject([ 0, 1 ])
 * false
 * > t.isPlainObject(1)
 * false
 * > t.isPlainObject(/test/)
 * false
 */
function isPlainObject(input) {
  return input !== null && (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' && input.constructor === Object;
}

/**
 * An array-like value has all the properties of an array, but is not an array instance. Examples in the `arguments` object. Returns true if the input value is an object, not null and has a `length` property with a numeric value.
 *
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * function sum(x, y){
 *     console.log(t.isArrayLike(arguments))
 *     // prints `true`
 * }
 */
function isArrayLike(input) {
  return isObject(input) && typeof input.length === 'number';
}

/**
 * returns true if the typeof input is `'object'`, but not null!
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isObject(input) {
  return (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' && input !== null;
}

/**
 * Returns true if the input value is defined
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isDefined(input) {
  return typeof input !== 'undefined';
}

/**
 * Returns true if the input value is a string
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isString(input) {
  return typeof input === 'string';
}

/**
 * Returns true if the input value is a boolean
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isBoolean(input) {
  return typeof input === 'boolean';
}

/**
 * Returns true if the input value is a function
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isFunction(input) {
  return typeof input === 'function';
}

/**
 * Returns true if the input value is an es2015 `class`.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isClass(input) {
  if (isFunction(input)) {
    return (/^class /.test(Function.prototype.toString.call(input))
    );
  } else {
    return false;
  }
}

/**
 * Returns true if the input is a string, number, symbol, boolean, null or undefined value.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isPrimitive(input) {
  if (input === null) return true;
  switch (typeof input === 'undefined' ? 'undefined' : _typeof(input)) {
    case "string":
    case "number":
    case "symbol":
    case "undefined":
    case "boolean":
      return true;
    default:
      return false;
  }
}

/**
 * Returns true if the input is a Promise.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isPromise(input) {
  if (input) {
    var isPromise = isDefined(Promise) && input instanceof Promise;
    var isThenable = input.then && typeof input.then === 'function';
    return isPromise || isThenable ? true : false;
  } else {
    return false;
  }
}

/**
 * Returns true if the input is an iterable (`Map`, `Set`, `Array` etc.).
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isIterable(input) {
  if (input === null || !isDefined(input)) {
    return false;
  } else {
    return typeof input[Symbol.iterator] === 'function';
  }
}

},{}],83:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _layers = require('../library/layers');

var Layers = _interopRequireWildcard(_layers);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

var _strings = require('../../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Clear Layers
 *
 * Clears the selected layers of any populated data and removes any metadata.
 */

exports.default = function (context) {
  (0, _context2.default)(context);

  // get selected layers
  var selectedLayers = Layers.getSelectedLayers();
  if (!selectedLayers.length) {
    return (0, _context2.default)().document.showMessage((0, STRINGS.default)(STRINGS.SELECT_LAYERS_TO_CLEAR));
  }

  // clear layers
  selectedLayers.forEach(function (layer) {
    Populator.clearLayer(layer);
  });

  // reload inspector to update displayed data
  context.document.reloadInspector();
};

},{"../../core/library/strings":13,"../library/context":102,"../library/layers":106,"../library/populator":108}],84:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resetOptions = exports.needHelp = exports.setPresetsLibrary = exports.revealPresets = exports.clearLayers = exports.lastUsedData = exports.populateAgain = exports.populateFromURL = exports.populateWithJSON = exports.populateWithPreset = undefined;

var _populateWithPreset = require('./populateWithPreset.js');

var _populateWithPreset2 = _interopRequireDefault(_populateWithPreset);

var _populateWithJSON = require('./populateWithJSON.js');

var _populateWithJSON2 = _interopRequireDefault(_populateWithJSON);

var _populateFromURL = require('./populateFromURL.js');

var _populateFromURL2 = _interopRequireDefault(_populateFromURL);

var _populateAgain = require('./populateAgain.js');

var _populateAgain2 = _interopRequireDefault(_populateAgain);

var _lastUsedData = require('./lastUsedData.js');

var _lastUsedData2 = _interopRequireDefault(_lastUsedData);

var _clearLayers = require('./clearLayers.js');

var _clearLayers2 = _interopRequireDefault(_clearLayers);

var _revealPresets = require('./revealPresets.js');

var _revealPresets2 = _interopRequireDefault(_revealPresets);

var _setPresetsLibrary = require('./setPresetsLibrary.js');

var _setPresetsLibrary2 = _interopRequireDefault(_setPresetsLibrary);

var _needHelp = require('./needHelp.js');

var _needHelp2 = _interopRequireDefault(_needHelp);

var _resetOptions = require('./resetOptions.js');

var _resetOptions2 = _interopRequireDefault(_resetOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Commands
 */

exports.populateWithPreset = _populateWithPreset2.default;
exports.populateWithJSON = _populateWithJSON2.default;
exports.populateFromURL = _populateFromURL2.default;
exports.populateAgain = _populateAgain2.default;
exports.lastUsedData = _lastUsedData2.default;
exports.clearLayers = _clearLayers2.default;
exports.revealPresets = _revealPresets2.default;
exports.setPresetsLibrary = _setPresetsLibrary2.default;
exports.needHelp = _needHelp2.default;
exports.resetOptions = _resetOptions2.default;

},{"./clearLayers.js":83,"./lastUsedData.js":85,"./needHelp.js":86,"./populateAgain.js":87,"./populateFromURL.js":88,"./populateWithJSON.js":89,"./populateWithPreset.js":90,"./resetOptions.js":91,"./revealPresets.js":92,"./setPresetsLibrary.js":93}],85:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _gui = require('../library/gui');

var Gui = _interopRequireWildcard(_gui);

var _options = require('../library/options');

var _options2 = _interopRequireDefault(_options);

var _strings = require('../../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

var _utils = require('../library/utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (context) {
  (0, _context2.default)(context);

  // get last used data
  var lastUsedData = Utils.documentMetadata(context.document, 'lastUsedData');
  if (!lastUsedData) {
    return (0, _context2.default)().document.showMessage((0, STRINGS.default)(STRINGS.NO_LAST_USED_DATA));
  }
  lastUsedData = Utils.decode(lastUsedData);

  await Gui.showWindow({
    viewOnly: true,
    options: (0, _options2.default)(),
    jsonData: lastUsedData
  });
}; /**
    * Last used data
    *
    * Shows the last used data that was used to populate.
    */

},{"../../core/library/strings":13,"../library/context":102,"../library/gui":104,"../library/options":107,"../library/utils":109}],86:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _strings = require('../../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Need help
 *
 * Opens the data populator help website
 */

exports.default = function (context) {
  (0, _context2.default)(context);

  NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString((0, STRINGS.default)(STRINGS.DATA_POPULATOR_URL)));
};

},{"../../core/library/strings":13,"../library/context":102}],87:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

var _populateWithPreset = require('./populateWithPreset');

var _populateWithPreset2 = _interopRequireDefault(_populateWithPreset);

var _populateWithJSON = require('./populateWithJSON');

var _populateWithJSON2 = _interopRequireDefault(_populateWithJSON);

var _populateFromURL = require('./populateFromURL');

var _populateFromURL2 = _interopRequireDefault(_populateFromURL);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (context) {
  (0, _context2.default)(context);

  // get options
  var options = (0, OPTIONS.default)();

  // get type of last populate command
  switch (options[OPTIONS.POPULATE_TYPE]) {

    // populate with preset
    case OPTIONS.POPULATE_TYPE_PRESET:
      if (options[OPTIONS.SELECTED_PRESET]) (0, _populateWithPreset2.default)(context, true);
      break;

    // populate with JSON
    case OPTIONS.POPULATE_TYPE_JSON:
      if (options[OPTIONS.JSON_PATH]) (0, _populateWithJSON2.default)(context, true);
      break;

    // populate from URL
    case OPTIONS.POPULATE_TYPE_URL:
      if (options[OPTIONS.URL]) (0, _populateFromURL2.default)(context, true);
      break;
  }
}; /**
    * Populate Again
    *
    * Populates the selected layers using the same settings as last time.
    */

},{"../library/context":102,"../library/options":107,"./populateFromURL":88,"./populateWithJSON":89,"./populateWithPreset":90}],88:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _gui = require('../library/gui');

var Gui = _interopRequireWildcard(_gui);

var _layers = require('../library/layers');

var Layers = _interopRequireWildcard(_layers);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

var _strings = require('../../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

var _utils = require('../library/utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function (context, populateAgain) {
  (0, _context2.default)(context);

  // get selected layers
  var selectedLayers = Layers.getSelectedLayers();
  if (!selectedLayers.length) {
    return (0, _context2.default)().document.showMessage((0, STRINGS.default)(STRINGS.SELECT_LAYERS_TO_POPULATE));
  }

  // get options and data
  var options = (0, OPTIONS.default)();
  options[OPTIONS.POPULATE_TYPE] = OPTIONS.POPULATE_TYPE_URL;
  var data = null;
  if (populateAgain) {

    // load preset data
    if (!options[OPTIONS.URL]) return;
    data = await Gui.call('loadURLData', {
      url: options[OPTIONS.URL],
      headers: options[OPTIONS.HEADERS]
    });
    data = Utils.accessObjectByString(data, options[OPTIONS.DATA_PATH] || '');
    if (!data) return;
  } else {

    // wait for user response including options and json data to be used
    var response = await Gui.showWindow({
      options: options
    });

    // terminate if cancelled
    if (!response) return;

    // get updated options and json data
    options = response.options;
    data = response.data;

    // create grid
    if (options[OPTIONS.CREATE_GRID]) {
      selectedLayers = Layers.createGrid(selectedLayers, {
        rowsCount: options[OPTIONS.ROWS_COUNT],
        rowsMargin: options[OPTIONS.ROWS_MARGIN],
        columnsCount: options[OPTIONS.COLUMNS_COUNT],
        columnsMargin: options[OPTIONS.COLUMNS_MARGIN]
      });

      // make sure that grid creation was successful
      // could have failed if zero rows were requested for example
      if (!selectedLayers) return;
    }
  }

  // get root dir used when populating local images
  // in case of url population, only remote images can be retrieved
  options.rootDir = '/';

  // save options
  (0, OPTIONS.default)(options);

  // store data used to populate the layers
  Utils.documentMetadata(context.document, 'lastUsedData', Utils.encode(data));

  // populate selected layers
  Populator.populateLayers(selectedLayers, data, options);

  // restore selected layers
  Layers.selectLayers(selectedLayers);

  context.document.reloadInspector();
}; /**
    * Populate from URL
    *
    * Populates the selected layers from a URL.
    */

},{"../../core/library/strings":13,"../library/context":102,"../library/gui":104,"../library/layers":106,"../library/options":107,"../library/populator":108,"../library/utils":109}],89:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _data = require('../library/data');

var Data = _interopRequireWildcard(_data);

var _gui = require('../library/gui');

var Gui = _interopRequireWildcard(_gui);

var _layers = require('../library/layers');

var Layers = _interopRequireWildcard(_layers);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

var _strings = require('../../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

var _utils = require('../library/utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Populate with JSON
 *
 * Populates the selected layers with a JSON file.
 */

exports.default = async function (context, populateAgain) {
  (0, _context2.default)(context);

  // get selected layers
  var selectedLayers = Layers.getSelectedLayers();
  if (!selectedLayers.length) {
    return (0, _context2.default)().document.showMessage((0, STRINGS.default)(STRINGS.SELECT_LAYERS_TO_POPULATE));
  }

  // get options and data
  var options = (0, OPTIONS.default)();
  options[OPTIONS.POPULATE_TYPE] = OPTIONS.POPULATE_TYPE_JSON;
  var data = null;
  if (populateAgain) {

    // load preset data
    if (!options[OPTIONS.JSON_PATH]) return;
    data = Data.loadJSONData(options[OPTIONS.JSON_PATH]);
    if (!data) return;
    data = Utils.accessObjectByString(data, options[OPTIONS.DATA_PATH] || '');
    if (!data) return;
  } else {

    // check that any existing JSON file still exists
    if (options[OPTIONS.JSON_PATH]) {
      if (!Data.readFileAsText(options[OPTIONS.JSON_PATH])) {
        options[OPTIONS.JSON_PATH] = null;
      }
    }

    // wait for user response including options and json data to be used
    var response = await Gui.showWindow({
      options: options
    });

    // terminate if cancelled
    if (!response) return;

    // get updated options and json data
    options = response.options;
    data = response.data;

    // create grid
    if (options[OPTIONS.CREATE_GRID]) {
      selectedLayers = Layers.createGrid(selectedLayers, {
        rowsCount: options[OPTIONS.ROWS_COUNT],
        rowsMargin: options[OPTIONS.ROWS_MARGIN],
        columnsCount: options[OPTIONS.COLUMNS_COUNT],
        columnsMargin: options[OPTIONS.COLUMNS_MARGIN]
      });

      // make sure that grid creation was successful
      // could have failed if zero rows were requested for example
      if (!selectedLayers) return;
    }
  }

  // get root dir used when populating local images
  options.rootDir = NSString.stringWithString(options[OPTIONS.JSON_PATH]).stringByDeletingLastPathComponent();

  // save options
  (0, OPTIONS.default)(options);

  // store data used to populate the layers
  Utils.documentMetadata(context.document, 'lastUsedData', Utils.encode(data));

  // populate selected layers
  Populator.populateLayers(selectedLayers, data, options);

  // restore selected layers
  Layers.selectLayers(selectedLayers);

  context.document.reloadInspector();
};

},{"../../core/library/strings":13,"../library/context":102,"../library/data":103,"../library/gui":104,"../library/layers":106,"../library/options":107,"../library/populator":108,"../library/utils":109}],90:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _data = require('../library/data');

var Data = _interopRequireWildcard(_data);

var _gui = require('../library/gui');

var Gui = _interopRequireWildcard(_gui);

var _layers = require('../library/layers');

var Layers = _interopRequireWildcard(_layers);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

var _strings = require('../../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

var _utils = require('../library/utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Populate with Preset
 *
 * Populates the selected layers with a preset.
 */

exports.default = async function (context, populateAgain) {
  (0, _context2.default)(context);

  // get selected layers
  var selectedLayers = Layers.getSelectedLayers();
  if (!selectedLayers.length) {
    return (0, _context2.default)().document.showMessage((0, STRINGS.default)(STRINGS.SELECT_LAYERS_TO_POPULATE));
  }

  // load presets
  var presets = Data.loadPresets();
  if (!presets.length) {
    return (0, _context2.default)().document.showMessage((0, STRINGS.default)(STRINGS.NO_PRESETS_FOUND));
  }

  // get options and data
  var options = (0, OPTIONS.default)();
  options[OPTIONS.POPULATE_TYPE] = OPTIONS.POPULATE_TYPE_PRESET;
  var data = null;
  if (populateAgain) {

    // load preset data
    if (!options[OPTIONS.SELECTED_PRESET]) return;
    data = Data.loadJSONData(options[OPTIONS.SELECTED_PRESET].path);
    data = Utils.accessObjectByString(data, options[OPTIONS.DATA_PATH] || '');
    if (!data) return;
  } else {

    // wait for user response including options and json data to be used
    var response = await Gui.showWindow({
      options: options,
      presets: presets
    });

    // terminate if cancelled
    if (!response) return;

    // get updated options and json data
    options = response.options;
    data = response.data;

    // create grid
    if (options[OPTIONS.CREATE_GRID]) {
      selectedLayers = Layers.createGrid(selectedLayers, {
        rowsCount: options[OPTIONS.ROWS_COUNT],
        rowsMargin: options[OPTIONS.ROWS_MARGIN],
        columnsCount: options[OPTIONS.COLUMNS_COUNT],
        columnsMargin: options[OPTIONS.COLUMNS_MARGIN]
      });

      // make sure that grid creation was successful
      // could have failed if zero rows were requested for example
      if (!selectedLayers) return;
    }
  }

  // get root dir used when populating local images
  options.rootDir = NSString.stringWithString(options[OPTIONS.SELECTED_PRESET].path).stringByDeletingLastPathComponent();

  // save options
  (0, OPTIONS.default)(options);

  // store data used to populate the layers
  Utils.documentMetadata(context.document, 'lastUsedData', Utils.encode(data));

  // populate selected layers
  Populator.populateLayers(selectedLayers, data, options);

  // restore selected layers
  Layers.selectLayers(selectedLayers);

  context.document.reloadInspector();
};

},{"../../core/library/strings":13,"../library/context":102,"../library/data":103,"../library/gui":104,"../library/layers":106,"../library/options":107,"../library/populator":108,"../library/utils":109}],91:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _options = require('../library/options');

var Options = _interopRequireWildcard(_options);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Reset options
 *
 * Used for debugging.
 */

exports.default = function (context) {
  (0, _context2.default)(context);

  Options.remove();
};

},{"../library/context":102,"../library/options":107}],92:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _data = require('../library/data');

var Data = _interopRequireWildcard(_data);

var _strings = require('../../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (context) {
  (0, _context2.default)(context);

  // get presets dir
  var presetDir = Data.getPresetsDir();

  // open dir
  var url = NSURL.fileURLWithPath(presetDir);

  if (NSFileManager.defaultManager().fileExistsAtPath(url.path())) {
    NSWorkspace.sharedWorkspace().openURL(url);
  } else {
    (0, _context2.default)().document.showMessage((0, STRINGS.default)(STRINGS.PRESETS_LIBRARY_NOT_FOUND));
  }
}; /**
    * Reveal Presets
    *
    * Opens the presets folder.
    */

},{"../../core/library/strings":13,"../library/context":102,"../library/data":103}],93:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../library/context');

var _context2 = _interopRequireDefault(_context);

var _data = require('../library/data');

var Data = _interopRequireWildcard(_data);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

var _strings = require('../../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Set Presets Library
 *
 * Sets the location of the presets library.
 */

exports.default = function (context) {
  (0, _context2.default)(context);

  // get options and data path
  var options = (0, OPTIONS.default)();

  // ask for library location
  var newPresetsLibrary = String(Data.askForDirectory((0, STRINGS.default)(STRINGS.SET_PRESETS_LIBRARY_TITLE), (0, STRINGS.default)(STRINGS.SET_PRESETS_LIBRARY_DESCRIPTION), options[OPTIONS.PRESETS_LIBRARY_PATH]));

  // save location
  if (newPresetsLibrary) {

    // set path and save options
    options[OPTIONS.PRESETS_LIBRARY_PATH] = newPresetsLibrary;
    (0, OPTIONS.default)(options);
  }
};

},{"../../core/library/strings":13,"../library/context":102,"../library/data":103,"../library/options":107}],94:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Delete action
 */

var name = exports.name = 'delete';
var alias = exports.alias = 'd';

/**
 * Deletes the layer if the condition is true.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  if (!condition) return;

  // remove layer from parent
  layer.removeFromParent();
}

},{}],95:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Hide action
 */

var name = exports.name = 'hide';
var alias = exports.alias = 'h';

/**
 * Hides the layer if the condition is true or shows it otherwise.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  layer.setIsVisible(!condition);
}

},{}],96:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.performActions = performActions;
exports.extractActions = extractActions;
exports.parseAction = parseAction;
exports.resolveAction = resolveAction;
exports.performAction = performAction;

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _core = require('../../../core');

var Core = _interopRequireWildcard(_core);

var _show = require('./show');

var ShowAction = _interopRequireWildcard(_show);

var _hide = require('./hide');

var HideAction = _interopRequireWildcard(_hide);

var _lock = require('./lock');

var LockAction = _interopRequireWildcard(_lock);

var _unlock = require('./unlock');

var UnlockAction = _interopRequireWildcard(_unlock);

var _delete = require('./delete');

var DeleteAction = _interopRequireWildcard(_delete);

var _plugin = require('./plugin');

var PluginAction = _interopRequireWildcard(_plugin);

var _swapSymbol = require('./swapSymbol');

var SwapSymbolAction = _interopRequireWildcard(_swapSymbol);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actions = [ShowAction, HideAction, LockAction, UnlockAction, DeleteAction, PluginAction, SwapSymbolAction];

/**
 * Perform all actions on a layer.
 *
 * @param {MSLayer} layer
 * @param {Object} data
 */
/**
 * Actions library
 *
 * Provides functionality to extract, parse and execute actions.
 */

function performActions(layer, data) {

  // process conditional actions on the layer
  var actions = extractActions(layer.name());

  // perform actions
  actions.forEach(function (action) {
    performAction(action, layer, data);
  });
}

/**
 * Extracts actions from the layer name, e.g. ... #show({firstName}.length > 3)
 *
 * @param {String} string
 * @returns {Array}
 */
function extractActions(string) {

  // get individual actions
  var actionStrings = string.match(/#\w*\[([^\]]+)]/g) || [];

  // parse actions
  var extractedActions = actionStrings.map(function (actionString) {
    return parseAction(actionString);
  });

  return extractedActions;
}

/**
 * Parses the action string, #run({firstName}.length > 3, fnToRun)
 *
 * @param {String} actionString
 * @returns {Object}
 *
 * returned action: {
 *   string: {String},
 *   command: {String},
 *   condition: {
 *     string: {String},
 *     placeholders: [{
 *         string: {String},
 *         keypath: {String},
 *         filters: {Array},
 *         substitute: {String},
 *         placeholders: {Array}
 *       }]
 *   },
 *   params: [{
 *     string: {String},
 *     placeholders: {Array as for condition},
 *   }]
 * }
 */
function parseAction(actionString) {

  // keep full action string
  // used later on when executing actions
  var fullActionString = actionString;

  // get command
  var command = actionString.match(/#(\w+)/g)[0];

  // remove command from string
  actionString = actionString.substring(command.length + 1, actionString.length - 1);

  // remove # from command string
  command = command.substring(1);

  // split action string into components
  var actionComponents = actionString.split(/(?![^(]*\)),/g);

  // get condition string
  var conditionString = actionComponents[0];

  // extract placeholders in condition
  var conditionPlaceholders = Core.placeholders.extractPlaceholders(conditionString);

  // get params
  actionComponents.shift();
  var params = actionComponents.map(function (paramString) {

    // get placeholders in param
    var paramPlaceholders = Core.placeholders.extractPlaceholders(paramString);

    // return complete param object with placeholders
    return {
      string: paramString.trim(),
      placeholders: paramPlaceholders
    };
  });

  // prepare action
  var action = {
    string: fullActionString,
    command: command,
    condition: {
      string: conditionString,
      placeholders: conditionPlaceholders
    },
    params: params
  };

  return action;
}

/**
 * Resolves the placeholders in the action with the supplied data.
 *
 * @param action {Object}
 * @param data {Object}
 */
function resolveAction(action, data) {

  // copy action object
  action = Object.assign({}, action);

  // create populated condition string
  var populatedConditionString = action.condition.string;
  action.condition.placeholders.forEach(function (placeholder) {

    // populate placeholder found in the condition string
    var populatedPlaceholder = Core.placeholders.populatePlaceholder(placeholder, data, 'null');

    // replace original placeholder string
    populatedConditionString = populatedConditionString.replace(placeholder.string, populatedPlaceholder);
  });
  action.condition = populatedConditionString;

  // populate params
  var populatedParams = action.params.map(function (param) {

    // create populated param string
    var populatedParamString = param.string;
    param.placeholders.forEach(function (placeholder) {

      // populate placeholder found in the param string
      var populatedPlaceholder = Core.placeholders.populatePlaceholder(placeholder, data, 'null');

      // replace original placeholder string
      populatedParamString = populatedParamString.replace(placeholder.string, populatedPlaceholder);
    });

    return populatedParamString;
  });
  action.params = populatedParams;

  // evaluate condition
  var condition = void 0;
  try {

    // evaluate condition
    // eslint-disable-next-line no-new-func
    condition = new Function('return ' + populatedConditionString)();
  } catch (e) {

    // show error that action could not be evaluated
    (0, _context2.default)().document.showMessage('Conditional action \'' + action.string + '\' could not be evaluated.');
  }
  action.condition = condition;

  return action;
}

/**
 * Performs the supplied action with the data and layer as input.
 *
 * @param {Object} action
 * @param {MSLayer} layer
 * @param {Object} data
 */
function performAction(action, layer, data) {

  // find action function for the specified action
  var actionFunction = void 0;
  for (var i = 0; i < actions.length; i++) {
    if (actions[i].name === action.command || actions[i].alias === action.command) {
      actionFunction = actions[i].perform;
    }
  }

  // continue only if action found
  if (!actionFunction) {
    return (0, _context2.default)().document.showMessage('Conditional action \'' + action.command + '\' on layer \'' + layer.name() + '\' does not exist.');
  }

  // create populated condition string
  var populatedConditionString = action.condition.string;
  action.condition.placeholders.forEach(function (placeholder) {

    // populate placeholder found in the condition string
    var populatedPlaceholder = Core.placeholders.populatePlaceholder(placeholder, data, 'null');

    // replace original placeholder string
    populatedConditionString = populatedConditionString.replace(placeholder.string, populatedPlaceholder);
  });

  // populate params
  var populatedParams = action.params.map(function (param) {

    // create populated param string
    var populatedParamString = param.string;
    param.placeholders.forEach(function (placeholder) {

      // populate placeholder found in the param string
      var populatedPlaceholder = Core.placeholders.populatePlaceholder(placeholder, data, 'null');

      // replace original placeholder string
      populatedParamString = populatedParamString.replace(placeholder.string, populatedPlaceholder);
    });

    return populatedParamString;
  });

  // get layer name without action string
  // used within error messages
  var layerName = layer.name().replace(action.string, '').trim();
  if (!layerName.length) layerName = layer.name();

  // evaluate condition
  var condition = void 0;
  try {

    // evaluate condition
    // eslint-disable-next-line no-new-func
    condition = new Function('return ' + populatedConditionString)();
  } catch (e) {

    // show error that action could not be evaluated
    (0, _context2.default)().document.showMessage('Conditional action on layer \'' + layerName + '\' could not be evaluated.');
  }

  // perform action
  try {
    actionFunction(condition, layer, populatedParams);
  } catch (e) {

    // show error that action could not be performed
    (0, _context2.default)().document.showMessage('Conditional action on layer \'' + layerName + '\' could not be performed.');
  }
}

},{"../../../core":1,"../context":102,"./delete":94,"./hide":95,"./lock":97,"./plugin":98,"./show":99,"./swapSymbol":100,"./unlock":101}],97:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Lock action
 */

var name = exports.name = 'lock';
var alias = exports.alias = 'l';

/**
 * Locks the layer if the condition is true or unlocks it otherwise.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  layer.setIsLocked(condition);
}

},{}],98:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.alias = exports.name = undefined;
exports.perform = perform;

var _utils = require('../utils');

var Utils = _interopRequireWildcard(_utils);

var _layers = require('../layers');

var Layers = _interopRequireWildcard(_layers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Plugin action
 */

var name = exports.name = 'plugin';
var alias = exports.alias = 'p';

/**
 * Runs the specified plugin command.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {

  // only run if the condition is true
  if (!condition) return;

  // get plugin manager
  var pluginManager = NSApp.delegate().pluginManager();

  // get all plugin bundles
  var pluginBundles = pluginManager.plugins();

  // build plugin tree
  var plugins = {};
  Utils.convertToJSArray(pluginBundles.allKeys()).forEach(function (bundleIdentifier) {

    // get bundle
    var bundle = pluginBundles.objectForKey(bundleIdentifier);

    // get plugin commands
    var pluginCommands = bundle.commands();

    // build command object
    var commands = {};
    Utils.convertToJSArray(pluginCommands.allKeys()).forEach(function (commandIdentifier) {

      // get command
      var command = pluginCommands.objectForKey(commandIdentifier);

      // add command
      commands[command.name()] = command;
    });

    // add plugin with commands
    plugins[bundle.name()] = commands;
  });

  // get plugin command path
  var commandPath = params[0].split('>').map(function (component) {
    return component.trim();
  });

  // remove command path from params
  params.shift();

  // get command to perform
  var command = plugins[commandPath[0]][commandPath[1]];

  // store current layer selection
  var originalSelection = Layers.getSelectedLayers();

  // select only the passed layer
  Layers.selectLayers([layer]);

  // add params
  setCommandParamsToMetadata(layer, params);

  // run the command
  NSApp.delegate().runPluginCommand(command);

  // remove params
  removeCommandParamsFromMetadata(layer);

  // restore original selection
  Layers.selectLayers(originalSelection);
}

/**
 * Adds the provided params to the metadata of the layer. This way, the other
 * plugin can read those params.
 *
 * @param {MSLayer} layer
 * @param {Array} params
 */
function setCommandParamsToMetadata(layer, params) {

  // get layer user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  // set params
  userInfo.setValue_forKey(params, 'datapopulator');

  // set new user info
  layer.setUserInfo(userInfo);
}

/**
 * Removes command params from the layer metadata.
 *
 * @param {MSLayer} layer
 */
function removeCommandParamsFromMetadata(layer) {

  // get layer user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  // remove params
  userInfo.removeObjectForKey('datapopulator');

  // set new user info
  layer.setUserInfo(userInfo);
}

},{"../layers":106,"../utils":109}],99:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Show action
 */

var name = exports.name = 'show';
var alias = exports.alias = 's';

/**
 * Shows the layer if the condition is true or hides it otherwise.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  layer.setIsVisible(condition);
}

},{}],100:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Swap symbol action
 */

var name = exports.name = 'swapSymbol';
var alias = exports.alias = 'ss';

/**
 * Dummy function. Actual swapping is performed in Populator.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {}

},{}],101:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Unlock action
 */

var name = exports.name = 'unlock';
var alias = exports.alias = 'u';

/**
 * Unlocks the layer if the condition is true or locks it otherwise.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  layer.setIsLocked(!condition);
}

},{}],102:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (newContext) {

  // set new context
  if (newContext) {
    context = newContext;
  }

  return context;
};

/**
 * Context
 *
 * Provides a convenient way to set and get the current command context.
 */

// store context
var context = null;

// set and get context via the same function

},{}],103:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.askForJSON = askForJSON;
exports.askForDirectory = askForDirectory;
exports.readFileAsText = readFileAsText;
exports.getDefaultPresetsDir = getDefaultPresetsDir;
exports.getPresetsDir = getPresetsDir;
exports.loadPresets = loadPresets;
exports.getImageFromRemoteURL = getImageFromRemoteURL;
exports.getImageFromLocalURL = getImageFromLocalURL;
exports.getImageData = getImageData;
exports.loadJSONData = loadJSONData;

var _context = require('./context');

var _context2 = _interopRequireDefault(_context);

var _options = require('./options');

var OPTIONS = _interopRequireWildcard(_options);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Prompts user to select the JSON file and returns the path of the file.
 *
 * @param {String} path - Path to set for the file browser.
 * @returns {String}
 */
/**
 * Data
 *
 * Provides access to data import and processing functionality.
 */

function askForJSON(path) {

  // create panel
  var panel = NSOpenPanel.openPanel();

  // set panel properties
  panel.setTitle('Select JSON');
  panel.setMessage("Please select the JSON file you'd like to use.");
  panel.setPrompt('Select');
  panel.setCanCreateDirectories(false);
  panel.setCanChooseFiles(true);
  panel.setCanChooseDirectories(false);
  panel.setAllowsMultipleSelection(false);
  panel.setShowsHiddenFiles(false);
  panel.setExtensionHidden(false);
  panel.setAllowedFileTypes(['json']);

  // set initial panel path
  if (path) {
    panel.setDirectoryURL(NSURL.fileURLWithPath(path));
  } else {
    panel.setDirectoryURL(NSURL.fileURLWithPath('/Users/' + NSUserName()));
  }

  // show panel
  var pressedButton = panel.runModal();
  if (pressedButton === NSOKButton) {
    return panel.URL().path();
  }
}

/**
 * Prompts user to select a directory
 * @param {String} title
 * @param {String} message
 * @param {String} path - Path to set for the file browser.
 * @returns {String}
 */
function askForDirectory(title, message, path) {

  // create panel
  var panel = NSOpenPanel.openPanel();

  // set panel properties
  panel.setTitle(title);
  panel.setMessage(message);
  panel.setPrompt('Select');
  panel.setCanCreateDirectories(true);
  panel.setCanChooseFiles(false);
  panel.setCanChooseDirectories(true);
  panel.setAllowsMultipleSelection(false);
  panel.setShowsHiddenFiles(false);
  panel.setExtensionHidden(false);

  // set initial panel path
  if (path) {
    panel.setDirectoryURL(NSURL.fileURLWithPath(path));
  } else {
    panel.setDirectoryURL(NSURL.fileURLWithPath('/Users/' + NSUserName()));
  }

  // show panel
  var pressedButton = panel.runModal();
  if (pressedButton === NSOKButton) {
    return panel.URL().path();
  }
}

/**
 * Reads the contexts of a text based file at the provided path.
 *
 * @param {String} path
 * @returns {String}
 */
function readFileAsText(path) {

  // make sure file exists
  if (!NSFileManager.defaultManager().fileExistsAtPath_isDirectory(path, null)) return;

  return NSString.stringWithContentsOfFile_encoding_error(path, NSUTF8StringEncoding, false);
}

/**
 * Returns the default path to the presets dir.
 *
 * @returns {String}
 */
function getDefaultPresetsDir() {

  // get script path
  var scriptPath = (0, _context2.default)().scriptPath;

  // get presets dir path
  var presetsDirPath = scriptPath.stringByAppendingPathComponent('/../../../Presets/');
  presetsDirPath = presetsDirPath.stringByStandardizingPath();

  return presetsDirPath;
}

/**
 * Returns the path to the presets dir.
 *
 * @returns {String}
 */
function getPresetsDir() {

  // load path from settings
  var options = (0, OPTIONS.default)();
  var presetsLibraryPath = options[OPTIONS.PRESETS_LIBRARY_PATH];

  // if no path is set, use default
  if (!presetsLibraryPath) {
    presetsLibraryPath = getDefaultPresetsDir();
  }

  return presetsLibraryPath;
}

/**
 * Loads all presets inside the presets dir.
 *
 * @returns {Array}
 */
function loadPresets() {

  // get presets path
  var presetsPath = getPresetsDir();

  // create file enumerator for presetsPath
  var url = NSURL.fileURLWithPath(presetsPath);
  var enumerator = NSFileManager.defaultManager().enumeratorAtURL_includingPropertiesForKeys_options_errorHandler(url, [NSURLIsDirectoryKey, NSURLNameKey, NSURLPathKey], NSDirectoryEnumerationSkipsHiddenFiles, null);

  var presets = [];
  var fileUrl = enumerator.nextObject();
  while (fileUrl) {

    // make sure that file is JSON
    if (fileUrl.pathExtension().isEqualToString('json')) {

      // make sure it's a file
      var isDir = MOPointer.alloc().init();
      fileUrl.getResourceValue_forKey_error(isDir, NSURLIsDirectoryKey, null);
      if (!Number(isDir.value())) {

        // get relative path for preset
        var presetPath = fileUrl.path();
        var presetDisplayPath = presetPath.stringByReplacingOccurrencesOfString_withString(presetsPath + '/', '');

        // create preset structure
        var preset = {
          name: String(presetDisplayPath.stringByDeletingPathExtension()),
          path: String(fileUrl.path())

          // add item
        };presets.push(preset);
      }
    }

    fileUrl = enumerator.nextObject();
  }

  return presets;
}

/**
 * Downloads the image from the specified remote URL and creates an NSImage instance.
 *
 * @param {String} urlString
 * @returns {NSImage}
 */
function getImageFromRemoteURL(urlString) {

  // encode spaces
  urlString = urlString.replace(/\s/g, '%20');

  // get data from url
  var url = NSURL.URLWithString(urlString);
  var data = url.resourceDataUsingCache(false);
  if (!data) return;

  // create image from data
  var image = NSImage.alloc().initWithData(data);
  return image;
}

/**
 * Loads the image from the specified local URL and creates an NSImage instance.
 *
 * @param {String} urlString
 * @returns {NSImage}
 */
function getImageFromLocalURL(urlString) {

  // read image content from file
  var fileManager = NSFileManager.defaultManager();
  if (fileManager.fileExistsAtPath(urlString)) {
    return NSImage.alloc().initWithContentsOfFile(urlString);
  }
}

/**
 * Creates an MSImageData instance from NSImage.
 *
 * @param {NSImage} image
 * @returns {MSImageData}
 */
function getImageData(image) {
  if (!image) return;

  // create image data with image
  return MSImageData.alloc().initWithImage(image);
}

/**
 * Loads the JSON file at the specified path and parses and returns its content.
 *
 * @param {String} path
 * @returns {Object/Array}
 */
function loadJSONData(path) {

  // load contents
  var contents = readFileAsText(path);

  // get data from JSON
  var data = void 0;
  try {
    data = JSON.parse(contents);
  } catch (e) {
    (0, _context2.default)().document.showMessage("There was an error parsing data. Please make sure it's valid.");
    return;
  }

  return data;
}

},{"./context":102,"./options":107}],104:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.showWindow = showWindow;
exports.hideWindow = hideWindow;
exports.call = call;
exports.setupWindow = setupWindow;
exports.destroyWindow = destroyWindow;

var _context = require('./context');

var _context2 = _interopRequireDefault(_context);

var _MochaJSDelegate = require('../vendor/MochaJSDelegate');

var _MochaJSDelegate2 = _interopRequireDefault(_MochaJSDelegate);

var _handlers = require('./handlers');

var Handlers = _interopRequireWildcard(_handlers);

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// only exists when a window is currently shown
/**
 * Gui
 *
 * Provides functionality to create various user interface components.
 */

var pendingWindowResolve = null;
var callResolves = {};

async function showWindow(data) {

  await setupWindow();
  return new Promise(function (resolve, reject) {

    // do not open again if a window resolve is pending
    if (pendingWindowResolve) {
      return;
    }

    // get thread dictionary
    var threadDictionary = NSThread.mainThread().threadDictionary();

    // nothing to show if the window doesn't exist
    var webView = threadDictionary['com.datapopulator.sketch.ui.web'];
    if (!webView) return;

    // store reference to resolve handler to call it later when window closes
    pendingWindowResolve = resolve;

    // ask window to be shown with given data
    var windowObject = webView.windowScriptObject();
    var encodedData = Utils.encode(data);
    windowObject.evaluateWebScript('window.callHandler(\'show\', \'' + encodedData + '\')');

    // NSApp.beginSheet_modalForWindow_modalDelegate_didEndSelector_contextInfo(threadDictionary['com.datapopulator.sketch.ui.window'], Context().document.window(), null, null, null)
  });
}

function hideWindow(data) {

  var threadDictionary = NSThread.mainThread().threadDictionary();
  var webWindow = threadDictionary['com.datapopulator.sketch.ui.window'];
  if (!webWindow) return;

  NSApp.endSheet(webWindow);
  webWindow.orderOut(null);

  if (pendingWindowResolve) {
    pendingWindowResolve(data);
    pendingWindowResolve = null;
  }

  destroyWindow();
}

async function call(uiHandler, data) {

  await setupWindow();
  return new Promise(function (resolve) {

    // get thread dictionary
    var threadDictionary = NSThread.mainThread().threadDictionary();

    // nothing to show if the window doesn't exist
    var webView = threadDictionary['com.datapopulator.sketch.ui.web'];
    if (!webView) return;

    var callId = Utils.encode('' + uiHandler + Date.now());
    callResolves[callId] = resolve;

    // ask window to be shown with given data
    var windowObject = webView.windowScriptObject();
    var encodedData = Utils.encode(data);
    windowObject.evaluateWebScript('window.callHandler(\'' + uiHandler + '\', \'' + encodedData + '\', \'' + callId + '\')');
  });
}

function setupWindow() {

  coscript.setShouldKeepAround(true);

  return new Promise(function (resolve, reject) {

    // get thread dictionary
    var threadDictionary = NSThread.mainThread().threadDictionary();

    // ignore creating new window if already exists
    if (threadDictionary['com.datapopulator.sketch.ui.window']) return resolve();

    // create window
    var windowWidth = 868;
    var windowHeight = 680 + 22;
    var webWindow = NSWindow.alloc().init();
    webWindow.setFrame_display(NSMakeRect(0, 0, windowWidth, windowHeight), true);

    // keep reference to the window
    threadDictionary['com.datapopulator.sketch.ui.window'] = webWindow;

    // create web view
    var webView = WebView.alloc().initWithFrame(NSMakeRect(0, -22, windowWidth, windowHeight));
    threadDictionary['com.datapopulator.sketch.ui.web'] = webView;
    webWindow.contentView().addSubview(webView);

    // listen for webview delegate method calls
    var webViewDelegate = new _MochaJSDelegate2.default({

      'webView:didFinishLoadForFrame:': function webViewDidFinishLoadForFrame(webView, webFrame) {
        resolve();
      },

      'webView:didChangeLocationWithinPageForFrame:': function webViewDidChangeLocationWithinPageForFrame(webView, webFrame) {

        // get data from hash
        var windowObject = webView.windowScriptObject();
        var encodedResponse = windowObject.evaluateWebScript('window.location.hash').substring(1);

        // reset hash to 'waiting' to enable further communication
        if (encodedResponse === 'waiting') return;
        windowObject.evaluateWebScript('window.location.hash="waiting"');

        // get response from UI
        var response = Utils.decode(encodedResponse);

        // shows window
        if (response.handler === 'ready') {

          NSApp.beginSheet_modalForWindow_modalDelegate_didEndSelector_contextInfo(webWindow, (0, _context2.default)().document.window(), null, null, null);
        }

        // just hide window
        else if (response.handler === 'cancel') {
            hideWindow();
          }

          // confirmation
          // hides window and returns response
          else if (response.handler === 'confirm') {
              hideWindow(response.data);
            }

            // ui handler call response
            else if (response.handler === 'resolveCall') {
                var callResolve = callResolves[response.callId];

                if (callResolve) {
                  callResolve(response.data);
                  delete callResolves[response.callId];
                  destroyWindow();
                }
              }

              // forward to handlers
              else {

                  var handler = Handlers[response.handler];
                  if (handler) {
                    handler(function (uiHandler, data) {
                      var encodedData = Utils.encode(data);
                      windowObject.evaluateWebScript('window.callHandler(\'' + uiHandler + '\', \'' + encodedData + '\')');
                    }, response.data);
                  }
                }
      }
    });

    // load web UI
    webView.setFrameLoadDelegate_(webViewDelegate.getClassInstance());
    webView.setMainFrameURL_((0, _context2.default)().plugin.urlForResourceNamed('ui/index.html').path());
  });
}

function destroyWindow() {

  // get thread dictionary
  var threadDictionary = NSThread.mainThread().threadDictionary();

  // end async session
  threadDictionary['com.datapopulator.sketch.ui.window'] = null;
  threadDictionary['com.datapopulator.sketch.ui.web'] = null;
  coscript.setShouldKeepAround(false);
}

},{"../vendor/MochaJSDelegate":114,"./context":102,"./handlers":105,"./utils":109}],105:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readFile = readFile;
exports.selectJSON = selectJSON;

var _data = require('./data');

var Data = _interopRequireWildcard(_data);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function readFile(callUI, data) {

  var content = String(Data.readFileAsText(data.path));

  callUI('setData', {
    content: content,
    keepDataPath: data.keepDataPath
  });
} /**
   * Handlers
   *
   * Handlers called from the UI.
   */

function selectJSON(callUI, data) {

  var path = Data.askForJSON(data.path);
  if (!path) return;
  path = String(path);

  callUI('setJSONPath', {
    path: path
  });
}

},{"./data":103}],106:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ANY = exports.SYMBOL_MASTER = exports.SYMBOL = exports.BITMAP = exports.SHAPE = exports.TEXT = exports.GROUP = exports.ARTBOARD = exports.PAGE = undefined;
exports.findLayersInLayer = findLayersInLayer;
exports.findLayerInLayer = findLayerInLayer;
exports.findLayersInLayers = findLayersInLayers;
exports.findLayerInLayers = findLayerInLayers;
exports.findPageWithName = findPageWithName;
exports.findSymbolMasterWithName = findSymbolMasterWithName;
exports.findSymbolMasterWithId = findSymbolMasterWithId;
exports.refreshTextLayer = refreshTextLayer;
exports.getSelectedLayers = getSelectedLayers;
exports.selectLayers = selectLayers;
exports.addPage = addPage;
exports.removePage = removePage;
exports.isSymbolInstance = isSymbolInstance;
exports.isSymbolMaster = isSymbolMaster;
exports.isLayerGroup = isLayerGroup;
exports.isLayerShapeGroup = isLayerShapeGroup;
exports.isLayerBitmap = isLayerBitmap;
exports.isLayerText = isLayerText;
exports.isArtboard = isArtboard;
exports.getSymbolOverrides = getSymbolOverrides;
exports.setSymbolOverrides = setSymbolOverrides;
exports.createGrid = createGrid;

var _context = require('./context');

var _context2 = _interopRequireDefault(_context);

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Layers
 *
 * Provides functionality to get, find, check or otherwise manipulate layers.
 */

var PAGE = exports.PAGE = 'MSPage';
var ARTBOARD = exports.ARTBOARD = 'MSArtboardGroup';
var GROUP = exports.GROUP = 'MSLayerGroup';
var TEXT = exports.TEXT = 'MSTextLayer';
var SHAPE = exports.SHAPE = 'MSShapeGroup';
var BITMAP = exports.BITMAP = 'MSBitmapLayer';
var SYMBOL = exports.SYMBOL = 'MSSymbolInstance';
var SYMBOL_MASTER = exports.SYMBOL_MASTER = 'MSSymbolMaster';
var ANY = exports.ANY = null;

/**
 * Finds layers with specified name in the root layer. The name can be set to '*'
 * and exactMatch to false, in which case all layers are returned.
 *
 * @param {String} name
 * @param {Boolean} exactMatch
 * @param {String} type
 * @param {MSLayer} rootLayer
 * @param {Boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {Array}
 */
function findLayersInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude) {

  // create predicate format
  var formatRules = ['(name != NULL)'];
  var args = [];

  // name
  if (name) {
    if (exactMatch) {
      formatRules.push('(name == %@)');
    } else {
      formatRules.push('(name like %@)');
    }
    args.push(name);
  }

  // type
  if (type) {
    if (type === SHAPE) {
      formatRules.push('(className == "MSRectangleShape" OR className == "MSTriangleShape" OR className == "MSOvalShape" OR className == "MSStarShape" OR className == "MSPolygonShape" OR className == "MSShapeGroup")');
    } else {
      formatRules.push('(className == %@)');
    }
    args.push(type);
  } else {
    formatRules.push('(className == "MSLayerGroup" OR className == "MSShapeGroup" OR className == "MSArtboardGroup" OR className == "MSTextLayer" OR className == "MSRectangleShape" OR className == "MSTriangleShape" OR className == "MSOvalShape" OR className == "MSStarShape" OR className == "MSPolygonShape")');
  }

  // layers to exclude
  if (layersToExclude) {
    formatRules.push('NOT (SELF IN %@)');
    args.push(layersToExclude);
  }

  // prepare format string
  var formatString = formatRules.join(' AND ');

  // create predicate
  var predicate = NSPredicate.predicateWithFormat_argumentArray(formatString, args);

  // get layers to filter
  var layers = void 0;
  if (subLayersOnly) {
    layers = rootLayer.layers();
  } else {
    layers = rootLayer.children();
  }

  // perform query
  var queryResult = layers.filteredArrayUsingPredicate(predicate);

  // return result as js array
  return Utils.convertToJSArray(queryResult);
}

/**
 * Finds a single layer in the root layer.
 *
 * @param {String} name
 * @param {Boolean} exactMatch
 * @param {String} type
 * @param {MSLayer} rootLayer
 * @param {Boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {MSLayer}
 */
function findLayerInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude) {
  var result = findLayersInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude);

  // return first layer in result
  if (result.length) return result[0];
}

/**
 * Finds a set of layer in a set of root layers.
 *
 * @param {String} name
 * @param {Boolean} exactMatch
 * @param {String} type
 * @param {MSLayer} rootLayers
 * @param {Boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {array}
 */
function findLayersInLayers(name, exactMatch, type, rootLayers, subLayersOnly, layersToExclude) {

  var layers = [];
  rootLayers.forEach(function (rootLayer) {
    var result = findLayersInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude);
    layers = layers.concat(result);
  });

  // return all found layers
  return layers;
}

/**
 * Finds a single layer in a set of root layers.
 *
 * @param {String} name
 * @param {Boolean} exactMatch
 * @param {String} type
 * @param {MSLayer} rootLayers
 * @param {Boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {array}
 */
function findLayerInLayers(name, exactMatch, type, rootLayers, subLayersOnly, layersToExclude) {
  var result = findLayersInLayers(name, exactMatch, type, rootLayers, subLayersOnly, layersToExclude);

  // return first layer in result
  if (result.length) return result[0];
}

/**
 * Finds a page with the specified name in the current document.
 *
 * @param {String} name
 * @param {Boolean} fullMatch
 * @returns {MSPage}
 */
function findPageWithName(name, fullMatch) {

  var doc = MSDocument.currentDocument();
  var pages = Utils.jsArray(doc.pages());
  for (var i = 0; i < pages.length; i++) {
    var currentPage = pages[i];

    // if page matches name
    if (fullMatch) {
      if (currentPage.name() === name) {
        return currentPage;
      }
    } else {
      if (currentPage.name().indexOf(name) > -1) {
        return currentPage;
      }
    }
  }
}

/**
 * Finds a symbol master by name.
 *
 * @param {String} name
 * @returns {MSSymbolMaster}
 */
function findSymbolMasterWithName(name) {

  var symbolMaster = Sketch.Document.getSelectedDocument().getSymbols().filter(function (symbol) {
    return symbol.name === name;
  })[0];

  // continue looking for the symbol master in libraries
  if (!symbolMaster) {

    var libraries = Sketch.getLibraries();
    for (var i = 0; i < libraries.length; ++i) {
      var library = libraries[i];
      if (!library.valid) return;

      var symbolReference = library.getImportableSymbolReferencesForDocument((0, _context2.default)().document).filter(function (reference) {
        return reference.name === name;
      })[0];

      if (symbolReference) {
        symbolMaster = symbolReference.import();
      }
    }
  }

  return symbolMaster ? symbolMaster.sketchObject : null;
}

/**
 * Finds a symbol master by id.
 *
 * @param {String} id
 * @returns {MSSymbolMaster}
 */
function findSymbolMasterWithId(id) {

  var symbolMaster = Sketch.Document.getSelectedDocument().getSymbols().filter(function (symbol) {
    return symbol.id === id;
  })[0];

  // continue looking for the symbol master in libraries
  if (!symbolMaster) {

    var libraries = Sketch.getLibraries();
    for (var i = 0; i < libraries.length; ++i) {
      var library = libraries[i];
      if (!library.valid) return;

      var symbolReference = library.getImportableSymbolReferencesForDocument((0, _context2.default)().document).filter(function (reference) {
        return reference.id === id;
      })[0];

      if (symbolReference) {
        symbolMaster = symbolReference.import();
      }
    }
  }

  return symbolMaster ? symbolMaster.sketchObject : null;
}

/**
 * Refreshes text layer boundaries after setting text. This is used as Sketch
 * sometimes forgets to resize the text layer.
 *
 * @param layer
 */
function refreshTextLayer(layer) {
  layer.adjustFrameToFit();
  layer.select_byExtendingSelection(true, false);
  layer.setIsEditingText(true);
  layer.setIsEditingText(false);
  layer.select_byExtendingSelection(false, false);
}

/**
 * Returns the currently selected layers as a Javascript array.
 *
 * @returns {Array}
 */
function getSelectedLayers() {
  return Utils.convertToJSArray((0, _context2.default)().document.selectedLayers());
}

/**
 * Sets the current layer selection to the provided layers.
 *
 * @param {Array} layers
 */
function selectLayers(layers) {

  // deselect all layers
  var selectedLayers = getSelectedLayers();
  selectedLayers.forEach(function (layer) {
    layer.select_byExtendingSelection(false, false);
  });

  // select layers
  layers.forEach(function (layer) {
    layer.select_byExtendingSelection(true, true);
  });
}

/**
 * Adds a page with the specified name to the current document.
 *
 * @param {String} name
 * @returns {MSPage}
 */
function addPage(name) {

  // get doc
  var doc = (0, _context2.default)().document;

  // get current page
  var currentPage = doc.currentPage();

  // create new page
  var page = doc.addBlankPage();
  page.setName(name);

  // make current page active again
  doc.setCurrentPage(currentPage);

  return page;
}

/**
 * Removes the page with the specified name from the current document.
 *
 * @param {MSPage} page
 */
function removePage(page) {

  // get doc
  var doc = (0, _context2.default)().document;

  // get current page
  var currentPage = doc.currentPage();

  // remove page
  doc.removePage(page);

  // make current page active again
  doc.setCurrentPage(currentPage);
}

/**
 * Checks if the layer is a symbol instance.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
function isSymbolInstance(layer) {
  return layer.isKindOfClass(MSSymbolInstance.class());
}

/**
 * Checks if the layer is a symbol master.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
function isSymbolMaster(layer) {
  return layer.isKindOfClass(MSSymbolMaster.class());
}

/**
 * Checks if the layer is a layer group.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
function isLayerGroup(layer) {
  return layer.isKindOfClass(MSLayerGroup.class()) && !layer.isKindOfClass(MSShapeGroup.class());
}

/**
 * Checks if the layer is a shape/shape group.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
function isLayerShapeGroup(layer) {
  return layer.isKindOfClass(MSShapeGroup.class()) || layer.isKindOfClass(MSRectangleShape.class()) || layer.isKindOfClass(MSTriangleShape.class()) || layer.isKindOfClass(MSOvalShape.class()) || layer.isKindOfClass(MSStarShape.class()) || layer.isKindOfClass(MSPolygonShape.class());
}

/**
 * Checks if the layer is a bitmap layer.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
function isLayerBitmap(layer) {
  return layer.isKindOfClass(MSBitmapLayer.class());
}

/**
 * Checks if the layer is a text layer.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
function isLayerText(layer) {
  return layer.isKindOfClass(MSTextLayer.class());
}

/**
 * Checks if the layer is an artboard.
 *
 * @param {MSLayer} layer
 * @returns {Boolean}
 */
function isArtboard(layer) {
  return layer.isKindOfClass(MSArtboardGroup.class());
}

/**
 * Retrieves overrides for a symbol instance.
 *
 * @param {MSSymbolInstance} layer
 * @returns {NSDictionary}
 */
function getSymbolOverrides(layer) {
  var overrides = void 0;
  if (Utils.sketchVersion() < 44) {

    // get main overrides dictionary
    overrides = layer.overrides();
    if (!overrides) {
      overrides = NSDictionary.alloc().init();
    }

    overrides = overrides.objectForKey(NSNumber.numberWithInt(0));
  } else {

    overrides = layer.overrides();
  }
  return overrides;
}

/**
 * Sets overrides for a symbol instance.
 *
 * @param {MSSymbolInstance} layer
 * @param {NSDictionary} overrides
 */
function setSymbolOverrides(layer, overrides) {
  if (Utils.sketchVersion() < 44) {

    layer.setOverrides(NSDictionary.dictionaryWithObject_forKey(overrides, NSNumber.numberWithInt(0)));
  } else {

    layer.setOverrides(overrides);
  }
  return overrides;
}

/**
 * Creates a grid from layers.
 *
 * @param selectedLayers
 * @param opt
 * @returns {Array}
 */
function createGrid(selectedLayers, opt) {

  // check rows count
  if (!opt.rowsCount || opt.rowsCount < 0) {
    (0, _context2.default)().document.showMessage('Number of grid rows must be at least 1.');
    return;
  }

  // check rows margin
  if (!opt.rowsMargin && opt.rowsMargin !== 0) {
    (0, _context2.default)().document.showMessage('Grid row margin is invalid.');
    return;
  }

  // check column count
  if (!opt.columnsCount || opt.columnsCount < 0) {
    (0, _context2.default)().document.showMessage('Number of grid columns must be at least 1.');
    return;
  }

  // check columns margin
  if (!opt.columnsMargin && opt.columnsMargin !== 0) {
    (0, _context2.default)().document.showMessage('Grid column margin is invalid.');
    return;
  }

  // get first layer (most top left)
  var layer = selectedLayers[0];
  var smallestX = selectedLayers[0].frame().x();
  var smallestY = selectedLayers[0].frame().y();
  for (var i = 0; i < selectedLayers.length; i++) {
    var tempLayer = selectedLayers[i];
    if (tempLayer.frame().x() < smallestX || tempLayer.frame().y() < smallestY) {
      smallestX = tempLayer.frame().x();
      smallestY = tempLayer.frame().y();
      layer = tempLayer;
    }
  }

  // arrange copies of the first layer
  var layerWidth = layer.frame().width();
  var layerHeight = layer.frame().height();
  var layerParent = layer.parentGroup();
  if (!layerParent) layerParent = layer.parentArtboard();
  if (!layerParent) layerParent = layer.parentPage();

  // remove selected layers from parent
  selectedLayers.forEach(function (tempLayer) {
    tempLayer.removeFromParent();
  });

  // keep track of original position
  var startX = layer.frame().x();
  var startY = layer.frame().y();

  // store new selected layers
  var newSelectedLayers = [];

  // create rows
  for (var _i = 0; _i < opt.rowsCount; _i++) {

    // set row y
    var y = startY + _i * (layerHeight + opt.rowsMargin);

    // create columns
    for (var j = 0; j < opt.columnsCount; j++) {

      // create layer copy
      var copy = Utils.copyLayer(layer);

      // add to parent layer
      layerParent.addLayers([copy]);

      // add to selected layers
      newSelectedLayers.push(copy);

      // set column x
      var x = startX + j * (layerWidth + opt.columnsMargin);

      // position copy
      copy.frame().setX(x);
      copy.frame().setY(y);
    }
  }

  return newSelectedLayers;
}

},{"./context":102,"./utils":109}],107:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DATA_PATH = exports.HEADERS_VISIBLE = exports.HEADERS = exports.URL = exports.JSON_PATH = exports.SELECTED_PRESET = exports.PRESETS_LIBRARY_PATH = exports.POPULATE_TYPE_URL = exports.POPULATE_TYPE_JSON = exports.POPULATE_TYPE_PRESET = exports.POPULATE_TYPE = exports.COLUMNS_MARGIN = exports.COLUMNS_COUNT = exports.ROWS_MARGIN = exports.ROWS_COUNT = exports.CREATE_GRID = exports.DEFAULT_SUBSTITUTE = exports.INSERT_ELLIPSIS = exports.TRIM_TEXT = exports.RANDOMIZE_DATA = undefined;

exports.default = function (newOptions) {

  // set new options
  if (newOptions) {
    OPTIONS.forEach(function (key) {

      // save into user defaults
      if (newOptions.hasOwnProperty(key)) {
        NSUserDefaults.standardUserDefaults().setObject_forKey(JSON.stringify(newOptions[key]), 'DataPopulator_' + key);
      }
    });

    // sync defaults
    NSUserDefaults.standardUserDefaults().synchronize();
  }

  // get options
  var options = {};
  OPTIONS.map(function (key) {

    // get options from user defaults
    var option = NSUserDefaults.standardUserDefaults().objectForKey('DataPopulator_' + key);

    // convert to correct type and set
    if (option) {

      try {
        option = JSON.parse(option);
        options[key] = option;
      } catch (e) {}
    }
  });

  return options;
};

exports.remove = remove;

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// data options
var RANDOMIZE_DATA = exports.RANDOMIZE_DATA = 'randomizeData'; /**
                                                                * Options
                                                                *
                                                                * Provides functionality to get and set user options shared across the plugin.
                                                                */

var TRIM_TEXT = exports.TRIM_TEXT = 'trimText';
var INSERT_ELLIPSIS = exports.INSERT_ELLIPSIS = 'insertEllipsis';
var DEFAULT_SUBSTITUTE = exports.DEFAULT_SUBSTITUTE = 'defaultSubstitute';

// layout options
var CREATE_GRID = exports.CREATE_GRID = 'createGrid';
var ROWS_COUNT = exports.ROWS_COUNT = 'rowsCount';
var ROWS_MARGIN = exports.ROWS_MARGIN = 'rowsMargin';
var COLUMNS_COUNT = exports.COLUMNS_COUNT = 'columnsCount';
var COLUMNS_MARGIN = exports.COLUMNS_MARGIN = 'columnsMargin';

// populator options
var POPULATE_TYPE = exports.POPULATE_TYPE = 'populateType';
var POPULATE_TYPE_PRESET = exports.POPULATE_TYPE_PRESET = 'preset';
var POPULATE_TYPE_JSON = exports.POPULATE_TYPE_JSON = 'json';
var POPULATE_TYPE_URL = exports.POPULATE_TYPE_URL = 'url';
var PRESETS_LIBRARY_PATH = exports.PRESETS_LIBRARY_PATH = 'presetsLibraryPath';
var SELECTED_PRESET = exports.SELECTED_PRESET = 'selectedPreset';
var JSON_PATH = exports.JSON_PATH = 'JSONPath';
var URL = exports.URL = 'URL';
var HEADERS = exports.HEADERS = 'headers';
var HEADERS_VISIBLE = exports.HEADERS_VISIBLE = 'headersVisible';
var DATA_PATH = exports.DATA_PATH = 'dataPath';

var OPTIONS = [RANDOMIZE_DATA, TRIM_TEXT, INSERT_ELLIPSIS, DEFAULT_SUBSTITUTE, CREATE_GRID, ROWS_COUNT, ROWS_MARGIN, COLUMNS_COUNT, COLUMNS_MARGIN, POPULATE_TYPE, SELECTED_PRESET, JSON_PATH, URL, HEADERS, HEADERS_VISIBLE, PRESETS_LIBRARY_PATH, DATA_PATH];

/**
 * Gets or sets the stored options in user defaults.
 *
 * @returns {Object}
 */
function remove() {

  var keys = Utils.convertToJSArray(NSUserDefaults.standardUserDefaults().dictionaryRepresentation().allKeys()).map(function (key) {
    return String(key);
  }).filter(function (key) {
    return key.indexOf('DataPopulator') > -1;
  });

  keys.forEach(function (key) {
    NSUserDefaults.standardUserDefaults().removeObjectForKey(key);
  });

  NSUserDefaults.standardUserDefaults().synchronize();
}

},{"./utils":109}],108:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.POPULATE_TYPE = undefined;
exports.populateLayers = populateLayers;
exports.populateLayer = populateLayer;
exports.clearLayer = clearLayer;

var _core = require('../../core');

var Core = _interopRequireWildcard(_core);

var _context = require('./context');

var _context2 = _interopRequireDefault(_context);

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

var _data = require('./data');

var Data = _interopRequireWildcard(_data);

var _layers = require('./layers');

var Layers = _interopRequireWildcard(_layers);

var _actions = require('./actions');

var Actions = _interopRequireWildcard(_actions);

var _swapSymbol = require('./actions/swapSymbol');

var SwapSymbolAction = _interopRequireWildcard(_swapSymbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Populate types:
 */
/**
 * Populator
 *
 * Provides functionality to populate layers.
 */

var POPULATE_TYPE = exports.POPULATE_TYPE = {
  PRESET: 'preset',
  JSON: 'json',
  URL: 'url'

  /**
   * Populates an array of layers using the provided data array.
   *
   * @param {Array} layers
   * @param {Array} data
   * @param {Object} opt
   *
   * opt: {
   *   rootDir: {String},
   *   randomizeData: {Boolean},
   *   trimText: {Boolean},
   *   insertEllipsis: {Boolean},
   *   defaultSubstitute: {String}
   * }
   */
};function populateLayers(layers, data, opt) {

  // track used data rows
  var usedRows = [];

  // process each layer
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];

    var dataRow = Core.populator.selectDataRow(data, usedRows, opt.randomizeData);

    // populate layer
    populateLayer(layer, dataRow, {
      rootDir: opt.rootDir,
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute
    });
  }
}

/**
 * Populates a layers using the provided data.
 *
 * @param {MSLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {String},
 *   trimText: {Boolean},
 *   insertEllipsis: {Boolean},
 *   defaultSubstitute: {String}
 * }
 */
function populateLayer(layer, data, opt) {

  // populate group layer
  // artboards are also layer groups
  if (Layers.isLayerGroup(layer)) {

    // populate artboard names
    var artboardLayers = Layers.findLayersInLayer('*', false, Layers.ARTBOARD, layer, false, null);
    artboardLayers.forEach(function (artboardLayer) {
      populateArtboard(artboardLayer, data, {
        defaultSubstitute: opt.defaultSubstitute
      });
      Actions.performActions(artboardLayer, data);
    });

    // populate text layers
    var textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, layer, false, null);
    textLayers.forEach(function (textLayer) {
      populateTextLayer(textLayer, data, {
        trimText: opt.trimText,
        insertEllipsis: opt.insertEllipsis,
        defaultSubstitute: opt.defaultSubstitute
      });
      Actions.performActions(textLayer, data);
    });

    // populate images
    var imageLayers = Layers.findLayersInLayer('*', false, Layers.SHAPE, layer, false, null);
    imageLayers = imageLayers.concat(Layers.findLayersInLayer('*', false, Layers.BITMAP, layer, false, null));
    imageLayers.forEach(function (imageLayer) {
      populateImageLayer(imageLayer, data, {
        rootDir: opt.rootDir
      });
      Actions.performActions(imageLayer, data);
    });

    // populate symbols
    var symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, layer, false, null);
    symbolLayers.forEach(function (symbolLayer) {
      populateSymbolLayer(symbolLayer, data, opt);
      Actions.performActions(symbolLayer, data);
    });

    // perform actions on group
    Actions.performActions(layer, data);

    // perform actions on sub-groups
    var groupLayers = Layers.findLayersInLayer('*', false, Layers.GROUP, layer, false, null);
    groupLayers.forEach(function (groupLayer) {
      Actions.performActions(groupLayer, data);
    });
  }

  // populate text layer
  else if (Layers.isLayerText(layer)) {

      populateTextLayer(layer, data, {
        trimText: opt.trimText,
        insertEllipsis: opt.insertEllipsis,
        defaultSubstitute: opt.defaultSubstitute
      });
      Actions.performActions(layer, data);
    }

    // populate image layer
    else if (Layers.isLayerShapeGroup(layer) || Layers.isLayerBitmap(layer)) {

        // populate image placeholder
        if (layer.name().indexOf('{') > -1) {
          populateImageLayer(layer, data, {
            rootDir: opt.rootDir
          });
          Actions.performActions(layer, data);
        }
      }

      // populate symbol
      else if (Layers.isSymbolInstance(layer)) {
          populateSymbolLayer(layer, data, opt);
          Actions.performActions(layer, data);
        }
}

/**
 * Restores the original layer content and clears the metadata.
 *
 * @param {MSLayer} layer
 */
function clearLayer(layer) {

  // clear group layer
  if (Layers.isLayerGroup(layer)) {

    // clear artboard names
    var artboardLayers = Layers.findLayersInLayer('*', false, Layers.ARTBOARD, layer, false, null);
    artboardLayers.forEach(function (artboardLayer) {
      clearArtboard(artboardLayer);
    });

    // clear text layers
    var textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, layer, false, null);
    textLayers.forEach(function (textLayer) {
      clearTextLayer(textLayer);
    });

    // clear images
    var imageLayers = Layers.findLayersInLayer('{*}*', false, Layers.SHAPE, layer, false, null);
    imageLayers = imageLayers.concat(Layers.findLayersInLayer('{*}*', false, Layers.BITMAP, layer, false, null));
    imageLayers.forEach(function (imageLayer) {
      clearImageLayer(imageLayer);
    });

    // clear symbols
    var symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, layer, false, null);
    symbolLayers.forEach(function (symbolLayer) {
      clearSymbolLayer(symbolLayer);
    });
  }

  // clear text layer
  else if (Layers.isLayerText(layer)) {
      clearTextLayer(layer);
    }

    // clear image layer
    else if (Layers.isLayerShapeGroup(layer) || Layers.isLayerBitmap(layer)) {

        // populate image placeholder
        if (layer.name().indexOf('{') > -1) {
          clearImageLayer(layer);
        }
      }

      // clear symbol
      else if (Layers.isSymbolInstance(layer)) {
          clearSymbolLayer(layer);
        }
}

/**
 * Removes any Data Populator data from a layer's metadata.
 *
 * @param {MSLayer} layer
 */
function removeLayerMetadata(layer) {

  // get user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  // prepare clean user info
  var cleanUserInfo = NSMutableDictionary.alloc().init();

  // get keys
  var keys = Utils.convertToJSArray(userInfo.allKeys());

  // add values other than data populator's
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key.indexOf('datapopulator') === -1) {
      cleanUserInfo.setValue_forKey(userInfo.valueForKey(key), key);
    }
  }

  // set clean user info
  layer.setUserInfo(cleanUserInfo);
}

/**
 * Retrieves the symbol swap action if present.
 *
 * @param {MSSymbolInstance} layer
 * @param {Object} data
 * @returns {Object}
 */
function getSymbolSwapAction(layer, data) {

  return Actions.extractActions(String(layer.name())).filter(function (swapAction) {
    return swapAction.command === SwapSymbolAction.name || swapAction.command === SwapSymbolAction.alias;
  }).map(function (swapAction) {
    return Actions.resolveAction(swapAction, data);
  }).filter(function (swapAction) {
    return swapAction.condition;
  })[0];
}

/**
 * Populates a symbol instance layer.
 *
 * @param {MSSymbolInstance} layer
 * @param {Object} data
 * @param {Object} opt
 * @param {Boolean} nested
 *
 * opt: {
 *   rootDir: {String},
 *   trimText: {Boolean},
 *   insertEllipsis: {Boolean},
 *   defaultSubstitute: {String}
 * }
 */
function populateSymbolLayer(layer, data, opt, nested) {

  // get swap action on top level symbol
  if (!nested) {

    var swapAction = getSymbolSwapAction(layer, data);
    if (swapAction) {

      var symbolName = swapAction.params[0];
      var symbolToSwapWith = Layers.findSymbolMasterWithName(symbolName);
      if (symbolToSwapWith) {

        // convert to JS wrapped object and swap symbol master
        Sketch.fromNative(layer).master = symbolToSwapWith;
      }
    }
  }

  var overrides = null;
  var symbolMaster = null;

  // get overrides and symbol master
  // layer might be a symbol master if populating target symbol override
  if (Layers.isSymbolMaster(layer)) {

    overrides = NSMutableDictionary.alloc().init();
    symbolMaster = layer;
  } else {

    // get overrides
    overrides = NSMutableDictionary.dictionaryWithDictionary(Layers.getSymbolOverrides(layer) || NSDictionary.alloc().init());

    // get master for symbol instance
    symbolMaster = layer.symbolMaster();
  }

  // set root overrides in option to pass down in recursive calls
  if (!nested) {
    opt.rootOverrides = overrides;
  }
  opt.rootOverrides = opt.rootOverrides || NSMutableDictionary.alloc().init();

  // populate text layers
  var textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, symbolMaster, false, null);
  textLayers.forEach(function (textLayer) {
    populateTextLayer(textLayer, data, {
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute,
      overrides: overrides,
      rootOverrides: opt.rootOverrides
    });
  });

  // populate images
  var imageLayers = Layers.findLayersInLayer('{*}', false, Layers.SHAPE, symbolMaster, false, null);
  imageLayers = imageLayers.concat(Layers.findLayersInLayer('{*}', false, Layers.BITMAP, symbolMaster, false, null));
  imageLayers.forEach(function (imageLayer) {
    populateImageLayer(imageLayer, data, {
      rootDir: opt.rootDir,
      overrides: overrides
    });
  });

  // populate symbols
  var symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, symbolMaster, false, null);
  symbolLayers.forEach(function (symbolLayer) {

    // get swap action on symbol and the symbol to swap with
    var swapAction = getSymbolSwapAction(symbolLayer, data);
    var symbolToSwapWith = null;
    if (swapAction) {
      var _symbolName = swapAction.params[0];
      symbolToSwapWith = _symbolName === undefined ? 'None' : Layers.findSymbolMasterWithName(_symbolName);
    }

    // swap nested symbol
    // swap action always takes priority
    if (symbolToSwapWith) {

      // get symbol id
      var idOfSymbolToSwapWith = symbolToSwapWith === 'None' ? '' : symbolToSwapWith.symbolID();

      // prepare nested root overrides
      var nestedRootOverrides = opt.rootOverrides.valueForKey(symbolLayer.objectID());
      if (!nestedRootOverrides) {
        nestedRootOverrides = NSMutableDictionary.alloc().init();
      }
      var nestedOpt = Object.assign({}, opt);
      nestedOpt.rootOverrides = nestedRootOverrides;

      // get nested overrides
      var nestedOverrides = symbolToSwapWith !== 'None' ? populateSymbolLayer(symbolToSwapWith, data, nestedOpt, true) : nestedRootOverrides;

      nestedOverrides.setValue_forKey(idOfSymbolToSwapWith, 'symbolID');
      overrides.setValue_forKey(nestedOverrides, symbolLayer.objectID());
    } else {

      // resolve nested symbol override
      if (opt.rootOverrides.valueForKey(symbolLayer.objectID()) && opt.rootOverrides.valueForKey(symbolLayer.objectID()).valueForKey('symbolID')) {

        // get overridden symbol ID
        var symbolID = String(opt.rootOverrides.valueForKey(symbolLayer.objectID()).valueForKey('symbolID'));

        // hide symbol
        if (!symbolID || !symbolID.length) {

          // get existing nested overrides
          var existingNestedOverrides = overrides.valueForKey(symbolLayer.objectID());
          if (!existingNestedOverrides) {
            existingNestedOverrides = NSDictionary.alloc().init();
          }
          var _nestedOverrides = NSMutableDictionary.dictionaryWithDictionary(existingNestedOverrides);

          // set empty symbol override
          // no need to keep populating recursively
          _nestedOverrides.setValue_forKey('', 'symbolID');
          overrides.setValue_forKey(_nestedOverrides, symbolLayer.objectID());
        } else {

          var overriddenSymbolLayer = Layers.findSymbolMasterWithId(symbolID);

          // prepare nested root overrides
          var _nestedRootOverrides = opt.rootOverrides.valueForKey(symbolLayer.objectID());
          if (!_nestedRootOverrides) {
            _nestedRootOverrides = NSMutableDictionary.alloc().init();
          }
          var _nestedOpt = Object.assign({}, opt);
          _nestedOpt.rootOverrides = _nestedRootOverrides;

          // get nested overrides
          var _nestedOverrides2 = populateSymbolLayer(overriddenSymbolLayer, data, _nestedOpt, true);
          _nestedOverrides2.setValue_forKey(symbolID, 'symbolID');

          // keep overrides if not overwritten
          Object.keys(_nestedRootOverrides).forEach(function (key) {
            if (!_nestedOverrides2.objectForKey(key)) {
              _nestedOverrides2.setObject_forKey(_nestedRootOverrides.objectForKey(key), key);
            }
          });

          overrides.setValue_forKey(_nestedOverrides2, symbolLayer.objectID());
        }
      }

      // nested symbol is not overridden
      else {

          // prepare nested root overrides
          var _nestedRootOverrides2 = opt.rootOverrides.valueForKey(symbolLayer.objectID());
          if (!_nestedRootOverrides2) {
            _nestedRootOverrides2 = NSMutableDictionary.alloc().init();
          }
          var _nestedOpt2 = Object.assign({}, opt);
          _nestedOpt2.rootOverrides = _nestedRootOverrides2;

          // get nested overrides
          var _nestedOverrides3 = populateSymbolLayer(symbolLayer, data, _nestedOpt2, true);

          // keep overrides if not overwritten
          Object.keys(_nestedRootOverrides2).forEach(function (key) {
            if (!_nestedOverrides3.objectForKey(key)) {
              _nestedOverrides3.setObject_forKey(_nestedRootOverrides2.objectForKey(key), key);
            }
          });

          overrides.setValue_forKey(_nestedOverrides3, symbolLayer.objectID());
        }
    }
  });

  // set new overrides
  if (!nested) Layers.setSymbolOverrides(layer, overrides);

  // return overrides
  return overrides;
}

/**
 * Clears the symbol layer.
 *
 * @param {MSSymbolInstance} layer
 */
function clearSymbolLayer(layer) {

  // get existing overrides
  var existingOverrides = Layers.getSymbolOverrides(layer);
  if (!existingOverrides) return;

  // clear overrides except for symbol overrides
  var clearedOverrides = clearOverrides(existingOverrides);

  // remove metadata
  removeLayerMetadata(layer);

  // set cleared overrides
  Layers.setSymbolOverrides(layer, clearedOverrides);
}

/**
 * Removes all 'content' data from overrides, keeping only symbol overrides.
 *
 * @param {NSDictionary} overrides
 * @returns {NSDictionary}
 */
function clearOverrides(overrides) {

  // create mutable overrides
  overrides = NSMutableDictionary.dictionaryWithDictionary(overrides);

  // filter dictionary
  var keys = overrides.allKeys();
  keys.forEach(function (key) {

    var value = overrides.objectForKey(key);
    if (value.isKindOfClass(NSDictionary.class())) {

      value = clearOverrides(value);
      if (value.allKeys().count() > 0) {
        overrides.setValue_forKey(value, key);
      } else {
        overrides.removeObjectForKey(key);
      }
    } else {

      if (key !== 'symbolID' && String(key).indexOf('-original') === -1) {
        overrides.removeObjectForKey(key);
      }
    }
  });

  // restore original overrides
  keys = overrides.allKeys();
  keys.forEach(function (key) {

    if (String(key).indexOf('-original') > -1) {
      var value = overrides.objectForKey(key);
      overrides.removeObjectForKey(key);
      overrides.setValue_forKey(value, String(key).replace('-original', ''));
    }
  });

  return overrides;
}

/**
 * Populates a text layer.
 *
 * @param {MSTextLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   trimText: {Boolean},
 *   insertEllipsis: {Boolean},
 *   defaultSubstitute: {String}
 *   overrides: {NSMutableDictionary}
 * }
 */
function populateTextLayer(layer, data, opt) {

  // check if layer is in symbol
  var inSymbol = !!opt.overrides;

  // get original text
  var originalText = getOriginalText(layer, inSymbol);

  // set original text
  // set even if inside symbol so that if taken out of symbol, it can be repopulated
  setOriginalText(layer, originalText);

  // extract placeholders from layer name
  var namePlaceholders = Core.placeholders.extractPlaceholders(layer.name());

  // extract args
  var args = Core.args.extractArgs(layer.name(), [{
    name: 'lines',
    alias: 'l',
    type: Number
  }]);

  // populate with placeholder in layer name
  var populatedString = void 0;
  if (namePlaceholders.length) {

    // populate first placeholder
    populatedString = Core.placeholders.populatePlaceholder(namePlaceholders[0], data, opt.defaultSubstitute);
  }

  // populate based on content of text layer
  else {

      // extract placeholders from original text
      var placeholders = Core.placeholders.extractPlaceholders(originalText);
      if (placeholders.length) {

        // create populated string, starting with the original text and gradually replacing placeholders
        populatedString = originalText;
        placeholders.forEach(function (placeholder) {

          // populate placeholder found in the original text
          var populatedPlaceholder = Core.placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute);

          // replace original placeholder string (e.g. {firstName}) with populated placeholder string
          populatedString = populatedString.replace(placeholder.string, populatedPlaceholder);
        });
      }

      // populate placeholders in override
      else if (inSymbol) {

          var layerId = String(layer.objectID());

          // extract placeholders from original override or the current override if no original
          var override = opt.overrides.valueForKey(layerId);
          var rootOverride = opt.rootOverrides.valueForKey(layerId);
          var hasRootOverride = !!rootOverride;
          var originalOverride = (hasRootOverride ? opt.rootOverrides : opt.overrides).valueForKey(layerId + '-original');

          originalText = originalOverride || (hasRootOverride ? rootOverride : override);
          var _placeholders = Core.placeholders.extractPlaceholders(originalText);

          // create populated string, starting with the original text and gradually replacing placeholders
          populatedString = originalText;
          _placeholders.forEach(function (placeholder) {

            // populate placeholder found in the original text
            var populatedPlaceholder = Core.placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute);

            // replace original placeholder string (e.g. {firstName}) with populated placeholder string
            populatedString = populatedString.replace(placeholder.string, populatedPlaceholder);
          });

          // set original override
          var targetOverrides = hasRootOverride ? opt.rootOverrides : opt.overrides;
          targetOverrides.setValue_forKey(originalText, layerId + '-original');
        }
    }

  // check if the populated string is different from original text
  // this prevents needlessly setting text and affecting text layers that don't contain placeholders
  if (populatedString === originalText) return;

  // trim text, taking into account the lines arg if available
  if (layer.textBehaviour() === 1 && opt.trimText) {
    populatedString = getTrimmedText(layer, populatedString, opt.insertEllipsis, args.lines);
  }

  // set populated string as an override for text layer within a symbol
  if (inSymbol) {

    // make text invisible by setting it to a space
    if (!populatedString.length) {
      populatedString = ' ';
    }

    // get id of text layer
    var _layerId = layer.objectID();

    // add override for layer
    opt.overrides.setValue_forKey(populatedString, _layerId);
  }

  // set populated string for normal text layer
  else {

      // hide text layer if populated string is empty
      if (!populatedString.length) {
        populatedString = '-';
        layer.setIsVisible(false);
      } else {
        layer.setIsVisible(true);
      }

      // get current font
      var font = layer.font();

      // set text layer text
      layer.setStringValue(populatedString);

      // set current font back
      layer.setFont(font);

      // resize text layer to fit text
      Layers.refreshTextLayer(layer);
    }
}

/**
 * Clears the text layer.
 *
 * @param {MSTextLayer} layer
 */
function clearTextLayer(layer) {

  // get original text
  var originalText = getOriginalText(layer);

  // check if there is original text stored for the layer
  if (originalText) {

    // set original text
    layer.setStringValue(originalText);

    // refresh and resize
    Layers.refreshTextLayer(layer);
  }

  // clear any data populator metadata
  removeLayerMetadata(layer);
}

/**
 * Gets the original text with placeholders for the layer.
 *
 * @param {MSTextLayer/MSArtboardGroup} layer
 * @returns {String}
 */
function getOriginalText(layer, ignoreMetadata) {

  // get data dictionary
  var dataDict = getDataDictionary(layer);

  // get text stored in layer metadata
  // LEGACY: check old 'textWithPlaceholders' key
  var text = dataDict.valueForKey('textWithPlaceholders');
  if (!text) text = dataDict.valueForKey('originalText');

  // set original text if it doesn't exist
  if (ignoreMetadata || !text || !text.length) {

    // get text from text layer
    if (Layers.isLayerText(layer)) {
      text = String(layer.stringValue());
    }

    // get name of artboard
    else if (Layers.isArtboard(layer)) {
        text = String(layer.name());
      }
  }

  return text;
}

/**
 * Sets the original text as metadata on the layer.
 *
 * @param {MSLayer} layer
 * @param {String} text
 */
function setOriginalText(layer, text) {

  // get data dictionary
  var dataDict = getDataDictionary(layer);

  // save new text as the original text in metadata
  dataDict.setValue_forKey(text, 'originalText');

  // LEGACY: remove any old values stored in the dictionary
  dataDict.removeObjectForKey('textWithPlaceholders');

  // set new data dictionary
  setDataDictionary(layer, dataDict);
}

/**
 * Retrieves the data dictionary from layer's userInfo.
 *
 * @param {MSLayer} layer
 * @returns {NSMutableDictionary}
 */
function getDataDictionary(layer) {

  // get user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  // get plugin data dictionary
  var dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulator');

  // LEGACY: get values for old versions of data populator
  if (!dataDict) dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulator2');
  if (!dataDict) dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulatorBETA');

  // get mutable dictionary from dictionary
  dataDict = NSMutableDictionary.dictionaryWithDictionary(dataDict);

  return dataDict;
}

/**
 * Sets a new data dictionary in userInfo of the layer.
 *
 * @param {MSLayer} layer
 * @param {NSMutableDictionary} dataDict
 */
function setDataDictionary(layer, dataDict) {

  // get user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  // LEGACY: filter out any data from old data populator versions
  var newUserInfo = NSMutableDictionary.alloc().init();
  var keys = Utils.convertToJSArray(userInfo.allKeys());
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key.indexOf('datapopulator') === -1) {
      newUserInfo.setValue_forKey(userInfo.valueForKey(key), key);
    }
  }
  userInfo = newUserInfo;

  // set data dictionary
  userInfo.setValue_forKey(dataDict, 'com.precious-forever.sketch.datapopulator');

  // set new user info
  layer.setUserInfo(userInfo);
}

/**
 * Trims the text to fit in the specified number of lines in the text layer.
 *
 * @param {MSTextLayer} layer
 * @param {String} text
 * @param {Boolean} insertEllipsis
 * @param {int} lines
 * @returns {String}
 */
function getTrimmedText(layer, text, insertEllipsis, lines) {

  // trim to one line by default
  if (!lines || lines < 1) lines = 1;

  // create a copy of the layer to prevent changing the actual layer
  layer = Utils.copyLayer(layer);

  // set text to a single character to get height of one line
  layer.setStringValue('-');

  // resize text layer to fit text
  Layers.refreshTextLayer(layer);

  // get original text layer height
  var lineHeight = layer.frame().height();

  // set actual text
  layer.setStringValue(text);

  // resize to fit and get new height
  Layers.refreshTextLayer(layer);
  var actualHeight = layer.frame().height();

  // shorten text to fit
  while (actualHeight > lineHeight * lines) {

    // trim last character
    if (insertEllipsis) {
      text = text.substring(0, text.length - 2) + '…';
    } else {
      text = text.substring(0, text.length - 1);
    }

    // set trimmed text and re-evaluate height
    layer.setStringValue(text);
    Layers.refreshTextLayer(layer);
    actualHeight = layer.frame().height();
  }

  return text;
}

/**
 * Populates an image layer.
 *
 * @param {MSShapeGroup/MSBitmapLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {String},
 *   overrides: {NSMutableDictionary}
 * }
 */
function populateImageLayer(layer, data, opt) {

  // check if layer is in symbol
  var inSymbol = !!opt.overrides;

  // extract image placeholder from layer name
  var imagePlaceholder = Core.placeholders.extractPlaceholders(layer.name())[0];
  if (!imagePlaceholder) return;

  // get url by populating the placeholder
  var imageUrl = Core.placeholders.populatePlaceholder(imagePlaceholder, data, '');

  // get image data
  var imageData = void 0;
  if (imageUrl) {
    imageData = getImageData(imageUrl, opt.rootDir);
    if (!imageData) {
      return (0, _context2.default)().document.showMessage('Some images could not be loaded. Please check the URLs.');
    }
  }

  // get layer fill
  var fill = layer.style().fills().firstObject();
  if (!fill) {

    // create new fill
    fill = layer.style().addStylePartOfType(0);
  }

  // set fill properties
  fill.setFillType(4);
  fill.setPatternFillType(1);

  // set image as an override for image layer within a symbol
  if (inSymbol) {

    // get id of image layer
    var layerId = layer.objectID();

    // add override for layer
    if (imageData) {
      opt.overrides.setValue_forKey(imageData, layerId);
    } else {
      opt.overrides.setValue_forKey(getImagePlaceholder(layer), layerId);
    }
  }

  // set image for normal image layer
  else {

      // enable fill
      fill.setIsEnabled(true);

      // set image as fill
      if (imageData) {
        fill.setImage(imageData);
      } else {

        // set default placeholder
        fill.setImage(getImagePlaceholder(layer));
      }
    }
}

/**
 * Clears the image layer.
 *
 * @param {MSShapeGroup/MSBitmapLayer} layer
 */
function clearImageLayer(layer) {

  // get layer fill
  var fill = layer.style().fills().firstObject();
  if (!fill) {
    fill = layer.style().addStylePartOfType(0);
  }
  fill.setFillType(4);
  fill.setPatternFillType(1);

  // set placeholder
  var imageData = getImagePlaceholder(layer);
  fill.setImage(imageData);

  // remove metadata
  removeLayerMetadata(layer);
}

/**
 * Creates image data representing the default image placeholder.
 *
 * @param {MSLayer} layer
 * @return {MSImageData}
 */
function getImagePlaceholder(layer) {

  // get resources path
  var scriptPath = (0, _context2.default)().scriptPath;
  var rootDir = scriptPath.stringByAppendingPathComponent('/../../Resources/').stringByStandardizingPath();

  // select placeholder size
  var placeholderImageFile = 'imagePlaceholder_';
  var maxDimension = Math.max(layer.frame().width(), layer.frame().height());
  if (maxDimension <= 220) {
    placeholderImageFile += 'small';
  } else if (maxDimension <= 416) {
    placeholderImageFile += 'medium';
  } else {
    placeholderImageFile += 'large';
  }

  return getImageData(placeholderImageFile + '.png', rootDir);
}

/**
 * Gets image data from image url. Image can be remote or local.
 *
 * @param {String} imageUrl
 * @param {String} rootDir
 * @returns {MSImageData}
 */
function getImageData(imageUrl, rootDir) {

  // check if url is local or remote
  var image = void 0;
  if (/(http)[s]?:\/\//g.test(imageUrl)) {

    // download image from url
    image = Data.getImageFromRemoteURL(imageUrl);
  } else {

    // remove first slash
    if (imageUrl[0] === '/') imageUrl = imageUrl.substring(1);

    // build full image url by adding the root dir
    imageUrl = NSString.stringWithString(rootDir).stringByAppendingPathComponent(imageUrl);

    // load image from filesystem
    image = Data.getImageFromLocalURL(imageUrl);
  }

  // create image data from NSImage
  return Data.getImageData(image);
}

/**
 * Populates an artboard name.
 *
 * @param {MSArtboard} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   defaultSubstitute {String}
 * }
 */
function populateArtboard(layer, data, opt) {

  // get original text
  var originalText = getOriginalText(layer);

  // set original text
  setOriginalText(layer, originalText);

  // extract placeholders from original artboard name
  var placeholders = Core.placeholders.extractPlaceholders(originalText);

  // create populated string, starting with the original text and gradually replacing placeholders
  var populatedString = originalText;
  placeholders.forEach(function (placeholder) {

    // populate placeholder found in the original text
    var populatedPlaceholder = Core.placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute);

    // replace original placeholder string (e.g. {firstName}) with populated placeholder string
    populatedString = populatedString.replace(placeholder.string, populatedPlaceholder);
  });

  // set artboard name
  layer.setName(populatedString);
}

/**
 * Clears the artboard layer.
 *
 * @param {MSArtboardGroup} layer
 */
function clearArtboard(layer) {

  // get original text
  var originalText = getOriginalText(layer);

  // check if there is original text stored for the layer
  if (originalText) {

    // set artboard name
    layer.setName(originalText);
  }

  // clear any data populator metadata
  removeLayerMetadata(layer);
}

},{"../../core":1,"./actions":96,"./actions/swapSymbol":100,"./context":102,"./data":103,"./layers":106,"./utils":109}],109:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sketchVersion = sketchVersion;
exports.convertToJSArray = convertToJSArray;
exports.copyLayer = copyLayer;
exports.encode = encode;
exports.decode = decode;
exports.documentMetadata = documentMetadata;
exports.accessObjectByString = accessObjectByString;

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _utf = require('utf8');

var _utf2 = _interopRequireDefault(_utf);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
  * Gets the Sketch version.
  *
  * @returns {Number}
  */
/**
 * Utils
 *
 * Provides utility and miscellaneous functionality.
 */

function sketchVersion() {
  var sketchVersion = NSBundle.mainBundle().objectForInfoDictionaryKey('CFBundleShortVersionString');
  return Number(sketchVersion);
}

/**
 * Converts the native Objective-C array to a Javascript Array.
 *
 * @param {NSArray} nativeArray
 * @returns {Array}
 */
function convertToJSArray(nativeArray) {

  if (nativeArray.class() === MSLayerArray) {
    nativeArray = nativeArray.layers();
  }
  var length = nativeArray.count();
  var jsArray = [];

  while (jsArray.length < length) {
    jsArray.push(nativeArray.objectAtIndex(jsArray.length));
  }
  return jsArray;
}

/**
 * Creates a copy of the provided layer.
 *
 * @param {MSLayer} layer
 * @returns {MSLayer}
 */
function copyLayer(layer) {

  // create duplicate
  var layerCopy = layer.duplicate();

  // remove duplicate from parent
  layerCopy.removeFromParent();

  return layerCopy;
}

/**
 * Encodes data encoded with base64 and utf8 encodings.
 *
 * @param {Any} data
 * @return {String}
 */
function encode(data) {

  var dataText = JSON.stringify(data);
  var dataBytes = _utf2.default.encode(dataText);
  var encodedData = _base2.default.encode(dataBytes);

  return encodedData;
}

/**
 * Decodes data encoded with base64 and utf8 encodings.
 *
 * @param {String} encodedData
 * @return {Any}
 */
function decode(encodedData) {

  var dataBytes = _base2.default.decode(encodedData);
  var dataText = _utf2.default.decode(dataBytes);
  var data = null;
  try {
    data = JSON.parse(dataText);
  } catch (e) {}

  return data;
}

/**
 * Set or get metadata stored in a specific document.
 *
 * @param {MSDocument} doc
 * @param {String} key
 * @param {String} newValue
 * @return {String}
 */
function documentMetadata(doc, key, newValue) {

  var documentData = doc.documentData();

  // get user info dictionary
  if (!documentData.userInfo()) {
    documentData.setUserInfo(NSMutableDictionary.alloc().init());
  }
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(documentData.userInfo());

  // get metadata for data populator
  if (!userInfo.valueForKey('com.datapopulator.sketch')) {
    userInfo.setValue_forKey(NSMutableDictionary.alloc().init(), 'com.datapopulator.sketch');
  }
  var data = userInfo.valueForKey('com.datapopulator.sketch');

  // set new value
  if (newValue) {
    data.setValue_forKey(newValue, key);
    documentData.setUserInfo(userInfo);
  }

  return data.valueForKey(key);
}

/**
 * Get nested object by string.
 *
 * @param {Object/Array} object
 * @param {String} string
 * @return {Object/Array}
 */
function accessObjectByString(object, string) {
  var newObject = JSON.parse(JSON.stringify(object));
  if (string && string.length) {
    string = string.replace(/\[(\w+)\]/g, '.$1'); // convert indices to properties e.g [0] => .0
    string = string.replace(/^\./, ''); // strip leading dot

    var splitString = string.split('.');
    for (var i = 0; i < splitString.length; i++) {
      var key = splitString[i];
      newObject = newObject[key];
    }
  }

  return newObject;
}

},{"base-64":110,"utf8":112}],110:[function(require,module,exports){
(function (global){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! http://mths.be/base64 v0.1.0 by @mathias | MIT license */
;(function (root) {

	// Detect free variables `exports`.
	var freeExports = (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = (typeof module === 'undefined' ? 'undefined' : _typeof(module)) == 'object' && module && module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code, and use
	// it as `root`.
	var freeGlobal = (typeof global === 'undefined' ? 'undefined' : _typeof(global)) == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var InvalidCharacterError = function InvalidCharacterError(message) {
		this.message = message;
	};
	InvalidCharacterError.prototype = new Error();
	InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	var error = function error(message) {
		// Note: the error messages used throughout this file match those used by
		// the native `atob`/`btoa` implementation in Chromium.
		throw new InvalidCharacterError(message);
	};

	var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	// http://whatwg.org/html/common-microsyntaxes.html#space-character
	var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

	// `decode` is designed to be fully compatible with `atob` as described in the
	// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
	// The optimized base64-decoding algorithm used is based on @atk’s excellent
	// implementation. https://gist.github.com/atk/1020396
	var decode = function decode(input) {
		input = String(input).replace(REGEX_SPACE_CHARACTERS, '');
		var length = input.length;
		if (length % 4 == 0) {
			input = input.replace(/==?$/, '');
			length = input.length;
		}
		if (length % 4 == 1 ||
		// http://whatwg.org/C#alphanumeric-ascii-characters
		/[^+a-zA-Z0-9/]/.test(input)) {
			error('Invalid character: the string to be decoded is not correctly encoded.');
		}
		var bitCounter = 0;
		var bitStorage;
		var buffer;
		var output = '';
		var position = -1;
		while (++position < length) {
			buffer = TABLE.indexOf(input.charAt(position));
			bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
			// Unless this is the first of a group of 4 characters…
			if (bitCounter++ % 4) {
				// …convert the first 8 bits to a single ASCII character.
				output += String.fromCharCode(0xFF & bitStorage >> (-2 * bitCounter & 6));
			}
		}
		return output;
	};

	// `encode` is designed to be fully compatible with `btoa` as described in the
	// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
	var encode = function encode(input) {
		input = String(input);
		if (/[^\0-\xFF]/.test(input)) {
			// Note: no need to special-case astral symbols here, as surrogates are
			// matched, and the input is supposed to only contain ASCII anyway.
			error('The string to be encoded contains characters outside of the ' + 'Latin1 range.');
		}
		var padding = input.length % 3;
		var output = '';
		var position = -1;
		var a;
		var b;
		var c;
		var d;
		var buffer;
		// Make sure any padding is handled outside of the loop.
		var length = input.length - padding;

		while (++position < length) {
			// Read three bytes, i.e. 24 bits.
			a = input.charCodeAt(position) << 16;
			b = input.charCodeAt(++position) << 8;
			c = input.charCodeAt(++position);
			buffer = a + b + c;
			// Turn the 24 bits into four chunks of 6 bits each, and append the
			// matching character for each of them to the output.
			output += TABLE.charAt(buffer >> 18 & 0x3F) + TABLE.charAt(buffer >> 12 & 0x3F) + TABLE.charAt(buffer >> 6 & 0x3F) + TABLE.charAt(buffer & 0x3F);
		}

		if (padding == 2) {
			a = input.charCodeAt(position) << 8;
			b = input.charCodeAt(++position);
			buffer = a + b;
			output += TABLE.charAt(buffer >> 10) + TABLE.charAt(buffer >> 4 & 0x3F) + TABLE.charAt(buffer << 2 & 0x3F) + '=';
		} else if (padding == 1) {
			buffer = input.charCodeAt(position);
			output += TABLE.charAt(buffer >> 2) + TABLE.charAt(buffer << 4 & 0x3F) + '==';
		}

		return output;
	};

	var base64 = {
		'encode': encode,
		'decode': decode,
		'version': '0.1.0'
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (typeof define == 'function' && _typeof(define.amd) == 'object' && define.amd) {
		define(function () {
			return base64;
		});
	} else if (freeExports && !freeExports.nodeType) {
		if (freeModule) {
			// in Node.js or RingoJS v0.8.0+
			freeModule.exports = base64;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (var key in base64) {
				base64.hasOwnProperty(key) && (freeExports[key] = base64[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.base64 = base64;
	}
})(undefined);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],111:[function(require,module,exports){
'use strict';

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout() {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
})();
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch (e) {
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }
}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e) {
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }
}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while (len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
    return [];
};

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () {
    return '/';
};
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function () {
    return 0;
};

},{}],112:[function(require,module,exports){
'use strict';

/*! https://mths.be/utf8js v3.0.0 by @mathias */
;(function (root) {

	var stringFromCharCode = String.fromCharCode;

	// Taken from https://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) {
					// low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	function checkScalarValue(codePoint) {
		if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
			throw Error('Lone surrogate U+' + codePoint.toString(16).toUpperCase() + ' is not a scalar value');
		}
	}
	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(codePoint >> shift & 0x3F | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) {
			// 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) {
			// 2-byte sequence
			symbol = stringFromCharCode(codePoint >> 6 & 0x1F | 0xC0);
		} else if ((codePoint & 0xFFFF0000) == 0) {
			// 3-byte sequence
			checkScalarValue(codePoint);
			symbol = stringFromCharCode(codePoint >> 12 & 0x0F | 0xE0);
			symbol += createByte(codePoint, 6);
		} else if ((codePoint & 0xFFE00000) == 0) {
			// 4-byte sequence
			symbol = stringFromCharCode(codePoint >> 18 & 0x07 | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode(codePoint & 0x3F | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			byte2 = readContinuationByte();
			codePoint = (byte1 & 0x1F) << 6 | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = (byte1 & 0x0F) << 12 | byte2 << 6 | byte3;
			if (codePoint >= 0x0800) {
				checkScalarValue(codePoint);
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = (byte1 & 0x07) << 0x12 | byte2 << 0x0C | byte3 << 0x06 | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	root.version = '3.0.0';
	root.encode = utf8encode;
	root.decode = utf8decode;
})(typeof exports === 'undefined' ? undefined.utf8 = {} : exports);

},{}],113:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HKSketchFusionExtension = undefined;

var _strings = require('../core/library/strings');

var STRINGS = _interopRequireWildcard(_strings);

var _commands = require('./commands');

var commands = _interopRequireWildcard(_commands);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Plugin
 *
 * Defines the plugin structure and metadata.
 */

var HKSketchFusionExtension = exports.HKSketchFusionExtension = {
  name: (0, STRINGS.default)(STRINGS.DATA_POPULATOR_TITLE),
  bundleName: (0, STRINGS.default)(STRINGS.DATA_POPULATOR_TITLE),
  description: (0, STRINGS.default)(STRINGS.DATA_POPULATOR_DESCRIPTION),
  author: 'precious design studio',
  authorEmail: 'feedback@datapopulator.com',
  version: '3.0.3',
  identifier: 'com.datapopulator.sketch',
  compatibleVersion: '52',
  icon: 'icon.png',
  appcast: 'https://raw.githubusercontent.com/preciousforever/data-populator/master/appcast.xml',
  menu: {
    'isRoot': false,
    'items': ['populateWithPreset', 'populateWithJson', 'populateFromUrl', 'populateAgain', 'lastUsedData', 'clearLayers', '-', 'revealPresets', 'setPresetsLibrary', '-', 'needHelp',

    // debug only
    '-', 'resetOptions']
  },
  commands: {
    populateWithPreset: {
      name: (0, STRINGS.default)(STRINGS.POPULATE_WITH_PRESET_TITLE),
      shortcut: '',
      description: (0, STRINGS.default)(STRINGS.POPULATE_WITH_PRESET_DESCRIPTION),
      icon: '../Resources/populateWithPreset.png',
      run: commands.populateWithPreset
    },
    populateWithJson: {
      name: (0, STRINGS.default)(STRINGS.POPULATE_WITH_JSON_TITLE),
      shortcut: '',
      description: (0, STRINGS.default)(STRINGS.POPULATE_WITH_JSON_DESCRIPTION),
      icon: '../Resources/populateWithJSON.png',
      run: commands.populateWithJSON
    },
    populateFromUrl: {
      name: (0, STRINGS.default)(STRINGS.POPULATE_FROM_URL_TITLE),
      shortcut: '',
      description: (0, STRINGS.default)(STRINGS.POPULATE_FROM_URL_DESCRIPTION),
      icon: '../Resources/populateFromURL.png',
      run: commands.populateFromURL
    },
    populateAgain: {
      name: (0, STRINGS.default)(STRINGS.POPULATE_AGAIN_TITLE),
      shortcut: 'cmd shift x',
      description: (0, STRINGS.default)(STRINGS.POPULATE_AGAIN_DESCRIPTION),
      icon: '../Resources/populateAgain.png',
      run: commands.populateAgain
    },
    lastUsedData: {
      name: (0, STRINGS.default)(STRINGS.LAST_USED_DATA_TITLE),
      shortcut: '',
      description: (0, STRINGS.default)(STRINGS.LAST_USED_DATA_DESCRIPTION),
      icon: '../Resources/lastUsedData.png',
      run: commands.lastUsedData
    },
    clearLayers: {
      name: (0, STRINGS.default)(STRINGS.CLEAR_LAYERS_TITLE),
      shortcut: '',
      description: (0, STRINGS.default)(STRINGS.CLEAR_LAYERS_DESCRIPTION),
      icon: '../Resources/clearLayers.png',
      run: commands.clearLayers
    },
    revealPresets: {
      name: (0, STRINGS.default)(STRINGS.REVEAL_PRESETS_LIBRARY_TITLE),
      shortcut: '',
      description: (0, STRINGS.default)(STRINGS.REVEAL_PRESETS_LIBRARY_DESCRIPTION),
      icon: '../Resources/revealPresets.png',
      run: commands.revealPresets
    },
    setPresetsLibrary: {
      name: (0, STRINGS.default)(STRINGS.SET_PRESETS_LIBRARY_TITLE),
      shortcut: '',
      description: (0, STRINGS.default)(STRINGS.SET_PRESETS_LIBRARY_DESCRIPTION),
      icon: '../Resources/revealPresets.png',
      run: commands.setPresetsLibrary
    },
    needHelp: {
      name: (0, STRINGS.default)(STRINGS.NEED_HELP_TITLE),
      shortcut: '',
      description: (0, STRINGS.default)(STRINGS.NEED_HELP_DESCRIPTION),
      icon: '../Resources/needHelp.png',
      run: commands.needHelp
    },
    resetOptions: {
      name: 'Reset Options',
      shortcut: '',
      run: commands.resetOptions
    }
  }
};

__globals.___populateWithPreset_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['populateWithPreset'].run(context, params);
};

__globals.___populateWithJson_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['populateWithJson'].run(context, params);
};

__globals.___populateFromUrl_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['populateFromUrl'].run(context, params);
};

__globals.___populateAgain_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['populateAgain'].run(context, params);
};

__globals.___lastUsedData_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['lastUsedData'].run(context, params);
};

__globals.___clearLayers_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['clearLayers'].run(context, params);
};

__globals.___revealPresets_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['revealPresets'].run(context, params);
};

__globals.___setPresetsLibrary_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['setPresetsLibrary'].run(context, params);
};

__globals.___needHelp_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['needHelp'].run(context, params);
};

__globals.___resetOptions_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['resetOptions'].run(context, params);
};

/*__$begin_of_manifest_
{
    "author": "precious design studio",
    "authorEmail": "feedback@datapopulator.com",
    "version": "3.0.3",
    "identifier": "com.datapopulator.sketch",
    "compatibleVersion": "52",
    "icon": "icon.png",
    "appcast": "https://raw.githubusercontent.com/preciousforever/data-populator/master/appcast.xml",
    "menu": {
        "isRoot": false,
        "items": [
            "populateWithPreset",
            "populateWithJson",
            "populateFromUrl",
            "populateAgain",
            "lastUsedData",
            "clearLayers",
            "-",
            "revealPresets",
            "setPresetsLibrary",
            "-",
            "needHelp",
            "-",
            "resetOptions"
        ]
    },
    "commands": [
        {
            "identifier": "populateWithPreset",
            "handler": "___populateWithPreset_run_handler_",
            "script": "plugin.js",
            "shortcut": "",
            "icon": "../Resources/populateWithPreset.png"
        },
        {
            "identifier": "populateWithJson",
            "handler": "___populateWithJson_run_handler_",
            "script": "plugin.js",
            "shortcut": "",
            "icon": "../Resources/populateWithJSON.png"
        },
        {
            "identifier": "populateFromUrl",
            "handler": "___populateFromUrl_run_handler_",
            "script": "plugin.js",
            "shortcut": "",
            "icon": "../Resources/populateFromURL.png"
        },
        {
            "identifier": "populateAgain",
            "handler": "___populateAgain_run_handler_",
            "script": "plugin.js",
            "shortcut": "cmd shift x",
            "icon": "../Resources/populateAgain.png"
        },
        {
            "identifier": "lastUsedData",
            "handler": "___lastUsedData_run_handler_",
            "script": "plugin.js",
            "shortcut": "",
            "icon": "../Resources/lastUsedData.png"
        },
        {
            "identifier": "clearLayers",
            "handler": "___clearLayers_run_handler_",
            "script": "plugin.js",
            "shortcut": "",
            "icon": "../Resources/clearLayers.png"
        },
        {
            "identifier": "revealPresets",
            "handler": "___revealPresets_run_handler_",
            "script": "plugin.js",
            "shortcut": "",
            "icon": "../Resources/revealPresets.png"
        },
        {
            "identifier": "setPresetsLibrary",
            "handler": "___setPresetsLibrary_run_handler_",
            "script": "plugin.js",
            "shortcut": "",
            "icon": "../Resources/revealPresets.png"
        },
        {
            "identifier": "needHelp",
            "handler": "___needHelp_run_handler_",
            "script": "plugin.js",
            "shortcut": "",
            "icon": "../Resources/needHelp.png"
        },
        {
            "identifier": "resetOptions",
            "handler": "___resetOptions_run_handler_",
            "script": "plugin.js",
            "name": "Reset Options",
            "shortcut": ""
        }
    ],
    "disableCocoaScriptPreprocessor": true
}__$end_of_manifest_
*/

},{"../core/library/strings":13,"./commands":84}],114:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// taken from https://github.com/mathieudutour/mocha-js-delegate/blob/master/index.js

module.exports = function (selectorHandlerDict, superclass) {
  var uniqueClassName = 'MochaJSDelegate_DynamicClass_' + NSUUID.UUID().UUIDString();

  var delegateClassDesc = MOClassDescription.allocateDescriptionForClassWithName_superclass_(uniqueClassName, superclass || NSObject);

  delegateClassDesc.registerClass();

  // Storage Handlers
  var handlers = {};

  // Define interface
  this.setHandlerForSelector = function (selectorString, func) {
    var handlerHasBeenSet = selectorString in handlers;
    var selector = NSSelectorFromString(selectorString);

    handlers[selectorString] = func;

    /*
      For some reason, Mocha acts weird about arguments: https://github.com/logancollins/Mocha/issues/28
      We have to basically create a dynamic handler with a likewise dynamic number of predefined arguments.
    */
    if (!handlerHasBeenSet) {
      var args = [];
      var regex = /:/g;
      while (regex.exec(selectorString)) {
        args.push('arg' + args.length);
      }

      var dynamicFunction = eval('(function (' + args.join(', ') + ') { return handlers[selectorString].apply(this, arguments); })');

      delegateClassDesc.addInstanceMethodWithSelector_function_(selector, dynamicFunction);
    }
  };

  this.removeHandlerForSelector = function (selectorString) {
    delete handlers[selectorString];
  };

  this.getHandlerForSelector = function (selectorString) {
    return handlers[selectorString];
  };

  this.getAllHandlers = function () {
    return handlers;
  };

  this.getClass = function () {
    return NSClassFromString(uniqueClassName);
  };

  this.getClassInstance = function () {
    return NSClassFromString(uniqueClassName).new();
  };

  // Convenience
  if ((typeof selectorHandlerDict === 'undefined' ? 'undefined' : _typeof(selectorHandlerDict)) === 'object') {
    for (var selectorString in selectorHandlerDict) {
      this.setHandlerForSelector(selectorString, selectorHandlerDict[selectorString]);
    }
  }
};

},{}]},{},[113]);
