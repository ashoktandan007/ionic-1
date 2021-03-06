import {Component, Renderer, ElementRef, HostListener, ViewEncapsulation} from '@angular/core';

import {Animation} from '../../animations/animation';
import {Transition, TransitionOptions} from '../../transitions/transition';
import {Config} from '../../config/config';
import {Icon} from '../icon/icon';
import {isPresent} from '../../util/util';
import {Key} from '../../util/key';
import {NavParams} from '../nav/nav-params';
import {ViewController} from '../nav/view-controller';


/**
 * @name ActionSheet
 * @description
 * An Action Sheet is a dialog that lets the user choose from a set of
 * options. It appears on top of the app's content, and must be manually
 * dismissed by the user before they can resume interaction with the app.
 * Dangerous (destructive) options are made obvious in `ios` mode. There are easy
 * ways to cancel out of the action sheet, such as tapping the backdrop or
 * hitting the escape key on desktop.
 *
 * An action sheet is created from an array of `buttons`, with each button
 * including properties for its `text`, and optionally a `handler` and `role`.
 * If a handler returns `false` then the action sheet will not be dismissed. An
 * action sheet can also optionally have a `title`, `subTitle` and an `icon`.
 *
 * A button's `role` property can either be `destructive` or `cancel`. Buttons
 * without a role property will have the default look for the platform. Buttons
 * with the `cancel` role will always load as the bottom button, no matter where
 * they are in the array. All other buttons will be displayed in the order they
 * have been added to the `buttons` array. Note: We recommend that `destructive`
 * buttons are always the first button in the array, making them the top button.
 * Additionally, if the action sheet is dismissed by tapping the backdrop, then
 * it will fire the handler from the button with the cancel role.
 *
 * You can pass all of the action sheet's options in the first argument of
 * the create method: `ActionSheet.create(opts)`. Otherwise the action sheet's
 * instance has methods to add options, like `setTitle()` or `addButton()`.
 *
 * @usage
 * ```ts
 * constructor(nav: NavController) {
 *   this.nav = nav;
 * }
 *
 * presentActionSheet() {
 *   let actionSheet = ActionSheet.create({
 *     title: 'Modify your album',
 *     buttons: [
 *       {
 *         text: 'Destructive',
 *         role: 'destructive',
 *         handler: () => {
 *           console.log('Destructive clicked');
 *         }
 *       },
 *       {
 *         text: 'Archive',
 *         handler: () => {
 *           console.log('Archive clicked');
 *         }
 *       },
 *       {
 *         text: 'Cancel',
 *         role: 'cancel',
 *         handler: () => {
 *           console.log('Cancel clicked');
 *         }
 *       }
 *     ]
 *   });
 *
 *   this.nav.present(actionSheet);
 * }
 * ```
 *
 *
 * ### Dismissing And Async Navigation
 *
 * After an action sheet has been dismissed, the app may need to also transition
 * to another page depending on the handler's logic. However, because multiple
 * transitions were fired at roughly the same time, it's difficult for the
 * nav controller to cleanly animate multiple transitions that may
 * have been kicked off asynchronously. This is further described in the
 * [`Nav Transition Promises`](../../nav/NavController/#nav-transition-promises) section. For action sheets,
 * this means it's best to wait for the action sheet to finish its transition
 * out before starting a new transition on the same nav controller.
 *
 * In the example below, after the button has been clicked, its handler
 * waits on async operation to complete, *then* it uses `pop` to navigate
 * back a page in the same stack. The potential problem is that the async operation
 * may have been completed before the action sheet has even finished its transition
 * out. In this case, it's best to ensure the action sheet has finished its transition
 * out first, *then* start the next transition.
 *
 * ```ts
 * let actionSheet = ActionSheet.create({
 *   title: 'Hello',
 *   buttons: [{
 *     text: 'Ok',
 *     handler: () => {
 *       // user has clicked the action sheet button
 *       // begin the action sheet's dimiss transition
 *       let navTransition = actionSheet.dismiss();
 *
 *       // start some async method
 *       someAsyncOperation().then(() => {
 *         // once the async operation has completed
 *         // then run the next nav transition after the
 *         // first transition has finished animating out
 *
 *         navTransition.then(() => {
 *           this.nav.pop();
 *         });
 *       });
 *       return false;
 *     }
 *   }]
 * });
 *
 * this.nav.present(actionSheet);
 * ```
 *
 * It's important to note that the handler returns `false`. A feature of
 * button handlers is that they automatically dismiss the action sheet when their button
 * was clicked, however, we'll need more control regarding the transition. Because
 * the handler returns `false`, then the action sheet does not automatically dismiss
 * itself. Instead, you now have complete control of when the action sheet has finished
 * transitioning, and the ability to wait for the action sheet to finish transitioning
 * out before starting a new transition.
 *
 *
 * @demo /docs/v2/demos/action-sheet/
 * @see {@link /docs/v2/components#action-sheets ActionSheet Component Docs}
 */
