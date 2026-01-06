import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ButtonComponent } from '../button/button.component';

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => string;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

export interface PageEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent<T extends Record<string, unknown>> {
  columns = input.required<TableColumn<T>[]>();
  data = input<T[]>([]);
  loading = input<boolean>(false);
  emptyTitle = input<string>('No hay datos');
  emptyDescription = input<string>('');

  // Pagination
  paginated = input<boolean>(false);
  currentPage = input<number>(1);
  pageSize = input<number>(10);
  totalItems = input<number>(0);

  // Sorting
  sortColumn = input<string>('');
  sortDirection = input<'asc' | 'desc'>('asc');

  // Events
  sortChange = output<SortEvent>();
  pageChange = output<PageEvent>();
  rowClick = output<T>();

  readonly totalPages = computed(() => {
    if (!this.paginated()) return 1;
    return Math.ceil(this.totalItems() / this.pageSize()) || 1;
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  readonly startItem = computed(() => {
    if (!this.paginated() || this.data().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly endItem = computed(() => {
    if (!this.paginated()) return this.data().length;
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

  onSort(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const newDirection =
      this.sortColumn() === column.key && this.sortDirection() === 'asc'
        ? 'desc'
        : 'asc';

    this.sortChange.emit({
      column: column.key,
      direction: newDirection
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.pageChange.emit({ page, pageSize: this.pageSize() });
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  getCellValue(row: T, column: TableColumn<T>): string {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return String(value ?? '');
  }

  trackByIndex(index: number): number {
    return index;
  }

  isNumber(value: number | string): value is number {
    return typeof value === 'number';
  }
}
