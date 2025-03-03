/**
 * @license
 * Copyright Alibaba.com All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import {
  ChangeDetectorRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

import {
  CandyDate,
  cloneDate,
  CompatibleValue,
  FunctionProp,
  InputBoolean,
  NzNoAnimationDirective,
  toBoolean,
  valueFunctionProp
} from 'ng-zorro-antd/core';
import { DateHelperService, NzDatePickerI18nInterface, NzI18nService } from 'ng-zorro-antd/i18n';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DatePickerService } from './date-picker.service';

import { NzPickerComponent } from './picker.component';
import { CompatibleDate, DisabledTimeFn, PanelMode, PresetRanges } from './standard-types';

const POPUP_STYLE_PATCH = { position: 'relative' }; // Aim to override antd's style to support overlay's position strategy (position:absolute will cause it not working beacuse the overlay can't get the height/width of it's content)

/**
 * The base picker for all common APIs
 */
export abstract class AbstractPickerComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  isRange: boolean = false; // Indicate whether the value is a range value
  showWeek: boolean = false; // Should show as week picker
  focused: boolean = false;
  pickerStyle: object; // Final picker style that contains width fix corrections etc.
  extraFooter: TemplateRef<void> | string;
  hostClassMap = {};

  protected destroyed$: Subject<void> = new Subject();
  protected isCustomPlaceHolder: boolean = false;
  private _showTime: object | boolean;

  // --- Common API
  @Input() @InputBoolean() nzAllowClear: boolean = true;
  @Input() @InputBoolean() nzAutoFocus: boolean = false;
  @Input() @InputBoolean() nzDisabled: boolean = false;
  @Input() @InputBoolean() nzOpen: boolean;
  @Input() nzClassName: string;
  @Input() nzDisabledDate: (d: Date) => boolean;
  @Input() nzLocale: NzDatePickerI18nInterface;
  @Input() nzPlaceHolder: string | string[];
  @Input() nzPopupStyle: object = POPUP_STYLE_PATCH;
  @Input() nzDropdownClassName: string;
  @Input() nzSize: 'large' | 'small';
  @Input() nzStyle: object;
  @Input() nzFormat: string;

  @Input() nzDateRender: FunctionProp<TemplateRef<Date> | string>;
  @Input() nzDisabledTime: DisabledTimeFn;
  @Input() nzRenderExtraFooter: FunctionProp<TemplateRef<void> | string>;
  @Input() @InputBoolean() nzShowToday: boolean = true;
  @Input() nzMode: PanelMode | PanelMode[] = 'date';
  @Input() nzRanges: PresetRanges;
  @Output() readonly nzOnPanelChange = new EventEmitter<PanelMode | PanelMode[]>();
  @Output() readonly nzOnCalendarChange = new EventEmitter<Array<Date | null>>();
  @Output() readonly nzOnOk = new EventEmitter<CompatibleDate | null>();
  @Output() readonly nzOnOpenChange = new EventEmitter<boolean>();

  @ViewChild(NzPickerComponent, { static: true }) protected picker: NzPickerComponent;

  @Input() get nzShowTime(): object | boolean {
    return this._showTime;
  }

  set nzShowTime(value: object | boolean) {
    this._showTime = typeof value === 'object' ? value : toBoolean(value);
  }

  get realOpenState(): boolean {
    return this.picker.animationOpenState;
  } // Use picker's real open state to let re-render the picker's content when shown up

  updateHostClass(): void {
    this.hostClassMap = {
      [`ant-picker`]: true,
      [`ant-picker-range`]: this.isRange,
      [`ant-picker-large`]: this.nzSize === 'large',
      [`ant-picker-small`]: this.nzSize === 'small',
      [`ant-picker-focused`]: this.focused,
      [`ant-picker-disabled`]: this.nzDisabled
    };
  }

  constructor(
    public datePickerService: DatePickerService,
    protected i18n: NzI18nService,
    protected cdr: ChangeDetectorRef,
    protected dateHelper: DateHelperService,
    public noAnimation?: NzNoAnimationDirective
  ) {}

  ngOnInit(): void {
    // Subscribe the every locale change if the nzLocale is not handled by user
    if (!this.nzLocale) {
      this.i18n.localeChange.pipe(takeUntil(this.destroyed$)).subscribe(() => this.setLocale());
    }

    // Default value
    this.datePickerService.isRange = this.isRange;
    this.datePickerService.initValue();
    this.datePickerService.emitValue$.pipe(takeUntil(this.destroyed$)).subscribe(_ => {
      const value = this.datePickerService.value;
      this.datePickerService.initialValue = cloneDate(value);
      // this.datePickerService.activeDate = cloneDate(value);
      if (this.isRange) {
        const vAsRange = value as CandyDate[];
        if (vAsRange.length) {
          this.onChangeFn([vAsRange[0].nativeDate, vAsRange[1].nativeDate]);
        } else {
          this.onChangeFn([]);
        }
      } else {
        if (value) {
          this.onChangeFn((value as CandyDate).nativeDate);
        } else {
          this.onChangeFn(null);
        }
      }
      this.onTouchedFn();
      // When value emitted, overlay will be closed
      this.picker.hideOverlay();
    });

    this.updateHostClass();
    this.updatePickerStyle();
    // Default format when it's empty
    if (!this.nzFormat) {
      if (this.showWeek) {
        this.nzFormat = this.dateHelper.relyOnDatePipe ? 'yyyy-ww' : 'YYYY-WW'; // Format for week
      } else {
        if (this.dateHelper.relyOnDatePipe) {
          this.nzFormat = this.nzShowTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd';
        } else {
          this.nzFormat = this.nzShowTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
        }
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.nzSize || changes.nzDisabled) {
      this.updateHostClass();
    }

    if (changes.nzPopupStyle) {
      // Always assign the popup style patch
      this.nzPopupStyle = this.nzPopupStyle ? { ...this.nzPopupStyle, ...POPUP_STYLE_PATCH } : POPUP_STYLE_PATCH;
    }

    // Mark as customized placeholder by user once nzPlaceHolder assigned at the first time
    if (changes.nzPlaceHolder && changes.nzPlaceHolder.firstChange && typeof this.nzPlaceHolder !== 'undefined') {
      this.isCustomPlaceHolder = true;
    }

    if (changes.nzLocale) {
      // The nzLocale is currently handled by user
      this.setDefaultPlaceHolder();
    }

    if (changes.nzRenderExtraFooter) {
      this.extraFooter = valueFunctionProp(this.nzRenderExtraFooter);
    }

    if (changes.nzShowTime || changes.nzStyle) {
      this.updatePickerStyle();
    }

    if (changes.nzMode) {
      this.setPanelMode();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  setPanelMode(): void {
    if (!this.nzMode) {
      this.nzMode = this.isRange ? ['date', 'date'] : 'date';
    }
  }

  /**
   * Triggered when overlayOpen changes (different with realOpenState)
   * @param open The overlayOpen in picker component
   */
  onOpenChange(open: boolean): void {
    this.nzOnOpenChange.emit(open);
  }

  // ------------------------------------------------------------------------
  // | Control value accessor implements
  // ------------------------------------------------------------------------

  // NOTE: onChangeFn/onTouchedFn will not be assigned if user not use as ngModel
  onChangeFn: (val: CompatibleDate | null) => void = () => void 0;
  onTouchedFn: () => void = () => void 0;

  writeValue(value: CompatibleDate): void {
    this.setValue(value);
    this.cdr.markForCheck();
  }

  // tslint:disable-next-line:no-any
  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }

  // tslint:disable-next-line:no-any
  registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }

  // ------------------------------------------------------------------------
  // | Internal methods
  // ------------------------------------------------------------------------

  // Reload locale from i18n with side effects
  private setLocale(): void {
    this.nzLocale = this.i18n.getLocaleData('DatePicker', {});
    this.setDefaultPlaceHolder();
    this.cdr.markForCheck();
  }

  private setDefaultPlaceHolder(): void {
    if (!this.isCustomPlaceHolder && this.nzLocale) {
      this.nzPlaceHolder = this.isRange ? this.nzLocale.lang.rangePlaceholder : this.nzLocale.lang.placeholder;
    }
  }

  // Safe way of setting value with default
  private setValue(value: CompatibleDate): void {
    let newValue: CompatibleValue;
    if (this.isRange) {
      newValue = value ? (value as Date[]).map(val => new CandyDate(val)) : [];
    } else {
      newValue = value ? new CandyDate(value as Date) : null;
    }
    this.datePickerService.setValue(newValue);
    this.datePickerService.initialValue = newValue;
  }

  get realShowToday(): boolean {
    // Range not support nzShowToday currently
    return !this.isRange && this.nzShowToday;
  }

  onFocusChange(value: boolean): void {
    this.focused = value;
    this.updateHostClass();
  }

  updatePickerStyle(): void {
    if (this.nzShowTime) {
      this.pickerStyle = { display: 'inherit', width: this.isRange ? '360px' : '174px' };
    } else {
      this.pickerStyle = { display: 'inherit', width: this.isRange ? '233px' : '111px' };
    }
    this.pickerStyle = { ...this.pickerStyle, ...this.nzStyle };
  }

  onPanelModeChange(panelMode: PanelMode | PanelMode[]): void {
    // this.nzMode = panelMode;
    this.nzOnPanelChange.emit(panelMode);
  }

  // Emit nzOnCalendarChange when select date by nz-range-picker
  onCalendarChange(value: CandyDate[]): void {
    if (this.isRange) {
      const rangeValue = value.filter(x => x instanceof CandyDate).map(x => x.nativeDate);
      this.nzOnCalendarChange.emit(rangeValue);
    }
  }

  // Emitted when done with date selecting
  onResultOk(): void {
    if (this.isRange) {
      const value = this.datePickerService.value as CandyDate[];
      if (value.length) {
        this.nzOnOk.emit([value[0].nativeDate, value[1].nativeDate]);
      } else {
        this.nzOnOk.emit([]);
      }
    } else {
      if (this.datePickerService.value) {
        this.nzOnOk.emit((this.datePickerService.value as CandyDate).nativeDate);
      } else {
        this.nzOnOk.emit(null);
      }
    }
    this.datePickerService.emitValue$.next();
  }
}