export class ActionSheet extends ViewController {

  constructor(opts: ActionSheetOptions = {}) {
    opts.buttons = opts.buttons || [];
    opts.enableBackdropDismiss = isPresent(opts.enableBackdropDismiss) ? !!opts.enableBackdropDismiss : true;

    super(ActionSheetCmp, opts);
    this.isOverlay = true;

    // by default, actionsheets should not fire lifecycle events of other views
    // for example, when an actionsheets enters, the current active view should
    // not fire its lifecycle events because it's not conceptually leaving
    this.fireOtherLifecycles = false;
  }

   /**
   * @private
   */
   getTransitionName(direction: string) {
     let key = 'actionSheet' + (direction === 'back' ? 'Leave' : 'Enter');
     return this._nav && this._nav.config.get(key);
   }

   /**
    * @param {string} title Action sheet title
    */
   setTitle(title: string) {
     this.data.title = title;
   }

   /**
    * @param {string} subTitle Action sheet subtitle
    */
   setSubTitle(subTitle: string) {
     this.data.subTitle = subTitle;
   }

   /**
    * @param {object} button Action sheet button
    */
   addButton(button: any) {
     this.data.buttons.push(button);
   }

   /**
    * Open an action sheet with the following options
    *
    * | Option                | Type       | Description                                                     |
    * |-----------------------|------------|-----------------------------------------------------------------|
    * | title                 |`string`    | The title for the actionsheet                                   |
    * | subTitle              |`string`    | The sub-title for the actionsheet                               |
    * | cssClass              |`string`    | An additional class for custom styles                           |
    * | enableBackdropDismiss |`boolean`   | If the actionsheet should close when the user taps the backdrop |
    * | buttons               |`array<any>`| An array of buttons to display                                  |
    *
    * For the buttons:
    *
    * | Option   | Type     | Description                                                                                                                                      |
    * |----------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------|
    * | text     | `string` | The buttons text                                                                                                                                 |
    * | icon     | `icon`   | The buttons icons                                                                                                                                |
    * | handler  | `any`    | An express the button should evaluate                                                                                                            |
    * | cssClass | `string` | An additional class for custom styles                                                                                                            |
    * | role     | `string` | How the button should be displayed, `destructive` or `cancel`. If not role is provided, it will display the button without any additional styles |
    *
    *
    *
    * @param {object} opts Action sheet options
    */
   static create(opts: ActionSheetOptions = {}) {
     return new ActionSheet(opts);
   }

 }

/**
* @private
*/
@Component({
  selector: 'ion-action-sheet',
  template:
    '<ion-backdrop (click)="bdClick()"></ion-backdrop>' +
    '<div class="action-sheet-wrapper">' +
      '<div class="action-sheet-container">' +
        '<div class="action-sheet-group">' +
          '<div class="action-sheet-title" id="{{hdrId}}" *ngIf="d.title">{{d.title}}</div>' +
          '<div class="action-sheet-sub-title" id="{{descId}}" *ngIf="d.subTitle">{{d.subTitle}}</div>' +
          '<button category="action-sheet-button" (click)="click(b)" *ngFor="let b of d.buttons" class="disable-hover" [ngClass]="b.cssClass">' +
            '<ion-icon [name]="b.icon" *ngIf="b.icon" class="action-sheet-icon"></ion-icon> ' +
            '{{b.text}}' +
          '</button>' +
        '</div>' +
        '<div class="action-sheet-group" *ngIf="d.cancelButton">' +
          '<button category="action-sheet-button" (click)="click(d.cancelButton)" class="action-sheet-cancel disable-hover" [ngClass]="d.cancelButton.cssClass">' +
            '<ion-icon [name]="d.cancelButton.icon" *ngIf="d.cancelButton.icon" class="action-sheet-icon"></ion-icon> ' +
            '{{d.cancelButton.text}}' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>',
  host: {
    'role': 'dialog',
    '[attr.aria-labelledby]': 'hdrId',
    '[attr.aria-describedby]': 'descId'
  },
  encapsulation: ViewEncapsulation.None,
})
class ActionSheetCmp {
  private d: any;
  private descId: string;
  private enabled: boolean;
  private hdrId: string;
  private id: number;

