import {Component} from '@angular/core';
import {FormBuilder, Validators} from '@angular/common';
import {ionicBootstrap} from '../../../../../src';


@Component({
  templateUrl: 'main.html',
  providers: [FormBuilder]
})
class E2EPage {
  relationship: string = 'enemies';
  modelStyle: string = 'B';
  appType: string = 'free';
  icons: string = 'camera';
  isDisabled: boolean = true;
  myForm: any;

  constructor(fb: FormBuilder) {
    this.myForm = fb.group({
      mapStyle: ['active', Validators.required]
    });
  }

  toggleDisabled() {
    this.isDisabled = !this.isDisabled;
  }

  onSegmentChanged(segmentButton) {
    console.log("Segment changed to", segmentButton.value);
  }

  onSegmentSelected(segmentButton) {
    console.log("Segment selected", segmentButton.value);
  }

  doSubmit(ev) {
    console.log('Submitting form', this.myForm.value);
    ev.preventDefault();
  }
}

@Component({
  template: '<ion-nav [root]="root"></ion-nav>'
})
class E2EApp {
  root = E2EPage;
}

ionicBootstrap(E2EApp);
