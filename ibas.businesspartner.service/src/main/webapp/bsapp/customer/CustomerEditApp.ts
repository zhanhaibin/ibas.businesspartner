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

/** 编辑应用-业务伙伴-客户 */
export class CustomerEditApp extends ibas.BOEditApplication<ICustomerEditView, bo.Customer> {

    /** 应用标识 */
    static APPLICATION_ID: string = "a2473f05-9f90-4770-9644-a74c0b777fcc";
    /** 应用名称 */
    static APPLICATION_NAME: string = "businesspartner_app_customer_edit";
    /** 业务对象编码 */
    static BUSINESS_OBJECT_CODE: string = bo.Customer.BUSINESS_OBJECT_CODE;
    /** 构造函数 */
    constructor() {
        super();
        this.id = CustomerEditApp.APPLICATION_ID;
        this.name = CustomerEditApp.APPLICATION_NAME;
        this.boCode = CustomerEditApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
    }
    /** 注册视图 */
    protected registerView(): void {
        super.registerView();
        // 其他事件
        this.view.deleteDataEvent = this.deleteData;
        this.view.createDataEvent = this.createData;
        this.view.chooseBusinessPartnerGroupEvent = this.chooseBusinessPartnerGroup;
        this.view.chooseBusinessPartnerContactPersonEvent = this.chooseBusinessPartnerContactPerson;
    }
    /** 视图显示后 */
    protected viewShowed(): void {
        // 视图加载完成
        if (ibas.objects.isNull(this.editData)) {
            // 创建编辑对象实例
            this.editData = new bo.Customer();
            this.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_data_created_new"));
        }
        this.view.showCustomer(this.editData);
    }
    /** 运行,覆盖原方法 */
    run(...args: any[]): void {
        let that: this = this;
        if (ibas.objects.instanceOf(arguments[0], bo.Customer)) {
            // 尝试重新查询编辑对象
            let criteria: ibas.ICriteria = arguments[0].criteria();
            if (!ibas.objects.isNull(criteria) && criteria.conditions.length > 0) {
                // 有效的查询对象查询
                let boRepository: BORepositoryBusinessPartner = new BORepositoryBusinessPartner();
                boRepository.fetchCustomer({
                    criteria: criteria,
                    onCompleted(opRslt: ibas.IOperationResult<bo.Customer>): void {
                        let data: bo.Customer;
                        if (opRslt.resultCode === 0) {
                            data = opRslt.resultObjects.firstOrDefault();
                        }
                        if (ibas.objects.instanceOf(data, bo.Customer)) {
                            // 查询到了有效数据
                            that.editData = data;
                            that.show();
                        } else {
                            // 数据重新检索无效
                            that.messages({
                                type: ibas.emMessageType.WARNING,
                                message: ibas.i18n.prop("sys_shell_data_deleted_and_created"),
                                onCompleted(): void {
                                    that.show();
                                }
                            });
                        }
                    }
                });
                // 开始查询数据
                return;
            }
        }
        super.run();
    }
    /** 待编辑的数据 */
    protected editData: bo.Customer;
    /** 保存数据 */
    protected saveData(): void {
        let that: this = this;
        let boRepository: BORepositoryBusinessPartner = new BORepositoryBusinessPartner();
        boRepository.saveCustomer({
            beSaved: this.editData,
            onCompleted(opRslt: ibas.IOperationResult<bo.Customer>): void {
                try {
                    that.busy(false);
                    if (opRslt.resultCode !== 0) {
                        throw new Error(opRslt.message);
                    }
                    if (opRslt.resultObjects.length === 0) {
                        // 删除成功，释放当前对象
                        that.messages(ibas.emMessageType.SUCCESS,
                            ibas.i18n.prop("sys_shell_data_delete") + ibas.i18n.prop("sys_shell_sucessful"));
                        that.editData = undefined;
                    } else {
                        // 替换编辑对象
                        that.editData = opRslt.resultObjects.firstOrDefault();
                        that.messages(ibas.emMessageType.SUCCESS,
                            ibas.i18n.prop("sys_shell_data_save") + ibas.i18n.prop("sys_shell_sucessful"));
                    }
                    // 刷新当前视图
                    that.viewShowed();
                } catch (error) {
                    that.messages(error);
                }
            }
        });
        this.busy(true);
        this.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("sys_shell_saving_data"));
    }
    /** 删除数据 */
    protected deleteData(): void {
        let that: this = this;
        this.messages({
            type: ibas.emMessageType.QUESTION,
            title: ibas.i18n.prop(this.name),
            message: ibas.i18n.prop("sys_whether_to_delete"),
            actions: [ibas.emMessageAction.YES, ibas.emMessageAction.NO],
            onCompleted(action: ibas.emMessageAction): void {
                if (action === ibas.emMessageAction.YES) {
                    that.editData.delete();
                    that.saveData();
                }
            }
        });
    }
    /** 新建数据，参数1：是否克隆 */
    protected createData(clone: boolean): void {
        let that: this = this;
        let createData: Function = function (): void {
            if (clone) {
                // 克隆对象
                that.editData = that.editData.clone();
                that.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_data_cloned_new"));
                that.viewShowed();
            } else {
                // 新建对象
                that.editData = new bo.Customer();
                that.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_data_created_new"));
                that.viewShowed();
            }
        };
        if (that.editData.isDirty) {
            this.messages({
                type: ibas.emMessageType.QUESTION,
                title: ibas.i18n.prop(this.name),
                message: ibas.i18n.prop("sys_data_not_saved_whether_to_continue"),
                actions: [ibas.emMessageAction.YES, ibas.emMessageAction.NO],
                onCompleted(action: ibas.emMessageAction): void {
                    if (action === ibas.emMessageAction.YES) {
                        createData();
                    }
                }
            });
        } else {
            createData();
        }
    }
    private chooseBusinessPartnerGroup(): void {
        let that: this = this;
        ibas.servicesManager.runChooseService<bo.BusinessPartnerGroup>({
            boCode: bo.BusinessPartnerGroup.BUSINESS_OBJECT_CODE,
            criteria: [
                new ibas.Condition(bo.BusinessPartnerGroup.PROPERTY_DELETED_NAME,
                    ibas.emConditionOperation.EQUAL, "N"),
                new ibas.Condition(bo.BusinessPartnerGroup.PROPERTY_CODE_NAME,
                    ibas.emConditionOperation.NOT_EQUAL, ibas.strings.valueOf(this.editData.group)),
            ],
            onCompleted(selecteds: ibas.List<bo.BusinessPartnerGroup>): void {
                that.editData.group = selecteds.firstOrDefault().code;
            }
        });
    }
    private chooseBusinessPartnerContactPerson(): void {
        let that: this = this;
        ibas.servicesManager.runChooseService<bo.ContactPerson>({
            boCode: bo.ContactPerson.BUSINESS_OBJECT_CODE,
            criteria: [
                new ibas.Condition(bo.ContactPerson.PROPERTY_ACTIVATED_NAME,
                    ibas.emConditionOperation.EQUAL, "Y"),
                 new ibas.Condition(bo.ContactPerson.PROPERTY_NAME_NAME,
                     ibas.emConditionOperation.NOT_EQUAL, ibas.strings.valueOf(this.editData.contactPerson)),
            ],
            onCompleted(selecteds: ibas.List<bo.ContactPerson>): void {
                that.editData.contactPerson = selecteds.firstOrDefault().name;
                that.editData.telephone1 = selecteds.firstOrDefault().telephone1;
                that.editData.telephone2 = selecteds.firstOrDefault().telephone2;
                that.editData.mobilePhone = selecteds.firstOrDefault().mobilePhone;
                that.editData.faxNumber = selecteds.firstOrDefault().fax;
            }
        });
    }
}
/** 视图-业务伙伴-客户 */
export interface ICustomerEditView extends ibas.IBOEditView {
    /** 显示数据 */
    showCustomer(data: bo.Customer): void;
    /** 删除数据事件 */
    deleteDataEvent: Function;
    /** 新建数据事件，参数1：是否克隆 */
    createDataEvent: Function;
    /** 选择客户组事件 */
    chooseBusinessPartnerGroupEvent: Function;
    /** 选择客户联系人事件 */
    chooseBusinessPartnerContactPersonEvent: Function;
}
