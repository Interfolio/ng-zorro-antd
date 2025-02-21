/**
 * @license
 * Copyright Alibaba.com All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { NzNoAnimationModule, NzOutletModule, NzOverlayModule } from 'ng-zorro-antd/core';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { NzPopoverComponent, NzPopoverDirective } from './popover';

@NgModule({
  entryComponents: [NzPopoverComponent],
  exports: [NzPopoverDirective, NzPopoverComponent],
  declarations: [NzPopoverDirective, NzPopoverComponent],
  imports: [CommonModule, OverlayModule, NzOutletModule, NzOverlayModule, NzNoAnimationModule, NzToolTipModule]
})
export class NzPopoverModule {}
