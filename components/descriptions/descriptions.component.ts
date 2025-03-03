/**
 * @license
 * Copyright Alibaba.com All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { MediaMatcher } from '@angular/cdk/layout';
import { Platform } from '@angular/cdk/platform';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Input,
  OnChanges,
  OnDestroy,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';

import {
  gridResponsiveMap,
  InputBoolean,
  NzBreakpointEnum,
  NzConfigService,
  NzDomEventService,
  warn,
  WithConfig
} from 'ng-zorro-antd/core';
import { merge, Subject } from 'rxjs';
import { auditTime, finalize, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { NzDescriptionsItemComponent } from './descriptions-item.component';
import { NzDescriptionsItemRenderProps, NzDescriptionsLayout, NzDescriptionsSize } from './typings';

const NZ_CONFIG_COMPONENT_NAME = 'descriptions';
const defaultColumnMap: { [key in NzBreakpointEnum]: number } = {
  xxl: 3,
  xl: 3,
  lg: 3,
  md: 3,
  sm: 2,
  xs: 1
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'nz-descriptions',
  exportAs: 'nzDescriptions',
  preserveWhitespaces: false,
  template: `
    <div *ngIf="nzTitle" class="ant-descriptions-title">
      <ng-container *nzStringTemplateOutlet="nzTitle">{{ nzTitle }}</ng-container>
    </div>
    <div class="ant-descriptions-view">
      <table>
        <tbody>
          <ng-container *ngIf="nzLayout === 'horizontal'">
            <tr class="ant-descriptions-row" *ngFor="let row of itemMatrix; let i = index">
              <ng-container *ngFor="let item of row; let isLast = last">
                <!-- Horizontal & NOT Bordered -->
                <ng-container *ngIf="!nzBordered">
                  <td class="ant-descriptions-item" [colSpan]="item.span">
                    <span class="ant-descriptions-item-label" [class.ant-descriptions-item-colon]="nzColon">{{ item.title }}</span>
                    <span class="ant-descriptions-item-content">
                      <ng-template [ngTemplateOutlet]="item.content"></ng-template>
                    </span>
                  </td>
                </ng-container>
                <!-- Horizontal & Bordered -->
                <ng-container *ngIf="nzBordered">
                  <td class="ant-descriptions-item-label" *nzStringTemplateOutlet="item.title">
                    {{ item.title }}
                  </td>
                  <td class="ant-descriptions-item-content" [colSpan]="item.span * 2 - 1">
                    <ng-template [ngTemplateOutlet]="item.content"></ng-template>
                  </td>
                </ng-container>
              </ng-container>
            </tr>
          </ng-container>

          <ng-container *ngIf="nzLayout === 'vertical'">
            <!-- Vertical & NOT Bordered -->
            <ng-container *ngIf="!nzBordered">
              <ng-container *ngFor="let row of itemMatrix; let i = index">
                <tr class="ant-descriptions-row">
                  <ng-container *ngFor="let item of row; let isLast = last">
                    <td class="ant-descriptions-item" [colSpan]="item.span">
                      <span class="ant-descriptions-item-label" [class.ant-descriptions-item-colon]="nzColon">{{ item.title }}</span>
                    </td>
                  </ng-container>
                </tr>
                <tr class="ant-descriptions-row">
                  <ng-container *ngFor="let item of row; let isLast = last">
                    <td class="ant-descriptions-item" [colSpan]="item.span">
                      <span class="ant-descriptions-item-content">
                        <ng-template [ngTemplateOutlet]="item.content"></ng-template>
                      </span>
                    </td>
                  </ng-container>
                </tr>
              </ng-container>
            </ng-container>
            <!-- Vertical & Bordered -->
            <ng-container *ngIf="nzBordered">
              <ng-container *ngFor="let row of itemMatrix; let i = index">
                <tr class="ant-descriptions-row">
                  <ng-container *ngFor="let item of row; let isLast = last">
                    <td class="ant-descriptions-item-label" [colSpan]="item.span">
                      {{ item.title }}
                    </td>
                  </ng-container>
                </tr>
                <tr class="ant-descriptions-row">
                  <ng-container *ngFor="let item of row; let isLast = last">
                    <td class="ant-descriptions-item-content" [colSpan]="item.span">
                      <ng-template [ngTemplateOutlet]="item.content"></ng-template>
                    </td>
                  </ng-container>
                </tr>
              </ng-container>
            </ng-container>
          </ng-container>
        </tbody>
      </table>
    </div>
  `,
  host: {
    class: 'ant-descriptions',
    '[class.ant-descriptions-bordered]': 'nzBordered',
    '[class.ant-descriptions-middle]': 'nzSize === "middle"',
    '[class.ant-descriptions-small]': 'nzSize === "small"'
  },
  styles: [
    `
      nz-descriptions {
        display: block;
      }
    `
  ]
})
export class NzDescriptionsComponent implements OnChanges, OnDestroy, AfterContentInit {
  @ContentChildren(NzDescriptionsItemComponent) items: QueryList<NzDescriptionsItemComponent>;

  @Input() @InputBoolean() @WithConfig(NZ_CONFIG_COMPONENT_NAME, false) nzBordered: boolean;
  @Input() nzLayout: NzDescriptionsLayout = 'horizontal';
  @Input() @WithConfig(NZ_CONFIG_COMPONENT_NAME, defaultColumnMap) nzColumn: number | { [key in NzBreakpointEnum]: number };
  @Input() @WithConfig(NZ_CONFIG_COMPONENT_NAME, 'default') nzSize: NzDescriptionsSize;
  @Input() nzTitle: string | TemplateRef<void> = '';
  @Input() @WithConfig(NZ_CONFIG_COMPONENT_NAME, true) @InputBoolean() nzColon: boolean;

  itemMatrix: NzDescriptionsItemRenderProps[][] = [];

  realColumn = 3;

  private destroy$ = new Subject<void>();
  private resize$ = new Subject<void>();

  constructor(
    public nzConfigService: NzConfigService,
    private cdr: ChangeDetectorRef,
    private mediaMatcher: MediaMatcher,
    private platform: Platform,
    private nzDomEventService: NzDomEventService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.nzColumn) {
      this.resize$.next();
    }
  }

  ngAfterContentInit(): void {
    const contentChange$ = this.items.changes.pipe(startWith(this.items), takeUntil(this.destroy$));

    merge(
      contentChange$,
      contentChange$.pipe(switchMap(() => merge(...this.items.map(i => i.inputChange$)).pipe(auditTime(16)))),
      this.resize$
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.prepareMatrix();
        this.cdr.markForCheck();
      });

    if (this.platform.isBrowser) {
      this.nzDomEventService
        .registerResizeListener()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.nzDomEventService.unregisterResizeListener())
        )
        .subscribe(() => this.resize$.next());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resize$.complete();
  }

  /**
   * Prepare the render matrix according to description items' spans.
   */
  private prepareMatrix(): void {
    let currentRow: NzDescriptionsItemRenderProps[] = [];
    let width = 0;

    const column = (this.realColumn = this.getColumn());
    const items = this.items.toArray();
    const length = items.length;
    const matrix: NzDescriptionsItemRenderProps[][] = [];
    const flushRow = () => {
      matrix.push(currentRow);
      currentRow = [];
      width = 0;
    };

    for (let i = 0; i < length; i++) {
      const item = items[i];
      const { nzTitle: title, content, nzSpan: span } = item;

      width += span;

      // If the last item make the row's length exceeds `nzColumn`, the last
      // item should take all the space left. This logic is implemented in the template.
      // Warn user about that.
      if (width >= column) {
        if (width > column) {
          warn(`"nzColumn" is ${column} but we have row length ${width}`);
        }
        currentRow.push({ title, content, span: column - (width - span) });
        flushRow();
      } else if (i === length - 1) {
        currentRow.push({ title, content, span: column - (width - span) });
        flushRow();
      } else {
        currentRow.push({ title, content, span });
      }
    }

    this.itemMatrix = matrix;
  }

  private matchMedia(): NzBreakpointEnum {
    let bp: NzBreakpointEnum = NzBreakpointEnum.md;

    Object.keys(gridResponsiveMap).map((breakpoint: string) => {
      const castBP = breakpoint as NzBreakpointEnum;
      const matchBelow = this.mediaMatcher.matchMedia(gridResponsiveMap[castBP]).matches;
      if (matchBelow) {
        bp = castBP;
      }
    });

    return bp;
  }

  private getColumn(): number {
    if (typeof this.nzColumn !== 'number') {
      return this.nzColumn[this.matchMedia()];
    }

    return this.nzColumn;
  }
}
