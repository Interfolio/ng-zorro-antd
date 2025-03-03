import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { VERSION } from 'ng-zorro-antd/version';

const RESPONSIVE_XS = 1120;
const RESPONSIVE_SM = 1200;

@Component({
  selector: 'app-header',
  template: `
    <header id="header" class="clearfix">
      <i nz-icon class="nav-phone-icon"
         nzType="unordered-list"
         *ngIf="isMobile"
         nzOverlayClassName="popover-menu"
         nz-popover
         [nzPopoverContent]="menu"
         nzPopoverPlacement="bottomRight"></i>

      <div nz-row style="flex-flow: nowrap">
        <div nz-col [nzXs]="24" [nzSm]="24" [nzMd]="6" [nzLg]="6" [nzXl]="5" [nzXXl]="4">
          <app-logo></app-logo>
        </div>
        <div nz-col [nzXs]="0" [nzSm]="0" [nzMd]="18" [nzLg]="18" [nzXl]="19" [nzXXl]="20" class="menu-row">
          <div app-searchbar [language]="language" [responsive]="responsive" (focusChange)="onFocusChange($event)"></div>
          <ng-container *ngIf="!isMobile" [ngTemplateOutlet]="menu">
          </ng-container>
        </div>
      </div>
    </header>
    <ng-template #menu>
      <ng-container *ngIf="!searching">
        <ng-container *ngIf="windowWidth < 1120; else narrowNavigation">
          <ul nz-menu
              app-navagation
              class="menu-site"
              [responsive]="responsive"
              [page]="page"
              [isMobile]="isMobile"
              [nzMode]="isMobile ? 'inline' : 'horizontal'"
              [nzSelectable]="false"
              [(language)]="language"
              (languageChange)="onChangeLanguage($event)"></ul>
        </ng-container>
        <ng-template #narrowNavigation>
          <ul nz-menu
              app-navagation
              class="menu-site"
              [responsive]="responsive"
              [page]="page"
              [isMobile]="isMobile"
              [nzMode]="isMobile ? 'inline' : 'horizontal'"
              [nzSelectable]="false"
              [(language)]="language"
              (languageChange)="onChangeLanguage($event)"></ul>
          <nz-select nzSize="small"
                     class="version"
                     style="max-width: 126px;"
                     [ngModel]="currentVersion"
                     (ngModelChange)="onChangeVersion($event)">
            <nz-option *ngFor="let version of oldVersionList" [nzLabel]="version" [nzValue]="version"></nz-option>
            <nz-option [nzLabel]="currentVersion" [nzValue]="currentVersion"></nz-option>
          </nz-select>
          <button nz-button
                  nzSize="small"
                  class="header-button header-lang-butto"
                  (click)="onChangeLanguage(language==='zh'?'en':'zh')">{{language == 'zh' ? 'English' : '中文'}}</button>
          <app-github-btn [responsive]="responsive"></app-github-btn>
        </ng-template>
      </ng-container>
    </ng-template>
  `,
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnChanges {

  @Input() language: 'zh' | 'en' = 'zh';
  @Input() windowWidth = 1400;
  @Input() page:'docs' | 'components' | 'experimental' | string = 'docs'
  @Output() versionChange = new EventEmitter<string>()
  @Output() languageChange = new EventEmitter<string>()

  searching = false;
  isMobile = false;
  mode = 'horizontal';
  responsive: null | 'narrow' | 'crowded' = null;
  oldVersionList = ['0.5.x', '0.6.x', '0.7.x', '1.8.x', '7.5.x'];
  currentVersion = VERSION.full;

  onChangeVersion(version: string): void {
    this.versionChange.emit(version)
  }

  onFocusChange(focus: boolean): void {
    this.searching = focus;
  }

  onChangeLanguage(language: string): void {
    this.languageChange.emit(language)
  }

  updateResponsive(): void {
    this.responsive = null;
    this.isMobile = this.windowWidth <= 768;
    if (this.windowWidth < RESPONSIVE_XS) {
      this.responsive = 'crowded';
    } else if (this.windowWidth < RESPONSIVE_SM) {
      this.responsive = 'narrow';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { windowWidth } = changes;
    if (windowWidth) {
      this.updateResponsive();
    }
  }

}