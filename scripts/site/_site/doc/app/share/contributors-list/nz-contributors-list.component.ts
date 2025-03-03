import { Platform } from '@angular/cdk/platform';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'nz-contributors-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="contributors-list" style="display: flex; list-style: none; margin: 0px; padding: 0px;">
      <a *ngFor="let item of list"
         nz-tooltip
         [nzTooltipTitle]="(language === 'en' ? 'Contributors: ' : '文档贡献者: ') + item.name"
         [attr.href]="item.url"
         target="_blank">
        <nz-avatar [nzText]="item.name" [nzSrc]="item.avatar"></nz-avatar>
      </a>
    </ul>
  `
})
export class NzContributorsListComponent implements OnInit {
  language = 'en';
  // tslint:disable-next-line:no-any
  list: any[] = [];
  constructor(private router: Router,
              private platform: Platform,
              private cdr: ChangeDetectorRef,
              private http: HttpClient) {}

  ngOnInit(): void {
    if (!this.platform.isBrowser) {
      return
    }
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = window.location.pathname.slice(1);
        this.language = this.router.url.split('/')[this.router.url.split('/').length - 1].split('#')[0];
        let filePath = '';
        const docsMatch = /docs\/(.+)\//.exec(url);
        const componentMatch = /(?:components|experimental)\/(.+)\//.exec(url);

        if (docsMatch && docsMatch[1]) {
          filePath = `docs/${docsMatch[1]}.${this.language === 'en' ? 'en-US' : 'zh-CN'}.md`
        } else if (componentMatch && componentMatch[1]) {
          filePath = `components/${componentMatch[1]}/doc`
        }
        if (filePath) {
          this.getContributors(filePath);
        } else {
          this.list = [];
        }
      }
      this.cdr.markForCheck();
    });
  }

  getContributors(path: string): void {
    this.http.get(`https://api.github.com/repos/NG-ZORRO/ng-zorro-antd/commits`, {
      params: {
        path
      }
    }).subscribe(data => {
      if (Array.isArray(data)) {
        // tslint:disable-next-line:no-any
        const list: any[] = [];
        data.forEach(e => {
          const id = e.author.login;
          const index = list.findIndex(i => i.id === id);
          if (index === -1) {
            list.push({
              id,
              count: 1,
              name: e.commit && e.commit.author.name,
              url: `http://github.com/${id}`,
              avatar: e.author.avatar_url
            })
          } else {
            list[index].count = list[index].count + 1
          }
        });

        this.list = list.sort(((a, b) => b.count - a.count));
      } else {
        this.list = [];
      }
      this.cdr.markForCheck();
    });
  }
}
