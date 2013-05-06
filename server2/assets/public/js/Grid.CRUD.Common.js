/**
 * Ext.ux.grid.CRUD组件 Common函数-- Grid.CRUD.Common.js
 * zhangmhao@gmail.com
 * 2013-4-10 10：21
 */
define(function (require, exports) {
    'use strict';
    function is(type, obj) {
        if (Object.prototype.toString.call(obj).indexOf(type) > 0) {
            return true;
        }
        return false;
    }
    function isWindow(obj) { return obj !== null && obj === obj.window; }
    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && obj.__proto__ === Object.prototype;
    }
    /**
     * 将两个Object合体
     * @param  {Object} a 
     * 
     * @param  {Object} b 
     * @return {Object}
     */
    function extend(target, source, deep) {
        var key;
        for (key in source) {
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
                    target[key] = {};
                }
                if (isArray(source[key]) && !isArray(target[key])) {
                    target[key] = [];
                }
                extend(target[key], source[key], deep);
            } else if (source[key] !== undefined) {
                target[key] = source[key];
            }
        }
    }
    function isArray(a) { return is('Array', a); }

    function isObject(a) { return is('Object', a); }
    exports.extend = function (target) {
        var deep, args = Array.prototype.slice.call(arguments, 1);
        if (typeof target === 'boolean') {
            deep = target;
            target = args.shift();
        }
        args.forEach(function (arg) { extend(target, arg, deep); });
        return target;
    };

    function lowerCaseObjectKey(obj) {
        if (!obj) { return null; }
        var newObj = {};
        for (var key in obj) {
            newObj[key.toLowerCase()] = obj[key];
        }
        return newObj;
    }

    /**
     * 将obj中exception中的key值排除掉
     * @param  {Object} obj       待处理的对象
     * @param  {Array} exception  要排除的key数组
     * @return {Object}           需要处理的对象
     */
    function except(obj, exception) {
        var newObj = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                //key值在排除项外，则可以获得
                if (exception.indexOf(key) < 0) {
                    newObj[key] = obj[key];
                }
            }
        }
        return newObj;
    }
    var FIELD_TYPE = {
        'string': Ext.form.TextField,
        'bigString': Ext.form.TextArea,
        'boolean': Ext.form.Checkbox,
        'date': Ext.form.DateField,
        'float': Ext.form.NumberField,
        'int': Ext.form.NumberField,
        'enum': Ext.form.ComboBox
    };
    exports.except = except;
    exports.FONT_WIDTH = 14;
    exports.WIN_SPAN = 40;
    exports.FIELD_TYPE = FIELD_TYPE;
    exports.lowerCaseObjectKey = lowerCaseObjectKey;
    exports.is = is;
    exports.isObject = isObject;
    exports.isArray = isArray;
});