  constructor(
    private _viewCtrl: ViewController,
    private _config: Config,
    private _elementRef: ElementRef,
    params: NavParams,
    renderer: Renderer
  ) {
    this.d = params.data;

    if (this.d.cssClass) {
      renderer.setElementClass(_elementRef.nativeElement, this.d.cssClass, true);
    }

    this.id = (++actionSheetIds);
    if (this.d.title) {
      this.hdrId = 'acst-hdr-' + this.id;
    }
    if (this.d.subTitle) {
      this.descId = 'acst-subhdr-' + this.id;
    }
  }

  ionViewLoaded() {
    // normalize the data
    let buttons: any[] = [];

    this.d.buttons.forEach((button: any) => {
      if (typeof button === 'string') {
        button = { text: button };
      }
      if (!button.cssClass) {
        button.cssClass = '';
      }

      // deprecated warning
      if (button.style) {
        console.warn('Action sheet "style" property has been renamed to "role"');
        button.role = button.style;
      }

      if (button.role === 'cancel') {
        this.d.cancelButton = button;

      } else {
        if (button.role === 'destructive') {
          button.cssClass = (button.cssClass + ' ' || '') + 'action-sheet-destructive';
        } else if (button.role === 'selected') {
          button.cssClass = (button.cssClass + ' ' || '') + 'action-sheet-selected';
        }
        buttons.push(button);
      }
    });

    this.d.buttons = buttons;
  }

  ionViewDidEnter() {
    let activeElement: any = document.activeElement;
    if (document.activeElement) {
      activeElement.blur();
    }

    let focusableEle = this._elementRef.nativeElement.querySelector('button');
    if (focusableEle) {
      focusableEle.focus();
    }
    this.enabled = true;
  }

  @HostListener('body:keyup', ['$event'])
  private _keyUp(ev: KeyboardEvent) {
    if (this.enabled && this._viewCtrl.isLast()) {
      if (ev.keyCode === Key.ESCAPE) {
        console.debug('actionsheet, escape button');
        this.bdClick();
      }
    }
  }

  click(button: any, dismissDelay?: number) {
    if (! this.enabled ) {
      return;
    }

    let shouldDismiss = true;

    if (button.handler) {
      // a handler has been provided, execute it
      if (button.handler() === false) {
        // if the return value of the handler is false then do not dismiss
        shouldDismiss = false;
      }
    }

    if (shouldDismiss) {
      setTimeout(() => {
        this.dismiss(button.role);
      }, dismissDelay || this._config.get('pageTransitionDelay'));
    }
  }

  bdClick() {
    if (this.enabled && this.d.enableBackdropDismiss) {
      if (this.d.cancelButton) {
        this.click(this.d.cancelButton, 1);

      } else {
        this.dismiss('backdrop');
      }
    }
  }

  dismiss(role: any): Promise<any> {
    return this._viewCtrl.dismiss(null, role);
  }
}

export interface ActionSheetOptions {
  title?: string;
  subTitle?: string;
  cssClass?: string;
  buttons?: Array<any>;
  enableBackdropDismiss?: boolean;
}


