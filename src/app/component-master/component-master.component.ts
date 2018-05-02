import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators } from '@angular/forms';
import { dataService } from '../services/dataService/data.service';
import { ComponentMasterServiceService } from './../services/ProviderAdminServices/component-master-service.service';
import { ProviderAdminRoleService } from '../services/ProviderAdminServices/state-serviceline-role.service';
import { ConfirmationDialogsService } from '../services/dialog/confirmation.service';

@Component({
  selector: 'app-component-master',
  templateUrl: './component-master.component.html',
  styleUrls: ['./component-master.component.css']
})
export class ComponentMasterComponent implements OnInit {


  state: any;
  service: any;

  states: any;
  services: any;
  disableSelection: boolean = false;

  editMode: any = false;
  serviceProviderID: any;

  STATE_ID: any;
  SERVICE_ID: any;
  providerServiceMapID: any;
  unfilled: Boolean = false;
  editProcedure: any;
  componentForm: FormGroup;
  componentList: any;
  filteredComponentList: any;
  tableMode: boolean = true;
  saveEditMode: boolean = false;
  alreadyExist: boolean = false;

  constructor(private commonDataService: dataService,
    private fb: FormBuilder,
    private alertService: ConfirmationDialogsService,
    public providerAdminRoleService: ProviderAdminRoleService,
    private componentMasterServiceService: ComponentMasterServiceService) {
    this.states = [];
    this.services = [];

  }

  ngOnInit() {

    this.initiateForm();
    console.log(this.componentForm)
  }
  /**
   * Initiate Form
  */
  initiateForm() {
    // By Default, it'll be set as enabled
    this.componentForm = this.initComponentForm();
    this.componentForm.patchValue({
      disable: false
    })
    this.componentList = [];
    this.filteredComponentList = [];
    // provide service provider ID, (As of now hardcoded, but to be fetched from login response)
    this.serviceProviderID = (this.commonDataService.service_providerID).toString();


    this.providerAdminRoleService.getStates(this.serviceProviderID)
      .subscribe(response => {
        this.states = this.successhandeler(response);

      }
      );

  }

  initComponentForm(): FormGroup {
    return this.fb.group({
      testComponentID: null,
      testComponentName: [null, Validators.required],
      testComponentDesc: null,
      inputType: null,
      range_max: null,
      range_min: null,
      range_normal_max: null,
      range_normal_min: null,
      measurementUnit: null,
      modifiedBy: null,
      createdBy: null,
      providerServiceMapID: null,
      compOpt: this.fb.array([
        this.initComp()
      ]),
      deleted: null
    })
  }

  initComp(): FormGroup {
    return this.fb.group({
      name: null
    });
  }

