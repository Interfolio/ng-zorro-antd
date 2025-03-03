/**
 * @license
 * Copyright Alibaba.com All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { AnimationEvent } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  ViewEncapsulation
} from '@angular/core';

import { fadeMotion, InputBoolean, NzUpdateHostClassService, warnDeprecation } from 'ng-zorro-antd/core';

@Component({
  selector: 'nz-tag',
  exportAs: 'nzTag',
  preserveWhitespaces: false,
  providers: [NzUpdateHostClassService],
  animations: [fadeMotion],
  template: `
    <ng-content></ng-content>
    <i nz-icon nzType="close" *ngIf="nzMode === 'closeable'" tabindex="-1" (click)="closeTag($event)"></i>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[@fadeMotion]': '',
    '[@.disabled]': 'nzNoAnimation',
    '(@fadeMotion.done)': 'afterAnimation($event)',
    '(click)': 'updateCheckedStatus()',
    '[style.background-color]': 'presetColor? null : nzColor',
    class: 'ant-tag',
    '[class.ant-tag-has-color]': 'nzColor && !presetColor',
    '[class.ant-tag-checkable]': 'nzMode === "checkable"',
    '[class.ant-tag-checkable-checked]': 'nzChecked'
  }
})
export class NzTagComponent implements OnInit, OnChanges {
  presetColor = false;
  @Input() nzMode: 'default' | 'closeable' | 'checkable' = 'default';
  @Input() nzColor: string;
  @Input() @InputBoolean() nzChecked = false;
  @Input() @InputBoolean() nzNoAnimation = false;
  @Output() readonly nzAfterClose = new EventEmitter<void>();
  @Output() readonly nzOnClose = new EventEmitter<MouseEvent>();
  @Output() readonly nzCheckedChange = new EventEmitter<boolean>();

  private isPresetColor(color?: string): boolean {
    if (!color) {
      return false;
    }

    return (
      /^(pink|red|yellow|orange|cyan|green|blue|purple|geekblue|magenta|volcano|gold|lime)(-inverse)?$/.test(color) ||
      /^(success|processing|error|default|warning)$/.test(color)
    );
  }

  private updateClassMap(): void {
    this.presetColor = this.isPresetColor(this.nzColor);
    this.nzUpdateHostClassService.updateHostClass(this.elementRef.nativeElement, {
      [`ant-tag-${this.nzColor}`]: this.presetColor
    });
  }

  updateCheckedStatus(): void {
    if (this.nzMode === 'checkable') {
      this.nzChecked = !this.nzChecked;
      this.nzCheckedChange.emit(this.nzChecked);
      this.updateClassMap();
    }
  }

  closeTag(e: MouseEvent): void {
    this.nzOnClose.emit(e);
    if (!e.defaultPrevented) {
      this.renderer.removeChild(this.renderer.parentNode(this.elementRef.nativeElement), this.elementRef.nativeElement);
    }
  }

  afterAnimation(e: AnimationEvent): void {
    if (e.toState === 'void') {
      this.nzAfterClose.emit();
      if (this.nzAfterClose.observers.length) {
        warnDeprecation(`'(nzAfterClose)' Output is going to be removed in 9.0.0. Please use '(nzOnClose)' instead.`);
      }
    }
  }

  constructor(private renderer: Renderer2, private elementRef: ElementRef, private nzUpdateHostClassService: NzUpdateHostClassService) {}

  ngOnInit(): void {
    this.updateClassMap();
  }

  ngOnChanges(): void {
    this.updateClassMap();
  }
}