class ActionSheetSlideIn extends Transition {
  constructor(enteringView: ViewController, leavingView: ViewController, opts: TransitionOptions) {
    super(enteringView, leavingView, opts);

    let ele = enteringView.pageRef().nativeElement;
    let backdrop = new Animation(ele.querySelector('ion-backdrop'));
    let wrapper = new Animation(ele.querySelector('.action-sheet-wrapper'));

    backdrop.fromTo('opacity', 0.01, 0.4);
    wrapper.fromTo('translateY', '100%', '0%');

    this.easing('cubic-bezier(.36,.66,.04,1)').duration(400).add(backdrop).add(wrapper);
  }
}
Transition.register('action-sheet-slide-in', ActionSheetSlideIn);


class ActionSheetSlideOut extends Transition {
  constructor(enteringView: ViewController, leavingView: ViewController, opts: TransitionOptions) {
    super(enteringView, leavingView, opts);

    let ele = leavingView.pageRef().nativeElement;
    let backdrop = new Animation(ele.querySelector('ion-backdrop'));
    let wrapper = new Animation(ele.querySelector('.action-sheet-wrapper'));

    backdrop.fromTo('opacity', 0.4, 0);
    wrapper.fromTo('translateY', '0%', '100%');

    this.easing('cubic-bezier(.36,.66,.04,1)').duration(300).add(backdrop).add(wrapper);
  }
}
Transition.register('action-sheet-slide-out', ActionSheetSlideOut);


class ActionSheetMdSlideIn extends Transition {
  constructor(enteringView: ViewController, leavingView: ViewController, opts: TransitionOptions) {
    super(enteringView, leavingView, opts);

    let ele = enteringView.pageRef().nativeElement;
    let backdrop = new Animation(ele.querySelector('ion-backdrop'));
    let wrapper = new Animation(ele.querySelector('.action-sheet-wrapper'));

    backdrop.fromTo('opacity', 0.01, 0.26);
    wrapper.fromTo('translateY', '100%', '0%');

    this.easing('cubic-bezier(.36,.66,.04,1)').duration(400).add(backdrop).add(wrapper);
  }
}
Transition.register('action-sheet-md-slide-in', ActionSheetMdSlideIn);


class ActionSheetMdSlideOut extends Transition {
  constructor(enteringView: ViewController, leavingView: ViewController, opts: TransitionOptions) {
    super(enteringView, leavingView, opts);

    let ele = leavingView.pageRef().nativeElement;
    let backdrop = new Animation(ele.querySelector('ion-backdrop'));
    let wrapper = new Animation(ele.querySelector('.action-sheet-wrapper'));

    backdrop.fromTo('opacity', 0.26, 0);
    wrapper.fromTo('translateY', '0%', '100%');

    this.easing('cubic-bezier(.36,.66,.04,1)').duration(450).add(backdrop).add(wrapper);
  }
}
Transition.register('action-sheet-md-slide-out', ActionSheetMdSlideOut);

class ActionSheetWpSlideIn extends Transition {
  constructor(enteringView: ViewController, leavingView: ViewController, opts: TransitionOptions) {
    super(enteringView, leavingView, opts);

    let ele = enteringView.pageRef().nativeElement;
    let backdrop = new Animation(ele.querySelector('ion-backdrop'));
    let wrapper = new Animation(ele.querySelector('.action-sheet-wrapper'));

    backdrop.fromTo('opacity', 0.01, 0.16);
    wrapper.fromTo('translateY', '100%', '0%');

    this.easing('cubic-bezier(.36,.66,.04,1)').duration(400).add(backdrop).add(wrapper);
  }
}
Transition.register('action-sheet-wp-slide-in', ActionSheetWpSlideIn);


class ActionSheetWpSlideOut extends Transition {
  constructor(enteringView: ViewController, leavingView: ViewController, opts: TransitionOptions) {
    super(enteringView, leavingView, opts);

    let ele = leavingView.pageRef().nativeElement;
    let backdrop = new Animation(ele.querySelector('ion-backdrop'));
    let wrapper = new Animation(ele.querySelector('.action-sheet-wrapper'));

    backdrop.fromTo('opacity', 0.1, 0);
    wrapper.fromTo('translateY', '0%', '100%');

    this.easing('cubic-bezier(.36,.66,.04,1)').duration(450).add(backdrop).add(wrapper);
  }
}
Transition.register('action-sheet-wp-slide-out', ActionSheetWpSlideOut);

let actionSheetIds = -1;