  myErrorStateMatcher(control, form) {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.touched || isSubmitted));
  }
  get testComponentName() {
    return this.componentForm.controls['testComponentName'].value;
  }
  componentUnique() {    
    this.alreadyExist = false;
    console.log("filteredComponentList", this.filteredComponentList);
    let count = 0;
    for (let a = 0; a < this.filteredComponentList.length; a++) {      
      if (this.filteredComponentList[a].testComponentName === this.testComponentName) {
        count = count + 1;
        console.log("count", count);        
        if (count > 0) {
          this.alreadyExist = true;
        }
      }
    }
  }

  addID(index) {
    console.log('index here', index)
    if (index == 1 && this.componentForm.value.inputType == 'RadioButton') {
      this.alertService.alert('We can not have more than 2 options for Radio Button, Choose \'Drop Down\' List Instead ');
    } else {
      const val = <FormArray>this.componentForm.controls['compOpt'];
      val.push(this.initComp());
    }
  }


  removeID(i) {
    const val = <FormArray>this.componentForm.controls['compOpt'];
    val.removeAt(i);
  }

  /**
   * Get Details of Procedures available for this Service PRovider
  */
  getAvailableComponent() {

    this.componentMasterServiceService.getCurrentComponents(this.providerServiceMapID)
      .subscribe((res) => { this.componentList = this.successhandeler(res); this.filteredComponentList = this.successhandeler(res); });

  }

  selected() {
    console.log(this.componentForm.value)
    this.componentForm.patchValue({
      range_max: null,
      range_min: null,
      range_normal_max: null,
      range_normal_min: null,
      measurementUnit: null,
    })
    this.componentForm.setControl('compOpt', new FormArray([this.initComp()]))
  }
  back() {
    this.alertService.confirm('Confirm', "Do you really want to cancel? Any unsaved data would be lost").subscribe(res => {
      if (res) {
        this.showTable();
        this.alreadyExist =false;
      }
    })
  }
  showTable() {
    this.tableMode = true;
    this.saveEditMode = false;
  }
  showForm() {
    this.tableMode = false;
    this.saveEditMode = true;
  }
  saveComponent() {
    const apiObject = this.objectManipulate();
    delete apiObject.modifiedBy;
    delete apiObject.deleted;

    console.log(JSON.stringify(apiObject, null, 4), 'apiObject');
    if (apiObject) {
      apiObject.createdBy = this.commonDataService.uname;

      this.componentMasterServiceService.postComponentData(apiObject)
        .subscribe((res) => {
          console.log(res, 'resonse here');
          this.componentList.unshift(res);
          this.resetForm();
          this.alertService.alert('Saved successfully', 'success');
        })

    }
  }

  /**
   * Update Changes for The Component
  */
  updateComponent() {
    const apiObject = this.objectManipulate();
    delete apiObject.createdBy;

    console.log(apiObject, 'apiObject');
    if (apiObject) {
      apiObject['modifiedBy'] = this.commonDataService.uname;
      apiObject['testComponentID'] = this.editMode;

      this.componentMasterServiceService.updateComponentData(apiObject)
        .subscribe((res) => {
          console.log(res, 'resonse here');
          this.updateList(res);
          this.resetForm();
          this.alertService.alert('Updated successfully', 'success');
        })

    }
  }


  resetForm() {
    this.componentForm.reset();
    this.editMode = false;
    this.componentForm.setControl('compOpt', new FormArray([this.initComp()]))
  }



  /**
   * Manipulate Form Object to as per API Need
  */
  objectManipulate() {
    const obj = Object.assign({}, this.componentForm.value);

    if (!obj.testComponentName || !obj.testComponentDesc || !obj.inputType) {
      this.alertService.alert('Please fill all mandatory details');
      return false
    } else {
      if (obj.inputType == 'TextBox') {
        if (!obj.range_max ||
          !obj.range_min ||
          !obj.range_normal_max ||
          !obj.range_normal_min ||
          !obj.measurementUnit) {
          this.alertService.alert('Please add all input limits');
          return false
        } else {
          obj.compOpt = null;
          this.unfilled = false;
        }
      } else if (obj.inputType == 'DropDown' || obj.inputType == 'RadioButton') {

        if (obj.compOpt.length < 2) {
          this.alertService.alert('You need to add at least 2 options.');
          return false;

        } else if (obj.compOpt.length == 2 && obj.inputType == 'DropDown') {
          this.alertService.alert('You\'ve added only 2 options, please choose \'Radio Button\' as Input type.');
          return false;
        } else {
          let index = 0;
          obj.compOpt.forEach(element => {
            console.log(element, 'element here', element.name);
            if (!element.name || element.name == undefined || element.name == null || element.name == '') {
              index++;
            }
          });
          if (index) {
            this.alertService.alert('Please Fill details for all Component Properties.');
            return false;
          }
        }

      }
      obj.providerServiceMapID = this.providerServiceMapID;
      return obj;
    }

  }



  setProviderServiceMapID(ProviderServiceMapID) {
    this.commonDataService.provider_serviceMapID = ProviderServiceMapID;
    this.providerServiceMapID = ProviderServiceMapID;

    console.log('psmid', ProviderServiceMapID);
    console.log(this.service);
    this.getAvailableComponent();
  }

  getServices(stateID) {
    console.log(this.serviceProviderID, stateID);
    this.providerAdminRoleService.getServices(this.serviceProviderID, stateID)
      .subscribe(response => this.servicesSuccesshandeler(response));
  }


  // For Service List
  servicesSuccesshandeler(response) {
    this.service = '';
    this.services = response;
    this.providerServiceMapID = null;

  }
  // For State List
  successhandeler(response) {
    return response;
  }


  filterComponentList(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredComponentList = this.componentList;
    } else {
      this.filteredComponentList = [];
      this.componentList.forEach((item) => {
        for (let key in item) {
          let value: string = '' + item[key];
          if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
            this.filteredComponentList.push(item); break;
          }
        }
      });
    }

  }


  /**
   *Enable/ Disable Component
   *
   */
  toggleComponent(componentID, index, toggle) {
    let text;
    if (!toggle)
      text = "Are you sure you want to Activate?";
    else
      text = "Are you sure you want to Deactivate?";
    this.alertService.confirm('Confirm', text).subscribe(response => {
      if (response) {
        console.log(componentID, index, 'index');
        this.componentMasterServiceService.toggleComponent({ componentID: componentID, deleted: toggle })
          .subscribe((res) => {
            console.log(res, 'changed');
            if (res) {
              if (!toggle)
                this.alertService.alert("Activated successfully", 'success');
              else
                this.alertService.alert("Deactivated successfully", 'success');
              this.updateList(res);
            }
          })
      }
    })

  }

  updateList(res) {
    this.componentList.forEach((element, i) => {
      console.log(element, 'elem', res, 'res')
      if (element.testComponentID == res.testComponentID) {
        this.componentList[i] = res;
      }
    });

    this.filteredComponentList.forEach((element, i) => {
      console.log(element, 'elem', res, 'res')
      if (element.testComponentID == res.testComponentID) {
        this.filteredComponentList[i] = res;
      }

    });

  }

  configComponent(item, i) {
    this.componentMasterServiceService.getCurrentComponentForEdit(item.testComponentID)
      .subscribe((res) => { this.loadDataToEdit(res) })
    console.log(JSON.stringify(item, null, 4), 'item to patch');
    console.log(this.componentForm, 'form here');
    // this.editMode = item.testComponentID;
    //     this.editMode = 21;
    //     this.componentForm.patchValue({
    //       testComponentID: 21,
    //       testComponentName: 'something',
    //       testComponentDesc: 'some description',
    //       range_normal_max: null,
    //       range_normal_min: null,
    //       range_min: null,
    //       range_max: null,
    //       measurementUnit: null,
    //       inputType: 'DropDown',

    //     });

    //     let id = [{ name: 'sdddd' },
    //     { name: 'cccc' }];

    //     const val = <FormArray>this.componentForm.controls['compOpt'];
    //     val.removeAt(0);
    // id.forEach((element) => {

    //   val.push(this.fb.group(element));
    // })
    //  this.componentForm.controls['compOpt'].push
  }


  loadDataToEdit(res) {
    console.log(JSON.stringify(res, null, 4), 'res');
    if (res) {
      this.editMode = res.testComponentID;
      this.componentForm.patchValue(res);
      if (res.inputType != 'TextBox') {
        console.log('11111');
        const options = res.compOpt;
        const val = <FormArray>this.componentForm.controls['compOpt'];
        val.removeAt(0);
        // this.componentForm.setControl('compOpt', new FormArray([]))
        console.log(val);
        options.forEach((element) => {
          val.push(this.fb.group(element));
          console.log(val);
        })
      }
    }

  }

}

