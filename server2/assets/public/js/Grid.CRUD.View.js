/**
 * Ext.ux.grid.CRUD组件 View层 -- Grid.CRUD.View.js
 * zhangmhao@gmail.com
 * 2012-12-18 10:36:40
 */
define(function (require, exports) {

    /**
     * View层主要做用户界面的响应和更新用户界面
     * 为了组件可以放置于不同的容器中，组件选择继承于Ext.Panel
     * 界面组成
     *  ---工具栏 [Ext.Toolbar]    包括 搜索栏 和 CRUD按钮
     *  ---表格   [Ext.grid.GridPanel]   展现数据的界面
     *  ---窗口
     *      |---添加窗口      [Ext.Window]
     *      |---编辑窗口      [Ext.Window]
     *      |---删除提示窗口  [Ext.Window]
     *      |---消息提示窗口  [Ext.Window]
     *
     * 组件内部的组件通过接口的形式来通信，而组件与组件外部则通过组件通信
     */
    'use strict';

    var _ = require('crud/public/js/Grid.CRUD.Common.js');
    //监听
    var LISTENERS_TYPE = {
            'string'   : 'keyup',
            'bigString': 'keyup',
            'int'      : 'keyup',
            'float'    : 'keyup',
            'time'     : 'select',
            'datetime' : 'select',
            'date'     : 'select',
            'enum'     : 'select',
            'boolean'  : 'check'
        },
        FIELD_TYPE       = _.FIELD_TYPE,
        FALSE            = _.FALSE,
        TRUE             = _.TRUE,
        CRUD_FIELD_ALL   = _.CRUD_FIELD_ALL,
        BTN_CHECK_EXCEPT = ['sysadd', 'sysrefresh'];

    function serializeForm(form) {
        var fElements = form.elements || (document.forms[form] || Ext.getDom(form)).elements,
            hasSubmit = false,
            encoder = encodeURIComponent,
            name,
            data = '',
            type,
            hasValue;

        Ext.each(fElements, function (element) {
            name = element.name;
            type = element.type;

            if (name) {
                if (/select-(one|multiple)/i.test(type)) {
                    Ext.each(element.options, function (opt) {
                        if (opt.selected) {
                            hasValue = opt.hasAttribute ? opt.hasAttribute('value') : opt.getAttributeNode('value').specified;
                            data += String.format("{0}={1}&", encoder(name), encoder(hasValue ? opt.value : opt.text));
                        }
                    });
                } else if (!(/file|undefined|reset|button/i.test(type))) {
                    if (!(/radio|checkbox/i.test(type) && !element.checked) && !(type == 'submit' && hasSubmit)) {
                        data += encoder(name) + '=' + encoder(element.value) + '&';
                        hasSubmit = /submit/i.test(type);
                    }
                }
            }
        });
        return data.substr(0, data.length - 1);
    }

    function needRowEditor(conf) {
        if (!conf) {
            return false;
        }
        if (conf.edit === 'rowEditor' || conf.add === 'rowEditor') {
            return true;
        }
        return false;
    }
    function noNeedClicksToEdit(conf) {
        var adW = conf.addEditWay,
            needEdit = conf.needEdit;
        if (adW.edit === 'window' || needEdit === false) {
            return true;
        }
        return false;
    }

    function defaultNeedEnable(record) {
        if (record) {
            return true;
        } else {
            return false;
        }
    }
    var View = Ext.extend(Ext.util.Observable, {
        constructor: function (conf) {
            var that = this,
                editWindowsIDs = {},
                windows = [],
                //事件
                eventConfig = conf.event,
                //最后一个编辑窗口的位置
                lastEditWinPos = null,
                //顶部工具栏的配置方式
                buttonsBarConfig = conf.buttonsBarConfig;
            //将config保存到对像中
            this.config = conf;
            //加载资源的loadMask
            this.loadResMask = null;
            var getDataMethod = conf.singleSelect ? 'getSelected' : 'getSelections';
            /**
             * 通过record Id 获取 window
             * @param  {String} recordId  记录Id
             * @return {Ext.Window}       窗口
             */
            var getEditWinByRecId = function getEditWinByRecId(recordId) {
                if (!_.isEmpty(editWindowsIDs[recordId])) {
                    console.info('window ' + editWindowsIDs[recordId] +
                        ' found for record[' + recordId + ']');
                    return Ext.getCmp(editWindowsIDs[recordId]);
                }
                console.info('window not found for record[' + recordId + ']');
                return null;
            },
            /**
             * 获取最后的窗口Id
             * @return {String} 最后的窗口Id
             */
            getLastWindowId = function getLastWindowId() {
                return windows[windows.length - 1];
            },
            /**
             * 如果window移动，就从未移动过的列表记录(windows)中移除
             * @param  {String} winId 窗口Id
             * @return {String} 移除的窗口Id
             */
            removeWindowFromOrder = function removeWindowFromOrder(winId) {
                var id;
                for (var i = 0; i < windows.length; i++) {
                    id = windows[i];
                    if (winId === id) {
                        return windows.splice(i, 1);
                    }
                }
            },
            /**
             * 删除window
             * @param  {String} recordId 记录Id
             */
            removeEditWindow = function removeEditWindow(recordId) {
                var noWinExist = true, win;//所有窗口已经关闭
                removeWindowFromOrder(editWindowsIDs[recordId]);
                editWindowsIDs[recordId] = null;
                delete editWindowsIDs[recordId];
                for (win in editWindowsIDs) {
                    if (editWindowsIDs.hasOwnProperty(win)) {
                        noWinExist = false;
                    }
                }
                if (noWinExist) {
                    console.log('恢复位置');
                    lastEditWinPos = null;
                } else {
                    win = Ext.getCmp(getLastWindowId());
                    if (win) {
                        lastEditWinPos = win.getPosition();
                    }
                }
            },
            setEditWindow = function setEditWindow(recordId, winId) {
                editWindowsIDs[recordId] = winId;
            };

            //添加事件
            for (var eventName in eventConfig) {
                this.addEvents(eventName);
            }
            //绑定顶部工具栏按钮的处理函数
            for (var i = 0, len = !buttonsBarConfig ? 0 : buttonsBarConfig.items.length; i < len; i++) {
                var button = buttonsBarConfig.items[i];
                this.addEvents(button.id);
                //用户自定义的按钮
                if (button.belongToUser) {
                    console.info('初始化用户自定义按钮' + button.id);
                    button.handler = (function (button) {
                        var userHandler = button.handler;//用户的处理函数
                        return function (btn, event) {
                            var records, data;
                            records = that.rsm[getDataMethod]();
                            that.fireEvent(btn.id, btn, event, records, data, userHandler);
                        };
                    })(button);
                    //处理按钮的反状态处理函数
                    if (button.mNegaHandler) {
                        button.mNegaHandler = (function (button) {
                            var userHandler = button.mNegaHandler;//用户的处理函数
                            return function (btn, event) {
                                var records, data;
                                records = that.rsm[getDataMethod]();
                                that.fireEvent(btn.id, btn, event, records, data, userHandler);
                            };
                        })(button);
                    }
                } else {
                    console.info('初始化系统自带按钮' + button.id);
                    button.handler = function (btn, event) {
                        var records = that.rsm[getDataMethod]();
                        that.fireEvent(btn.id, btn, event, records);
                    };
                }
            }
            /**
             * 创建window
             * @param  {Object} config 配置
             * @return {Ext.Window}        窗口
             */
            function createWindow(conf, record) {
                var win, formPanel,
                    isCreate = true,//是否创建为创建记录
                    editMode, //编辑模式
                    saveBtnId = conf.id + ':btn:save',
                    idPrefix = '',
                    winType = record ? 'edit' : 'add',
                    cancelBtnId = conf.id + ':btn:cancel',
                    defaultValues = {},
                    beginFieldString;
                if (record) {
                    isCreate = false;
                    idPrefix = conf.id + ':window:edit:field:';
                    editMode = _.EDIT_EDITABLE;//编辑框可编辑
                } else {
                    idPrefix = conf.id + ':window:add:field:';
                    editMode = _.ADD_EDITABLE;//添加框可编辑
                }
                //创建formpanel的字段
                var fieldConfig = conf.fields, fields = [];
                for (var i = 0; i < fieldConfig.length; i++) {
                    var item = _.cloneObject(fieldConfig[i], ['mStore', 'mLocalData', 'store', 'editStore']);
                    if (!_.isEmpty(item.defaultValue)) {
                        defaultValues[item.dataIndex] = item.defaultValue;
                    }

                    (function (fldConfCopy, fldConfOrgn) {
                        var fieldConfItem;
                        if (fldConfCopy.mEditMode === editMode ||
                            fldConfCopy.mEditMode === _.ALL_EDITABLE) {
                            if (_.isEmpty(fldConfCopy.listeners)) {
                                fldConfCopy.listeners = {};
                            }

                            if (fldConfCopy.type === 'enum') {
                                fldConfOrgn.realId[winType] = idPrefix + fldConfCopy.id + ':' + Math.round(Math.random() * 10000);
                                fieldConfItem = {
                                    id: fldConfOrgn.realId[winType],
                                    fieldLabel: fldConfCopy.fieldLabel,
                                    store: fldConfCopy.editStore, //direct array data
                                    typeAhead: true,
                                    triggerAction: 'all',
                                    width: fldConfCopy.width,
                                    mode: fldConfCopy.mMode,
                                    emptyText: fldConfCopy.emptyText,
                                    valueField: fldConfCopy.valueField || fldConfCopy.dataIndex,
                                    displayField: fldConfCopy.displayField === undefined ? 'displayText'
                                                                            : fldConfCopy.displayField,
                                    editable: fldConfCopy.editable,
                                    valueNotFoundText: fldConfCopy.valueNotFoundText === undefined ? '没有该选项'
                                                                                    : fldConfCopy.valueNotFoundText,
                                    forceSelection: true,
                                    mParent: fldConfCopy.mParent,
                                    blankText : '请选择',
                                    dataIndex: fldConfCopy.dataIndex,
                                    name: fldConfCopy.id,
                                    selectOnFocus: true,
                                    allowBlank: false,
                                    listeners: {
                                        afterrender: function (combo) {
                                            //combo.setValue(combo.store.getAt(selectPos).data[fldConfCopy.dataIndex]);
                                        },
                                        beforequery: function () {
                                            var parentId,
                                                config = this.initialConfig;
                                            console.debug('beforequery', config);
                                            if (config.mParent) {
                                                parentId = _.getColumnById(config.mParent, fieldConfig).realId[winType];
                                                var param = {};
                                                param[config.mParent] = Ext.getCmp(parentId).getValue();
                                                if (CRUD_FIELD_ALL === param[config.mParent]) {
                                                    param[config.mParent] = '';
                                                }
                                                _.setBaseParam(this.store, param);
                                                this.store.load();
                                            }
                                        }
                                    }
                                };
                            } else {
                                fieldConfItem = _.except(fldConfCopy, ['type', 'editable', 'mEditMode']);
                                fieldConfItem.id = idPrefix + fieldConfItem.id + Math.round(Math.random() * 10000);
                                fieldConfItem.name = fldConfCopy.dataIndex;
                            }
                            //为窗口字段创建监听，以控制保存按钮的状态
                            var orgnEventHandler = fieldConfItem.listeners[LISTENERS_TYPE[fldConfCopy.type]];
                            fieldConfItem.listeners[LISTENERS_TYPE[fldConfCopy.type]] = function (field, rec, index) {
                                var btn = Ext.getCmp(saveBtnId);
                                if (record && field.getValue() === record.get(field.getName())) {
                                    btn.disable();
                                } else {
                                    btn.enable();
                                }
                                if (orgnEventHandler) {
                                    orgnEventHandler(field, rec, index, win);
                                }
                            };
                            //可编辑字段根据数据类型创建field
                            fields.push(new FIELD_TYPE[fldConfCopy.type](fieldConfItem));
                        }
                    })(item, fieldConfig[i]);

                }
                if (!conf.title) {
                    conf.title = "窗口";
                }
                //创建FormPanel
                conf.buttons = [{
                    id: saveBtnId,
                    text: '保存',
                    disabled: true,
                    handler: function () {
                        var basicForm = formPanel.getForm();
                        if (!basicForm.isValid()) {
                            console.log('表单没有填写完整');
                            return;
                        }
                        var saveRecord,
                            fieldValues = basicForm.getFieldValues();
                        //将没有在form表单编辑的默认值加入record
                        for (var fieldName in defaultValues) {
                            if (_.isEmpty(fieldValues[fieldName])) {
                                fieldValues[fieldName] = defaultValues[fieldName];
                            }
                        }

                        //添加框是不带记录
                        if (!record) {
                            saveRecord = new that.config.recordType(Ext.ux.clone(that.config.defaultData));
                            for (var key in fieldValues) {
                                if (fieldValues.hasOwnProperty(key)) {
                                    saveRecord.set(key, fieldValues[key]);
                                }
                            }
                        } else {
                            saveRecord = record;
                        }
                        that.fireEvent(conf.mEvent.ok, saveRecord, fieldValues);
                    }
                }, {
                    id: cancelBtnId,
                    text: '取消',
                    handler: function () {
                        win.close();
                    }
                }];
                formPanel = new Ext.form.FormPanel({
                    baseCls: 'x-plain',
                    labelWidth: conf.labelWidth,
                    labelSeparator: ':',
                    items: fields
                });

                conf.items = formPanel;
                conf.modal = !conf.mMultiWin;
                conf.listeners = _.extend({}, conf.listeners, {
                    destroy: function () {
                        console.log('window ' + this.id + 'destroy');
                        if (record) {
                            removeEditWindow(record.id);
                        }
                    },
                    show: function () {
                        //显示
                        beginFieldString = serializeForm(formPanel.getForm().getEl());
                        that.fireEvent(eventConfig.WINDOW_SHOW, win, record);
                    },
                    activate: function () {
                        console.info('窗口' + conf.id + '激活');
                        that.fireEvent(eventConfig.WINDOW_SHOW, win, record);
                    },
                    afterrender: function () {
                        var form = formPanel.getForm();
                        form.setValues(defaultValues);
                    },
                    beforeclose: function () {
                        if (win.fromSaveBtn) { return; }
                        var endFieldString = serializeForm(formPanel.getForm().getEl());
                        if (endFieldString !== beginFieldString) {
                            //如果还没有确认过
                            if (!win.alreadyConfirm) {
                                Ext.Msg.confirm('请确认', '真的要退出吗？',
                                function (button, text) {
                                    if (button === "yes") {
                                        win.alreadyConfirm = true;
                                        win.close();
                                    }
                                });
                                return false;
                            }
                            //已经确认，直接关闭
                            return true;
                        }
                    }
                });
                //创建窗口
                win = new Ext.Window(conf);
                win.getFormPanel = function () {
                    return formPanel;
                };
                formPanel.disableAllFields = function () {
                    for (var i = 0; i < fields.length; i++) {
                        fields[i].disable();
                    }
                };
                formPanel.getField = function (id) {
                    for (var i = 0; i < fields.length; i++) {
                        if (fields[i].name === id) {
                            return fields[i];
                        }
                    }
                };
                win.loadRecord = function (record) {
                    //如果有记录就将记录加载进窗口
                    if (record) {
                        formPanel.getForm().loadRecord(record);
                    }
                    beginFieldString = serializeForm(formPanel.getForm().getEl());
                };
                return win;
            }

            console.log('#######初始化init函数');
            this.init = function (conf) {
                var store = conf.store,
                    idOfBtnTbar = buttonsBarConfig && buttonsBarConfig.mIdList,
                    columnModel,
                    tbar, editor, mainPanel, mainPanelConfig;
                this.config = _.extend({}, this.config, conf);

                //处理columns的renderer
                for (var i = 0; i < conf.columns.length; i++) {
                    var colItem = conf.columns[i];
                    if (colItem.mPosiText && colItem.mNegaText) {
                        colItem.renderer = (function (pt, pc, nt, nc) {
                            return function (value) {
                                if (value === true) {
                                    if (pc) {
                                        return '<font style="color:' + pc + '">' + pt + '</font>';
                                    } else {
                                        return pt;
                                    }
                                } else if (value === false) {
                                    if (nc) {
                                        return '<font style="color:' + nc + '">' + nt + '</font>';
                                    } else {
                                        return nt;
                                    }
                                } else {
                                    return '无效值';
                                }
                            };
                        })(colItem.mPosiText, colItem.mPosiColor, colItem.mNegaText, colItem.mNegaColor);

                    }
                }

                /**
                 * 改变所有按钮的状态
                 */
                this.changeAllBtnStatu = function () {
                    var record = this.rsm[getDataMethod]();
                    if (!record) {
                        return;
                    }
                    var needEnable,//改变按钮状态的函数，可以由用户配置，也可以是默认函数
                        initCnf;//初始化配置
                    /**
                     * 改变按钮状态
                     * @param {Ext.Button} btn   按钮
                     * @param {Object}     conf  按钮配置
                     */
                    function setIcon(btn, conf, value) {
                        if (value) {
                            if (conf.mNegaIconCls) {
                                btn.setIcon('');
                                btn.setIconClass(conf.mNegaIconCls);
                            } else if (conf.mNegaIcon) {
                                btn.setIconClass('');
                                btn.setIcon(conf.mNegaIcon);
                            }
                        } else {
                            if (conf.iconCls) {
                                btn.setIcon('');
                                btn.setIconClass(conf.iconCls);
                            } else if (conf.icon) {
                                btn.setIconClass('');
                                btn.setIcon(conf.icon);
                            }
                        }
                    }
                    for (var btnName in idOfBtnTbar) {
                        //添加按钮和刷新按钮不需要改变状态
                        if (BTN_CHECK_EXCEPT.indexOf(btnName) >= 0) {
                            continue;
                        }
                        var btn = Ext.getCmp(idOfBtnTbar[btnName]);
                        if (!btn) { continue; }
                        initCnf = btn.initialConfig;
                        needEnable = btn.initialConfig.whenEnable;
                        if (!needEnable) {
                            //使用默认处理函数来判断状态改变
                            needEnable = defaultNeedEnable;
                        }
                        if (needEnable(record)) {
                            btn.enable();
                        } else {
                            btn.disable();
                        }
                        //如果用户有设置按钮的反状态
                        if (initCnf.mNegaText) {
                            var value = record.get(initCnf.mMapfieldName);
                            if (value === true) {
                                //修改按钮文字
                                btn.setText(initCnf.mNegaText);
                                //修改按钮的点击处理函数
                                btn.setHandler(initCnf.mNegaHandler);
                            } else if (value === false) {
                                btn.setText(initCnf.text);
                                btn.setHandler(initCnf.handler);
                            }
                            setIcon(btn, initCnf, value);
                        }
                    }
                };

                this.getCurrentRecord = function () {
                    return this.rsm[getDataMethod]();
                };
                /**
                 * 设置按钮状态
                 * @param {String} btn    按钮的ID
                 * @param {Boolean} status [description]
                 */
                this.setBtnStatu = function (btn, status) {
                    var ed = status ? 'enable' : 'disable';
                    Ext.getCmp(idOfBtnTbar[btn])[ed]();
                };
                //行编辑器
                if (needRowEditor(that.config.addEditWay)) {
                    console.log('needRowEditor');
                    editor = new Ext.ux.grid.RowEditor({
                        saveText: '保存',
                        cancelText: '取消',
                        clicksToEdit: 2,
                        noClicksToEdit: noNeedClicksToEdit(that.config),
                        errorSummary: false,
                        listeners: {
                            canceledit: function (rowEditor, press) {
                                // 取消时候需要的操作
                                if (!rowEditor.record.get(that.config.idProperty.id) &&
                                     !rowEditor.record.get(that.config.idProperty.idReal)) {
                                    store.removeAt(0);
                                }
                            },
                            afteredit: function (editor, changes, r) {

                                that.fireEvent(eventConfig.SAVE_RECORD_OF_ROWEDITOR, r, changes);
                            }
                        }
                    });
                }
                this.addRecord = function () {
                    //这里使用clone的原因是 或得到的DefaultData会被改变，
                    //下一次add的时候获得的就是上一次改变过的数据
                    var record = new store.recordType(Ext.ux.clone(this.config.defaultData));
                    editor.stopEditing();
                    store.insert(0, record);
                    for (var i = 0, length = conf.columns.length; i < length; i++) {
                        var col = conf.columns[i],
                            colEditor = col.editor;
                        if (colEditor) {
                            //如果字段为添加可编辑，则修改未可编辑状态
                            if (col.mEditMode === _.ADD_EDITABLE) {
                                colEditor.setDisabled(false);
                            }
                        }
                    }
                    editor.startEditing(0);
                };
                /**
                 * 对删除错误之后的界面进行错误修正
                 */
                this.exceptionHandler = function (proxy, type, action, options, res, arg) {
                    var id;
                    var that = this;
                    if (action === 'destroy') {
                        if (arg.lastIndex === store.getTotalCount() - 1) {
                            id = store.getCount();
                        } else {
                            id = arg.lastIndex;
                        }
                        setTimeout(function () {
                            that.rsm.selectRow(id);
                            Ext.getCmp(idOfBtnTbar.delete).enable();
                        }, 400);
                    }
                };
                this.selectRow = function (rowIndex) {
                    this.rsm.selectRow(rowIndex);
                };

                this.selectRecord = function (records) {
                    if (!_.isArray(records)) {
                        records = [records];
                    }
                    this.rsm.selectRecords(records);
                };

                /**
                 * 打开编辑窗口
                 * @param  {Ext.data.Record} record 记录
                 */
                this.openEditWindow = function (record) {
                    //如果窗口已经打开，则直接显示窗口
                    var editWindow = getEditWinByRecId(record.id);
                    if (editWindow) {
                        editWindow.show(true);
                        return;
                    }
                    var windowConfig = that.config.window.edit;
                    //窗口编辑器
                    editWindow = createWindow({
                        id: windowConfig.id + ':' + record.id,
                        title: '编辑记录',
                        width: windowConfig.width,
                        height: windowConfig.height,
                        labelWidth: windowConfig.labelWidth,
                        draggable: true,
                        plain: true,
                        bodyStyle: 'padding:5px',
                        closeAction: 'close',
                        fields: that.config.window.edit.fields,
                        mMultiWin: true,//多窗口 ,自定义的字段全部带上m
                        mEvent: {
                            ok: eventConfig.UPDATE_RECORD
                        }
                    }, record);
                    editWindow.show();
                    editWindow.loadRecord(record);
                    setEditWindow(record.id, editWindow.id);
                    if (lastEditWinPos) {
                        var left = lastEditWinPos[0] + 25,
                            top = lastEditWinPos[1] + 25;
                        console.log('new Position:' + left + ' ' + top);
                        editWindow.setPosition(left, top);
                    }
                    editWindow.on('move', function () {
                        console.log('move');
                        removeWindowFromOrder(this.getId());
                        var id = getLastWindowId(), win;
                        if (id) {
                            win = Ext.getCmp(id);
                            if (win) {
                                lastEditWinPos = win.getPosition();
                            }
                        } else {
                            lastEditWinPos = [
                                (document.documentElement.clientWidth - this.getWidth()) / 2,
                                (document.documentElement.clientHeight - this.getHeight()) / 2
                            ];
                        }
                    });
                    lastEditWinPos = editWindow.getPosition();
                    windows.push(editWindow.getId());
                    console.dir(lastEditWinPos);
                    return editWindow;
                };
                /**
                 * 打开编辑窗口
                 * @param  {Ext.data.Record} record 记录
                 */
                this.openAddWindow = function () {
                    var windowConfig = that.config.window.add;
                    //窗口编辑器
                    var addWindow = createWindow({
                        id: windowConfig.id,
                        title: '添加记录',
                        labelWidth: windowConfig.labelWidth,
                        width: windowConfig.width,
                        height: windowConfig.height,
                        plain: true,
                        bodyStyle: 'padding:5px',
                        closeAction: 'close',
                        fields: windowConfig.fields,
                        mEvent: {
                            ok: eventConfig.SAVE_RECORD
                        }
                    });
                    addWindow.show();
                    return addWindow;
                };

                this.closeWindow = function (type, recordId) {
                    var id = that.config.window[type].id,
                        win;

                    if (!!recordId) {
                        id = that.config.window[type].id + ':' + recordId;
                    }
                    win = Ext.getCmp(id);
                    if (!win) { return; }
                    win.fromSaveBtn = true;//强制关闭
                    win.close();
                };

                this.isWindowOpen = function (type, recordId) {
                    var id = that.config.window[type].id,
                        win;

                    if (!!recordId) {
                        id = that.config.window[type].id + ':' + recordId;
                    }
                    win = Ext.getCmp(id);
                    if (!win) { return false; }
                    return true;
                };
                //生成顶部工具栏
                var listeners;
                if (buttonsBarConfig) {
                    tbar = new Ext.Toolbar(buttonsBarConfig);
                    listeners = {
                        rowSelect: function (/*sm, rowIndex, record*/) {
                            that.changeAllBtnStatu();
                        },
                        rowdeselect: function (/*sm, rowIndex, record*/) {
                            //that.changeAllBtnStatu();
                        }
                    };
                } else {
                    listeners = {};
                }

                if (!this.config.singleSelect) {
                    this.rsm = new Ext.grid.CheckboxSelectionModel({
                        singleSelect: this.config.singleSelect,
                        listeners: listeners
                    });
                    var cmConfig = [this.rsm].concat(conf.columns);
                    columnModel = new Ext.grid.ColumnModel(cmConfig);
                } else {
                    this.rsm = new Ext.grid.RowSelectionModel({
                        singleSelect: this.config.singleSelect,
                        listeners: listeners
                    });
                    columnModel = new Ext.grid.ColumnModel(conf.columns);
                }


                var searchBarConfig = that.config.searchBarConfig,
                    searchBar;
                if (!!searchBarConfig) {
                    searchBarConfig.items.push({
                        text: '搜索',
                        icon: Portal.util.icon('magnifier.png'),
                        handler: function () {
                            var item, key, fieldName, params = {};
                            console.log('search');
                            for (key in searchBarConfig.items) {
                                item = searchBarConfig.items[key];
                                if (item.id) {
                                    fieldName = item.id.substring(item.id.lastIndexOf(':') + 1);
                                    if (fieldName) {
                                        params[fieldName] = Ext.getCmp(item.id).getValue();
                                        if (params[fieldName] === CRUD_FIELD_ALL) {
                                            params[fieldName] = '';
                                        }
                                    }
                                }
                            }
                            that.fireEvent(eventConfig.SEARCH, params);
                        }
                    });
                    searchBarConfig.items.push({
                        text: '筛选',
                        icon: Portal.util.icon('table_lightning.png'),
                        handler: function () {
                            var item, key, fieldName, filterParams = [], param, value;
                            for (key in searchBarConfig.items) {
                                param = {};
                                item = searchBarConfig.items[key];
                                if (item.id) {
                                    fieldName = item.id.substring(item.id.lastIndexOf(':') + 1);
                                    if (fieldName) {
                                        value = Ext.getCmp(item.id).getValue();
                                        if (value === CRUD_FIELD_ALL) {
                                            value = '';
                                        } else if (value === TRUE) {
                                            value = true;
                                        } else if (value === FALSE) {
                                            value = false;
                                        }
                                        if (!_.isEmpty(value)) {
                                            param = {
                                                property: fieldName,
                                                value: value,
                                                anyMatch: true,
                                                caseSensitive: true
                                            };
                                            filterParams.push(param);
                                        }

                                    }
                                }
                            }
                            that.fireEvent(eventConfig.FILTER, filterParams);
                        }
                    });

                    searchBar = new Ext.Toolbar(searchBarConfig);
                }
                mainPanelConfig = {
                    id: conf.id + ':grid',
                    store: store,
                    loadMask: true,
                    border: false,
                    closable: true,
                    autoScroll: true,
                    enableHdMenu: false,
                    sm: this.rsm,
                    cm: columnModel,
                    bbar: this.config.pageToolbarConfig ?
                        new Ext.PagingToolbar(this.config.pageToolbarConfig)
                            : null,
                    listeners: {
                        viewready: function () {
                            that.loadResMask = new Ext.LoadMask(mainPanel.body.dom, {msg: "等一下下，加载资源中"});
                            that.fireEvent(eventConfig.VIEW_READY, that);
                        },
                        render: function () {
                            if (searchBar && tbar && !tbar.used) {
                                //如果有搜索栏则在搜索栏的下面加上工具栏
                                tbar.render(this.tbar);
                            }
                        },
                        destroy: function () {
                            console.log('Grid [Ext.grid.GridPanel]: Destroy');
                        },
                        rowdblclick: function (grid, rowIndex) {
                            var columns = that.config.columns;
                            console.log('Gird [Ext.grid.GridPanel]: Row double click');
                            var record = that.rsm.getSelected();
                            if (that.config.needEdit) {
                                for (var i = 0, length = columns.length; i < length; i++) {
                                    var col = columns[i],
                                        colEditor = col.editor;
                                    if (colEditor) {
                                        //如果不可编辑, rowEditor的字段变为disable，不可编辑
                                        if (col.mEditMode === _.ADD_EDITABLE) {
                                            colEditor.setDisabled(true);
                                        }
                                    }
                                }
                                that.fireEvent(eventConfig.ROW_DBL_CLICK, record);
                            }
                        }
                    }
                };
                mainPanelConfig.tbar =  searchBar || tbar;
                mainPanelConfig.tbar.used = true;
                if (needRowEditor(that.config.addEditWay)) {
                    mainPanelConfig.plugins = [editor];
                }
                mainPanel = new Ext.grid.GridPanel(mainPanelConfig);

                return mainPanel;
            };
            console.info('创建view对象');
        },
        error: function (msg) {
            Ext.Msg.alert('错误', msg);
        },
        info: function (msg) {
            Ext.example.msg('成功', msg);
        },
        alert: function (msg) {
            Ext.Msg.alert('警告', msg);
        },
        showLoadResMask: function () {
            this.loadResMask.show();
        },
        hideLoadResMask: function () {
            this.loadResMask.hide();
        },
        /**
         * 加载store的数据，根据加载好的数据微调用户界面
         */
        adjustUI: function adjustUI() {
            //调整搜索栏子项的宽度
            var sbItms = this.config.searchBarConfig.items;
            Ext.each(sbItms, function (itm) {
                var store,
                    data = [],
                    width,
                    displayField;
                if (_.isObject(itm)) {
                    store = itm.store;
                    displayField = itm.displayField;
                    if (store) {
                        store.each(function (rec, i) {
                            var text = rec.get(displayField),
                                width = _.calTextWidth(text);
                            data.push(width);
                        });
                        width = _.getMean(data);
                        itm.setWidth(width + 35);
                    }
                }
            });
        }
    });
    return View;
});