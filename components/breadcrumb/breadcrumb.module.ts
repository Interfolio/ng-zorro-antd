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

import { NzOutletModule, NzOverlayModule } from 'ng-zorro-antd/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { NzBreadCrumbItemComponent } from './breadcrumb-item.component';
import { NzBreadCrumbSeparatorComponent } from './breadcrumb-separator.component';
import { NzBreadCrumbComponent } from './breadcrumb.component';

@NgModule({
  imports: [CommonModule, NzOutletModule, OverlayModule, NzOverlayModule, NzDropDownModule, NzIconModule],
  declarations: [NzBreadCrumbComponent, NzBreadCrumbItemComponent, NzBreadCrumbSeparatorComponent],
  exports: [NzBreadCrumbComponent, NzBreadCrumbItemComponent, NzBreadCrumbSeparatorComponent]
})
export class NzBreadCrumbModule {}
