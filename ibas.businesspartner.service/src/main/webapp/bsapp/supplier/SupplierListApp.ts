/**
 * @license
 * Copyright color-coding studio. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0
 * that can be found in the LICENSE file at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as ibas from "ibas/index";
import * as bo from "../../borep/bo/index";
import { BORepositoryBusinessPartner } from "../../borep/BORepositories";
import { DataConverter4bp } from "../../borep/DataConverters";
import { SupplierViewApp } from "./SupplierViewApp";
import { SupplierEditApp } from "./SupplierEditApp";

/** 列表应用-业务伙伴-供应商 */
export class SupplierListApp extends ibas.BOListApplication<ISupplierListView, bo.Supplier> {

    /** 应用标识 */
    static APPLICATION_ID: string = "a6ebf9a9-b299-4c77-b033-3c1d2a473cab";
    /** 应用名称 */
    static APPLICATION_NAME: string = "businesspartner_app_supplier_list";
    /** 业务对象编码 */
    static BUSINESS_OBJECT_CODE: string = bo.Supplier.BUSINESS_OBJECT_CODE;
    /** 构造函数 */
    constructor() {
        super();
        this.id = SupplierListApp.APPLICATION_ID;
        this.name = SupplierListApp.APPLICATION_NAME;
        this.boCode = SupplierListApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
    }
    /** 注册视图 */
    protected registerView(): void {
        super.registerView();
        // 其他事件
        this.view.editDataEvent = this.editData;
        this.view.deleteDataEvent = this.deleteData;
    }
    /** 视图显示后 */
    protected viewShowed(): void {
        // 视图加载完成
    }
    /** 查询数据 */
    protected fetchData(criteria: ibas.ICriteria): void {
        this.busy(true);
        let that: this = this;
        let boRepository: BORepositoryBusinessPartner = new BORepositoryBusinessPartner();
        boRepository.fetchSupplier({
            criteria: criteria,
            onCompleted(opRslt: ibas.IOperationResult<bo.Supplier>): void {
                try {
                    if (opRslt.resultCode !== 0) {
                        throw new Error(opRslt.message);
                    }
                    that.view.showData(opRslt.resultObjects);
                    that.busy(false);
                } catch (error) {
                    that.messages(error);
                }
            }
        });
        this.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("sys_shell_fetching_data"));
    }
    /** 新建数据 */
    protected newData(): void {
        let app: SupplierEditApp = new SupplierEditApp();
        app.navigation = this.navigation;
        app.viewShower = this.viewShower;
        app.run();
    }
    /** 查看数据，参数：目标数据 */
    protected viewData(data: bo.Supplier): void {
        // 检查目标数据
        if (ibas.objects.isNull(data)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_please_chooose_data",
                ibas.i18n.prop("sys_shell_data_view")
            ));
            return;
        }
        let app: SupplierViewApp = new SupplierViewApp();
        app.navigation = this.navigation;
        app.viewShower = this.viewShower;
        app.run(data);

    }
    /** 编辑数据，参数：目标数据 */
    protected editData(data: bo.Supplier): void {
        // 检查目标数据
        if (ibas.objects.isNull(data)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_please_chooose_data",
                ibas.i18n.prop("sys_shell_data_edit")
            ));
            return;
        }
        let app: SupplierEditApp = new SupplierEditApp();
        app.navigation = this.navigation;
        app.viewShower = this.viewShower;
        app.run(data);
    }
    /** 删除数据，参数：目标数据集合 */
    protected deleteData(data: bo.Supplier): void {
        // 检查目标数据
        if (ibas.objects.isNull(data)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_please_chooose_data",
                ibas.i18n.prop("sys_shell_data_delete")
            ));
            return;
        }
        let beDeleteds:ibas.ArrayList<bo.Supplier> = new ibas.ArrayList<bo.Supplier>();
        if (data instanceof Array ) {
            for (let item of data) {
                if (ibas.objects.instanceOf(item, bo.Supplier)) {
                    item.delete();
                    beDeleteds.add(item);
                }
            }
        }
        // 没有选择删除的对象
        if (beDeleteds.length === 0) {
            return;
        }
        let that: this = this;
        this.messages({
            type: ibas.emMessageType.QUESTION,
            title: ibas.i18n.prop(this.name),
            message: ibas.i18n.prop("sys_shell_whether_to_delete", beDeleteds.length),
            actions: [ibas.emMessageAction.YES, ibas.emMessageAction.NO],
            onCompleted(action: ibas.emMessageAction): void {
                if (action === ibas.emMessageAction.YES) {
                    try {
                        let boRepository: BORepositoryBusinessPartner = new BORepositoryBusinessPartner();
                        let saveMethod: Function = function(beSaved: bo.Supplier):void {
                            boRepository.saveSupplier({
                                beSaved: beSaved,
                                onCompleted(opRslt: ibas.IOperationResult<bo.Supplier>): void {
                                    try {
                                        if (opRslt.resultCode !== 0) {
                                            throw new Error(opRslt.message);
                                        }
                                        // 保存下一个数据
                                        let index: number = beDeleteds.indexOf(beSaved) + 1;
                                        if (index > 0 && index < beDeleteds.length) {
                                            saveMethod(beDeleteds[index]);
                                        } else {
                                            // 处理完成
                                            that.busy(false);
                                            that.messages(ibas.emMessageType.SUCCESS,
                                            ibas.i18n.prop("sys_shell_data_delete") + ibas.i18n.prop("sys_shell_sucessful"));
                                        }
                                    } catch (error) {
                                        that.messages(ibas.emMessageType.ERROR,
                                            ibas.i18n.prop("sys_shell_data_delete_error", beSaved, error.message));
                                    }
                                }
                            });
                            that.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("sys_shell_data_deleting", beSaved));
                        };
                        that.busy(true);
                        // 开始保存
                        saveMethod(beDeleteds.firstOrDefault());
                    } catch (error) {
                        that.busy(false);
                        that.messages(error);
                    }
                }
            }
        });
    }
    /** 获取服务的契约 */
    protected getServiceProxies(): ibas.IServiceProxy<ibas.IServiceContract>[] {
        return [
            new ibas.BOListServiceProxy({
                data: this.view.getSelecteds(),
                converter: new DataConverter4bp()
            })
        ];
    }
}
/** 视图-业务伙伴-供应商 */
export interface ISupplierListView extends ibas.IBOListView {
    /** 编辑数据事件，参数：编辑对象 */
    editDataEvent: Function;
    /** 删除数据事件，参数：删除对象集合 */
    deleteDataEvent: Function;
    /** 显示数据 */
    showData(datas: bo.Supplier[]): void;
    /** 获取选择的数据 */
    getSelecteds(): bo.Supplier[];
}
