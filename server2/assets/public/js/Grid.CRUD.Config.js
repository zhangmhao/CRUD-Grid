/**
 * Ext.ux.grid.CRUD组件 Config-- Grid.CRUD.Config.js
 * zhangmhao@gmail.com
 * 2012-12-18 10:36:40
 */
define(function(require, exports) {
    'use strict';
    var _ = require('crud/public/js/Grid.CRUD.Common.js');
    /**
     * Config模块
     */
    var ID = null,
        systemName = '',
        defaultButtons = null,
        tbarButtons = null,
        EVENT = {
            VIEW: {
                ROW_DBL_CLICK: 'event_view_row_double_click',
                SAVE_RECORD: 'event_view_save_record',
                SEARCH: 'event_view_search_record',
                UPDATE_RECORD: 'event_view_update_record',
                LOAD_DATA: 'event_view_load_data',
                SAVE_RECORD_OF_ROWEDITOR: 'event_view_save_record_of_roweditor',
                WINDOW_SHOW: 'event_view_window_show',
                VIEW_READY: 'event_view_view_ready',
                FILTER: 'event_view_filter_record'
            }
        },
        CRUD_FIELD_ALL = _.CRUD_FIELD_ALL,
        //文件类型
        FIELD_TYPE = _.FIELD_TYPE,
        SEARCH_FIELD_WIDTH = _.SEARCH_FIELD_WIDTH,
        FONT_WIDTH = _.FONT_WIDTH,
        WIN_HEIGHT_SPAN = _.WIN_HEIGHT_SPAN,
        ALL_EDITABLE = _.ALL_EDITABLE,
        ADD_EDITABLE = _.ADD_EDITABLE,
        EDIT_EDITABLE = _.EDIT_EDITABLE,
        ALL_NOT_EDITABLE = _.ALL_NOT_EDITABLE,
        WIN_SPAN = _.WIN_SPAN,
        TRUE = _.TRUE,
        FALSE = _.FALSE,
        originConfig, //未经过处理的原始用户的配置
        userConfig; //经过处理后的用户配置
    

    /**
     * 初始化参数, 该函数对用户的参数进行预处理
     * @param  {String} systemName 组件ID
     */
    function initArgs(conf) {
        systemName = conf.id;
        conf.mEditable = conf.mEditable === undefined ? true : conf.mEditable;
        ID = {
            grid: {
                //默认自带的删除，添加，刷新按钮
                'tbar_buttons_btn_sysdelete': systemName + '-grid-tbar-btn-system-delete',
                'tbar_buttons_btn_sysadd': systemName + '-grid-tbar-btn-system-add',
                'tbar_buttons_btn_sysrefresh': systemName + '-grid-tbar-btn-system-refresh'
            },
            addWindow: {
                //Todo
            },
            editWindow: {
                //Todo
            }
        };
        //根据用户的配置初始化ID
        for (var i = 0, len = !conf.mButtons ? 0 : conf.mButtons.length; i < len; i++) {
            if (typeof conf.mButtons[i] === 'string') { continue; }
            setId('grid', 'tbar', 'buttons', 'btn', conf.mButtons[i].id,//ID保存的位置
                systemName + '-grid-tbar-buttons-btn-' + conf.mButtons[i].id);//ID的值
        }
        
        if (!defaultButtons) {
            defaultButtons = {
                add: {
                    id: ID.grid.tbar_btn_sysadd,
                    text: '添加',
                    iconCls: 'icon-add'
                },
                delete: {
                    id: ID.grid.tbar_btn_sysdelete,
                    text: '删除',
                    iconCls: 'icon-delete',
                    disabled: true
                },
                refresh: {
                    id: ID.grid.tbar_btn_sysrefresh,
                    text: '刷新',
                    iconCls: 'icon-refresh'
                }
            };
        }
        if (conf.search && _.isArray(conf.search)) {
            var property = conf.search;
            conf.search = {
                lowerCaseParam: false,
                property: property
            };
        }
    }

    function getFieldLabelWidth(columnsConfig) {
        var col, maxWidth = 0, width;
        for (var i = 0; i < columnsConfig.length; i++) {
            col = columnsConfig[i];
            //只要该字段在编辑和添加两个窗口一个可编辑，且有fieldLabel
            if (col.mEditMode !== ALL_NOT_EDITABLE && col.fieldLabel) {
                width = FONT_WIDTH * col.fieldLabel.length;
                if (width > maxWidth) {
                    maxWidth = width;
                }
            }
        }
        return maxWidth;
    }
    /**
     * 获得窗口的高度
     * @return {Int} Height
     */
    function getWindowHeight(columnsConfig, winType) {
        var col, height = 0,
            editMode = '';
        if (winType === 'add') {
            editMode = ADD_EDITABLE;
        } else if (winType === 'edit') {
            editMode = EDIT_EDITABLE;
        }
        for (var i = 0; i < columnsConfig.length; i++) {
            col = columnsConfig[i];
            if (col.mEditMode === ALL_EDITABLE ||
                col.mEditMode === editMode) {
                if (col.height) {
                    height += col.height;
                } else {
                    height += 26;
                }
            }
        }
        return height + WIN_HEIGHT_SPAN;
    }

    /**
     * 获得窗口的宽度
     * @return {Int} Height
     */
    function getWindowWidth(columnsConfig, winType) {
        var col, maxWidth = 0, editMode = '';
        if (winType === 'add') {
            editMode = ADD_EDITABLE;
        } else if (winType === 'edit') {
            editMode = EDIT_EDITABLE;
        }
        for (var i = 0; i < columnsConfig.length; i++) {
            col = columnsConfig[i];
            if (col.mEditMode === editMode ||
                col.mEditMode === ALL_EDITABLE) {
                if (col.width && col.width > maxWidth) {
                    maxWidth = col.width;
                }
            }
        }
        return maxWidth + WIN_SPAN + getFieldLabelWidth(columnsConfig);
    }

    /**
     * 是否预加载数据
     * @return {Boolean} 
     */
    function isNeedPreLoadRes(columns) {
        var col;
        for (var i = 0; i < columns.length; i++) {
            col = columns[i];
            if (col.store || col.mUrl || col.mStore) {
                return true;
            }
        };
    }


    /**
     * 设置ID，参数个数不固定
     * 用法: setId('grid', 'tbar', 'search', 'this_is_id_of_searchbar');
     */
    function setId() {
        var args = Array.prototype.slice.call(arguments);
        if (args.length <= 1) { return; }
        var idOfComponent = ID[args.shift()],
            value = args.splice(args.length - 1, 1)[0],
            key = args.join('_');
        idOfComponent[key] = value;
    }
    /**
     * [getId description]
     * @return {[type]} [description]
     */
    function getId() {
        var args = Array.prototype.slice.call(arguments),
            idOfComponent = ID[args[0]],//组件的ID列表，如Grid
            result = {};
        if (!idOfComponent) { return result; }
        //构造键值
        args.shift();
        var wantKey = args.join('_');//tbar_btn
        for (var key in idOfComponent) {
            // tbar_btn_delete 子模块_部件类型_动作
            if (wantKey === key) {
                return idOfComponent[wantKey];
            }
            if (key.indexOf(wantKey) === 0) {
                var realkey = key.split('_');
                result[realkey[realkey.length - 1]] = idOfComponent[key];
                //console.log(realkey[realkey.length - 1], idOfComponent[key]);
            }
        }
        return result;
    }
    /**
     * 获取配置项
     * @param  {String}  component [组件名称]
     * @param  {String} name [配置名]
     * @return {Object}      [结果]
     */
    function get() {
        var args = Array.prototype.slice.call(arguments),
            conf;
        if (args.length === 0) {
            return null;
        }
        conf = userConfig;
        for (var i = 0, len = args.length; i < len; i++) {
            conf = conf[args[i]];
            //如果参数多于实际的配置,返回null
            if (!_.isObject(conf) && i < len - 1) {
                console.log('[Grid.CRUD.Config]没有该参数');
                return null;
            }
        }
        return conf;
    }

    /**
     * 设置配置项
     * @param  {String} name 配置名
     * @param  {Object}      Value
     */
    function set() {
        var args = Array.prototype.slice.call(arguments),
            conf;
        if (args.length === 1) {
            throw '[Grid.CRUD.Config] function set () : set  without value.';//出错
        } else if (args.length > 1) {
            conf = userConfig;
            for (var i = 0; i < args.length - 2; i++) {
                if (!conf[args[i]]) {
                    conf[args[i]] = {};
                }
                conf = conf[args[i]];
            }
            conf[args[i]] = args[i + 1];
        }
    }
    /**
     * 获取数据库的字段配置
     * @param  {Array} columns 用户的字段配置
     * @return {Array}         符合Ext规范的字段配置
     */
    function getStoreField(columns) {
        return getConfigFromColumn(columns, function (col) {
            var field = {};
            field.name = col.id;
            //如果用户有定义类型 Type
            if (!!col.type) {
                field.type = col.type;
            }
            //如果用户有定义 dateFormat
            if (!!col.dateFormat) {
                field.dateFormat = col.dateFormat;
            }
            //字段的非空限制，在数据库为autoSave的时候可以避免表单自动提交
            field.mapping = col.dataIndex;
            field.allowBlank = (col.allowBlank === undefined || col.allowBlank === null) ? true : col.allowBlank;
            return field;
        });
    }
    /**
     * 通过filter从columns配置中提取配置项
     * @param  {Funtion} filter 过滤器
     * @return {Object}         结果
     */
    function getConfigFromColumn(columns, filter) {
        var col, field, fields = [];
        for (var i = 0, len = columns.length; i < len; i++) {
            col = columns[i];
            if (!col.dataIndex) {
                continue;
            }
            field = filter(col);
            fields.push(field);
        }
        return fields;
    }
    function getWindowFieldConfig(columns) {
        /**
         * {
         *     emptyText: '空的时候的提示',
         *     fieldLabel: '标题',
         *     allowblank: false
         * }
         */
        return getConfigFromColumn(columns, function (col) {
            var config = _.except(col, [
                'sortable',
                'header',
                'renderer'
            ]);
            if (config.type === 'enum') {
                config.store = col.editStore;
                config.mMode = getComboMode(col);
            }
            config.fieldLabel = col.fieldLabel || col.header;
            config.enableKeyEvents = true;
            return config;
        });
    }
    
    function getComboMode(col) {
        if (col.mLocalData) {
            return 'local';
        } else if (col.mStore || col.mUrl) {
            return 'remote';
        }
    }
    /**
     * 根据Combo的字段配置来生成Store
     * @param  {Object} combo         字段配置
     * @param  {Boolean} useToEdit    是否用于编辑或者添加
     * @return {Ext.data.JsonStore}      
     */
    function createStoreFromComboConfig(combo, useToEdit) {
        console.log("##createStoreFromComboConfig##");
        var store;
        if (combo.mStore) {
            store = combo.mStore;
        } else if (combo.mUrl) {
            var valueName = combo.valueField || combo.id,//优先使用用户自定义的valueField
                valueMappig = combo.valueField || combo.dataIndex,
                textName = combo.displayField || 'displayText',//优先使用用户自定义的displayField
                textMapping = combo.displayField || 'displayText',
                fields = [{
                    name: valueName, 
                    mapping: valueMappig
                }, {
                    name: textName,
                    mapping: textMapping
                }],
                listeners;
            if (!useToEdit) {
                listeners = {
                    load: function () {
                        var ComboRecord = Ext.data.Record.create(fields),
                            data = {},
                            rd;
                        data[valueName] = CRUD_FIELD_ALL;
                        data[textName] = '全部';
                        rd = new ComboRecord(data);
                        
                        store.insert(0, rd);
                    }
                };
            }
            store = new Ext.data.JsonStore({
                autoSave: false,
                //autoDestroy: true,
                url: combo.mUrl,
                fields: fields,
                root: 'data',
                listeners: listeners
            });
        } else if (combo.mLocalData) {
            store = new Ext.data.ArrayStore({
                fields: [combo.id, 'displayText'],
                data: getArrayFromObject(combo.mLocalData)
            });
        }
        return store;
    }

    /**
     * 字段的可编辑性
     * @param  {Object/Boolean} editable 
     * @return {Int}            0 全部可编辑， 1 添加窗口编辑，2 编辑窗口可编辑 
     */
    function getEditMode(editMode, hidden) {
        var flag = 0;
        if (hidden) {
            return ALL_NOT_EDITABLE;
        }
        if (_.isObject(editMode)) {
            //添加窗口可编辑
            if (_.isEmpty(editMode.add) || editMode.add) {
                flag += 2;
            }
            //编辑窗口可编辑
            if (_.isEmpty(editMode.edit) || editMode.edit) {
                flag += 3;
            }
            switch (flag) {
            case 0:
                return ALL_NOT_EDITABLE;
            case 2:
                return ADD_EDITABLE;
            case 3:
                return EDIT_EDITABLE;
            case 5:
                return ALL_EDITABLE;
            }
        } else if (_.isEmpty(editMode) || editMode) {
            //没有配置默认该字段在所有位置都可以编辑
            return ALL_EDITABLE;
        } else {
            //editMode: false
            return ALL_NOT_EDITABLE;
        }
    }

    /**
     * 从Object里面获取数组
     * 例如 var a = {
     *          '0': 'abc',
     *          '1': 'def'
     *      }
     *
     * 返回 [['0', 'abc'], ['1', 'def']]
     */
    function getArrayFromObject(obj) {
        var array = [], tmp;
        for (var key in obj) {
            tmp = [key, obj[key]];
            array.push(tmp);
        }
        return array;
    }

    /**
     * 获取Grid的栏目配置
     * @param  {Array} columns 用户的Column配置
     * @return {Array}         处理过后的用户配置
     */
    function getColumnsConfig(columns) {
        var columnConfig = [], col, newCol, store;
        for (var i = 0; i < columns.length; i++) {
            col = columns[i];
            if (!col.id) { continue; }
            //没有header就是不进行处理 
            if (!col.header) { col.header = col.fieldLabel || col.id || col.dataIndex; }
            if (!col.fieldLabel) {col.fieldLabel = col.header; }
            //没有配置dataIndex，就默认用id为dataIndex
            if (!col.dataIndex) {
                col.dataIndex = col.id;
            }
            newCol = _.except(col, ['type']);
            if (!originConfig.mEditor || originConfig.mEditor === 'rowEditor'
                || originConfig.mEditor.add === 'rowEditor') {
                //生成编辑器
                if (!FIELD_TYPE[col.type]) {
                    throw '[Grid.CRUD.Config] function getColumnsConfig () : ' + col.id + '字段的类型' + col.type + '不合法.';//出错
                }
                
                
                if (col.mEditMode !== ALL_NOT_EDITABLE) {
                    if (col.type === 'enum') {
                        var mode = getComboMode(col);
                        
                        newCol.editor = new FIELD_TYPE[col.type]({
                            fieldLabel: col.fieldLabel,
                            store: store, //direct array data
                            typeAhead: true,
                            triggerAction: 'all',
                            width: col.width,
                            mode: mode,
                            emptyText: col.emptyText,
                            valueField: col.valueField || col.dataIndex || col.id,
                            displayField: col.displayField === undefined ? 'displayText'
                                                                    : col.displayField,
                            editable: col.editable,
                            valueNotFoundText: col.valueNotFoundText === undefined ? '没有该选项'
                                                                            : col.valueNotFoundText,
                            forceSelection: true,
                            selectOnFocus: true,
                            blankText : '请选择',
                            allowBlank: col.allowBlank,
                            listeners: {
                                select: function (combo, record, index) {
                                    console.log(record, index);
                                }
                            }
                        });
                    } else {
                        if (_.isEmpty(newCol.disabled)) { newCol.disabled = false; }
                        newCol.editor = new FIELD_TYPE[col.type]({
                            name: newCol.dataIndex,
                            allowBlank: newCol.allowBlank,
                            disabled: newCol.disabled || (col.mEditMode === ADD_EDITABLE),
                            hidden: newCol.hidden
                        });
                    }
                }
            }
            if (col.type === 'enum') {
                newCol.renderer = (function (col) {
                    return function (value) {
                        if (value) {//传入的value不为空
                            console.log('render ennum value = ' + value + ' ' + col.valueField);
                            var result = col.store.query(col.valueField, value);
                            if (result) {
                                var record = result.get(0);
                                if (record) {
                                    return result.get(0).get(col.displayField);
                                } else {
                                    return '<font color="red">无效值</font>';
                                }
                            } else {
                                return '空值';
                            }
                        }
                        else {//传入的value为空
                            return '空值';
                        }
                    };
                })(col);
            }
            newCol.dataIndex = newCol.id;
            columnConfig.push(newCol);
        }
        return columnConfig;
    }

    function getStoreDefaultData(columns) {
        var defaultData = {}, col;
        for (var i = 0; i < columns.length; i++) {
            col = columns[i];
            defaultData[col.dataIndex] = col.defaultData || '';
        }
        return defaultData;
    }

    function getColumnById(id, columns) {
        var i = 0, length = columns.length;
        while (i < length) {
            if (columns[i].id === id) {
                return columns[i];
            }
            i++;
        }
        return null;
    }
    /**
     * 获取顶部工具栏的配置
     * @return {Object} 配置
     */
    function getTbarConfig(config) {
        /*if (!!tbarButtons) {
            console.log("顶部工具按钮初始化");
            return {
                items: tbarButtons
            };
        }*/
        console.log("初始化顶部工具按钮");
        tbarButtons = [];
        var buttons = config.mButtons, btn, btnName;
        if (!config.mButtons) { return null; }
        for (var i = 0; i < buttons.length; i++) {
            btn = buttons[i];
            if (typeof btn === 'string') {
                btnName = btn;
                btn = defaultButtons[btnName];
                if (!!btn) {
                    btn.id = getId('grid', 'tbar', 'buttons', 'btn', 'sys' + btnName);
                    tbarButtons.push(btn);
                }
            } else {
                if (btn.id) {
                    btn.id = getId('grid', 'tbar', 'buttons', 'btn', btn.id);
                }
                btn.belongToUser = true;
                tbarButtons.push(btn);
            }
        }
        return {
            items: tbarButtons
        };
    }

    function getSelectPos(column, param) {
        var selectPos = 0, pos; 
        if (column.mStore) {
            column.mLocalData.each(function (record) {
                if (parseInt(record.get(column.id), 10) === param[column.id]) {
                    selectPos = pos;
                }
                pos += 1;
            });
        }
        return selectPos;
    }

    function getSearchBarItemWidth(type) {
        return SEARCH_FIELD_WIDTH[type];
    }
    /**
     * 获取搜索栏目配置
     * @param  {Object} searchConfig [搜索的用户配置]
     * @param  {Object} ColumnConfig [字段的属性，需要根据字段的属性来生
     *                                成不同的编辑类型Combobox,NumberField]
     * @return {Object}              [配置]
     */
    function getSearchBarConfig(searchConfig, columnConfig) {
        if (columnConfig.length === 0) { return null; }
        var field, column, searchCondition, items = [];
        var property = searchConfig.property;
        //配置只能是数组
        if (!_.isArray(property)) {
            property = [].concat(property);
        }
        for (var i = 0; i < property.length; i++) {
            (function (column) {
                searchCondition = property[i];
                column = getColumnById(searchCondition, columnConfig);
                if (!column) { return; }
                items.push(column.fieldLabel, ' ');
                var id = systemName + ':grid:searchbar:' + column.id;
                if (column.type === 'enum') {
                    var mode = getComboMode(column);
                    var selectPos = 0, param = get('store', 'params');
                    if (param) {
                        selectPos = getSelectPos(column, param);
                    }
                    field = new FIELD_TYPE[column.type]({
                        id: id,
                        fieldLabel: column.fieldLabel,
                        store: column.store,
                        typeAhead: true,
                        triggerAction: 'all',
                        width: getSearchBarItemWidth(column.type) || column.width,
                        mode: mode,
                        emptyText: column.emptyText,
                        valueField: column.valueField || column.dataIndex || column.id,
                        displayField: column.displayField === undefined ? 'displayText'
                                                                : column.displayField,
                        editable: column.editable,
                        valueNotFoundText: column.valueNotFoundText === undefined ? '没有该选项'
                                                                        : column.valueNotFoundText,
                        forceSelection: true,
                        selectOnFocus: true,
                        blankText : '请选择',
                        allowBlank: true, //搜索框的字段为非必填，可以为空
                        listeners: {
                            afterrender: function (combo) {
                                var record = combo.store.getAt(selectPos);
                                if (record) {
                                    combo.setValue(record.data[column.id]);
                                }
                            },
                            select: function (combo, record, index) {
                                console.log(record, index);
                            }
                        }
                    });
                } else if (column.type === 'boolean') {
                    var valueField = column.dataIndex || column.id;
                    field = new Ext.form.ComboBox({
                        id: id,
                        store: new Ext.data.ArrayStore({
                            fields: [valueField, 'displayText'],
                            data: [['', '全部'], [TRUE, 'true'], [FALSE, 'false']]
                        }),
                        typeAhead: true,
                        triggerAction: 'all',
                        width: getSearchBarItemWidth(column.type) || column.width,
                        mode: 'local',
                        valueField: valueField,
                        displayField: 'displayText',
                        valueNotFoundText: '没有该选项',
                        selectOnFocus: true,
                        allowBlank: true //搜索框的字段为非必填，可以为空
                    });
                } else {
                    //排除掉不需要的属性
                    var conf = _.except(column, [
                        'type',
                        'sortable',
                        'header',
                        'editable',
                        'mEditMode',
                        'dataIndex'
                    ]);
                    conf.id = id;
                    conf.width = getSearchBarItemWidth(column.type) || column.width;
                    conf.allowBlank = true;//搜索框的字段为非必填，可以为空
                    field = new FIELD_TYPE[column.type](conf);
                }
                items.push(field, ' ');
            })(column);
        }
        return {
            items: items
        };
    }

    /**
     * 根据用户对editor的配置进行
     * 选择编辑器, 如果不配置，默认使用rowEditor
     * editor: 'window' 表示编辑和添加的时候全部使用window来进行编辑
     * 或者可以像下面一样分开选择
     * editor: {
     *    add: 'rowEditor', //添加的时候使用rowEditor
     *    edit: 'widow' //编辑的时候使用窗口
     * },
     * @return {Object}
     * 
     */
    function getAddEditWay(editable, editor) {
        if (!editable) {
            return null;
        }
        if (!editor || editor === 'rowEditor') {
            return {
                add: 'rowEditor',
                edit: 'rowEditor'
            };
        } else if (editor === 'window') {
            return {
                add: 'window',
                edit: 'window'
            };
        } else if (_.isObject(editor)) {
            return {
                add: editor.add || 'rowEditor',
                edit: editor.edit || 'rowEditor'
            };
        } else {
            return null;
        }
    }
    /**
     * 检查配置的合法性,不合法的进行修复
     * @param  {Object} conf 配置
     */
    function checkConfig(conf) {
        var columns = conf.mColumns, col, storeConfig;

        for (var i = 0, len = columns.length; i < len; i++) {
            col = columns[i];
            //用户没有配置字段的可编辑限制，则默认为可编辑
            if (typeof col.editable !== 'boolean') {
                col.editable = true;
            }
            col.mEditMode = getEditMode(col.mEdit, col.hidden);
        }
        if (!conf.store) {
            conf.store = {};
        }
        storeConfig = conf.store;
        storeConfig.successProperty = storeConfig.successProperty || 'success';
        storeConfig.idProperty = storeConfig.idProperty || 'id';
        storeConfig.messageProperty = storeConfig.messageProperty || 'msg';
        storeConfig.totalProperty = storeConfig.totalProperty || 'totalCount';
        storeConfig.root = storeConfig.root || 'data';
        storeConfig.fields = getStoreField(columns);
    }

    function createStoreForColumns(columns) {
        var col;
        for (var i = 0; i < columns.length; i++) {
            col = columns[i];
            if (col.type === 'enum') {
                col.store = createStoreFromComboConfig(col);
                col.editStore = createStoreFromComboConfig(col, true);
            }
        }
    }
    /**
     * 初始化用户配置
     * @param  {object} config 用户配置
     */
    function init(config) {
        //初始化config
        userConfig = {};
        originConfig = config;
        //初始化系统参数
        initArgs(config);
        var tbarConfig,
            mode, //组件加载数据的模式
            columns = config.mColumns,
            specialColumns = getColumnsConfig(columns);//转化为Ext理解的Columns
        //组件加载数据的模式
        if (!!config.data) {
            mode = 'local';
        } else if (!!config.api) {
            mode = 'remote';
        }
        checkConfig(config);
        //为需要Store的字段创建Store
        createStoreForColumns(columns);
        /* 将用户的配置转化为系统可用的配置 */
        tbarConfig = getTbarConfig(config);
        set('mode', mode);
        set('needPreloadRes', isNeedPreLoadRes(columns));
        set('editable', config.mEditable),
        set('origin', originConfig);
        set('store', 'params', config.store.mInitParams);
        set('store', 'reader', config.store);
        set('store', 'defaultData', getStoreDefaultData(columns));
        
        if (config.search) {
            set('grid', 'tbar', 'search', 'property', getSearchBarConfig(config.search, columns));
            setId('grid', 'tbar', 'search', systemName + '-grid-tbar-search');
            set('grid', 'tbar', 'search', 'lowerCaseParam', config.search.lowerCaseParam);
        }
        if (config.mButtons) {
            set('grid', 'tbar', 'buttons', tbarConfig);
            setId('grid', 'tbar', 'buttons', systemName + 'grid-tbar-buttons');
        }
        var addWinHeight = getWindowHeight(columns, 'add'),
            winLabelWidth = getFieldLabelWidth(columns),
            addWinWidth = getWindowWidth(columns, 'add'),
            editWinHeight = getWindowHeight(columns, 'edit'),
            editWinWidth = getWindowWidth(columns, 'edit');
        var singleSelect = config.checkbox ? false : true;
        set('grid', 'page', config.page);
        set('grid', 'singleSelect', singleSelect);
        set('grid', 'addEditWay', getAddEditWay(config.mEditable, config.mEditor));
        set('event', 'view', EVENT.VIEW);
        set('window', 'edit', 'fields', getWindowFieldConfig(columns));
        set('window', 'edit', 'id', config.id + ':window:edit');
        set('window', 'edit', 'height', editWinHeight);
        set('window', 'edit', 'width', editWinWidth);
        set('window', 'edit', 'labelWidth', winLabelWidth);
        set('window', 'add', 'fields', getWindowFieldConfig(columns));
        set('window', 'add', 'id', config.id + ':window:add');
        set('window', 'add', 'height', addWinHeight);
        set('window', 'add', 'labelWidth', winLabelWidth);
        set('window', 'add', 'width', addWinWidth);

        /************ Buttons *************/
        /*
        for (var i = 0; i < buttonsConf.length; i++) {
            var conf = buttonsConf[i];
            console.log(conf.type, conf.handler);
            systemConfig.buttons.push({
                text: conf.text || defaultConfig.buttons[conf.type].text,
                handler: conf.handler
            });
        }*/
        /************ Grid *************/
        set('grid', 'columns', specialColumns);
        /************ Window *************/
        /************ Store *************/
        /************ Toolbar *************/
    }
    return {
        init: init,
        get: get,
        set: set,
        getId: getId,
        /**
         * 获取事件
         * @param  {stirng} module    模块名
         * @param  {string} eventName 事件名
         * @return {string}           事件
         */
        getEvent: function (module, eventName) {
            return this.get('event', module, eventName);
        }
    };
});