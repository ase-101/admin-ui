import { Component, OnDestroy } from '@angular/core';
import { CenterRequest } from 'src/app/core/models/centerRequest.model';
import { CenterService } from 'src/app/core/services/center.service';
import { RequestModel } from 'src/app/core/models/request.model';
import { AppConfigService } from 'src/app/app-config.service';
import { SortModel } from 'src/app/core/models/sort.model';
import { PaginationModel } from 'src/app/core/models/pagination.model';
import * as centerConfig from 'src/assets/entity-spec/center.json';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import Utils from '../../../../app.utils';


@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnDestroy {

  displayedColumns = [];
  actionButtons = [];
  actionEllipsis = [];
  paginatorOptions: any;
  sortFilter = [];
  pagination = new PaginationModel();
  centerRequest = {} as CenterRequest;
  requestModel: RequestModel;
  centers = [];
  subscribed: any;

  constructor(
    private centerService: CenterService,
    private appService: AppConfigService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.getCenterConfigs();
    this.subscribed = router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.getRegistrationCenters();
      }
    });
  }

  getCenterConfigs() {
    this.displayedColumns = centerConfig.columnsToDisplay;
    console.log(this.displayedColumns);
    this.actionButtons = centerConfig.actionButtons.filter(
      value => value.showIn.toLowerCase() === 'ellipsis'
    );
    this.actionEllipsis = centerConfig.actionButtons.filter(
      value => value.showIn.toLowerCase() === 'button'
    );
    this.paginatorOptions = centerConfig.paginator;
  }

  pageEvent(event: any) {
    const filters = Utils.convertFilter(this.activatedRoute.snapshot.queryParams, this.appService.getConfig().primaryLangCode);
    filters.pagination.pageFetch = event.pageSize;
    filters.pagination.pageStart = event.pageIndex;
    const url = Utils.convertFilterToUrl(filters);
    this.router.navigateByUrl(`admin/resources/centers/view?${url}`);
  }

  getSortColumn(event: SortModel) {
    console.log(event);
    this.sortFilter.forEach(element => {
      if (element.sortField === event.sortField) {
        const index = this.sortFilter.indexOf(element);
        this.sortFilter.splice(index, 1);
      }
    });
    if (event.sortType != null) {
      this.sortFilter.push(event);
    }
    console.log(this.sortFilter);
    const filters = Utils.convertFilter(this.activatedRoute.snapshot.queryParams, this.appService.getConfig().primaryLangCode);
    filters.sort = this.sortFilter;
    const url = Utils.convertFilterToUrl(filters);
    this.router.navigateByUrl('admin/resources/centers/view?' + url);
  }

  getRegistrationCenters() {
    this.centers = [];
    const filters = Utils.convertFilter(this.activatedRoute.snapshot.queryParams, this.appService.getConfig().primaryLangCode);
    this.sortFilter = filters.sort;
    this.requestModel = new RequestModel(null, null, filters);
    console.log(JSON.stringify(this.requestModel));
    this.centerService
      .getRegistrationCentersDetails(this.requestModel)
      .subscribe(({ response, errors }) => {
        console.log(response);
        if (response != null) {
          this.paginatorOptions.totalEntries = response.totalRecord;
          this.paginatorOptions.pageIndex = filters.pagination.pageStart;
          this.paginatorOptions.pageSize = filters.pagination.pageFetch;
          console.log(this.paginatorOptions);
          this.centers = response.data ? [...response.data] : [];
          console.log(this.centers);
        } else if (errors != null) {
          console.log(errors);
        }
      });
  }

  ngOnDestroy() {
    this.subscribed.unsubscribe();
  }
}
