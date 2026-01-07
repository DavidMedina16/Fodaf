import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CardComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  DataTableComponent,
  TableColumn,
  PageEvent,
  SortEvent,
} from '@shared/components';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '@shared/services/toast.service';
import { MembersService, MemberFilters } from '../services/members.service';
import { User, Role } from '@core/models/user.model';
import { RolesService } from '../services/roles.service';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    DataTableComponent,
    ConfirmModalComponent,
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__header-content">
          <h1 class="page__title">Miembros</h1>
          <p class="page__subtitle">Gestiona los miembros del fondo de ahorro</p>
        </div>
        <app-button variant="primary" (click)="onCreateMember()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo miembro
        </app-button>
      </header>

      <app-card>
        <div class="filters">
          <div class="filters__search">
            <app-input
              placeholder="Buscar por nombre o email..."
              [value]="searchTerm()"
              (inputChange)="onSearchChange($event)"
            >
              <svg slot="prefix" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </app-input>
          </div>
          <div class="filters__options">
            <app-select
              placeholder="Estado"
              [options]="statusOptions"
              [value]="statusFilter()"
              (selectionChange)="onStatusChange($event)"
            ></app-select>
            <app-select
              placeholder="Rol"
              [options]="roleOptions()"
              [value]="roleFilter()"
              (selectionChange)="onRoleChange($event)"
            ></app-select>
          </div>
        </div>

        <app-data-table
          [columns]="columns"
          [data]="members()"
          [loading]="loading()"
          [paginated]="true"
          [currentPage]="currentPage()"
          [pageSize]="pageSize()"
          [totalItems]="totalItems()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          emptyTitle="No hay miembros"
          emptyDescription="Agrega un nuevo miembro para comenzar"
          (pageChange)="onPageChange($event)"
          (sortChange)="onSortChange($event)"
          (rowClick)="onRowClick($event)"
        ></app-data-table>
      </app-card>

      @if (showDeleteModal()) {
        <app-confirm-modal
          title="Eliminar miembro"
          [message]="'¿Estás seguro de eliminar a ' + memberToDelete()?.firstName + ' ' + memberToDelete()?.lastName + '?'"
          confirmText="Eliminar"
          confirmVariant="danger"
          (confirm)="confirmDelete()"
          (cancel)="cancelDelete()"
        ></app-confirm-modal>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .page {
      &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: $spacing-6;
        gap: $spacing-4;

        @media (max-width: 640px) {
          flex-direction: column;
        }
      }

      &__header-content {
        flex: 1;
      }

      &__title {
        font-size: $font-size-2xl;
        font-weight: 700;
        margin: 0 0 $spacing-1;
      }

      &__subtitle {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin: 0;
      }
    }

    .filters {
      display: flex;
      gap: $spacing-4;
      margin-bottom: $spacing-6;
      flex-wrap: wrap;

      &__search {
        flex: 1;
        min-width: 250px;
      }

      &__options {
        display: flex;
        gap: $spacing-3;

        @media (max-width: 640px) {
          width: 100%;
          flex-wrap: wrap;

          app-select {
            flex: 1;
            min-width: 140px;
          }
        }
      }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;
      font-size: $font-size-xs;
      font-weight: 500;

      &--active {
        background-color: rgba($success, 0.1);
        color: $success;
      }

      &--inactive {
        background-color: rgba($text-secondary, 0.1);
        color: $text-secondary;
      }
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-md;
      font-size: $font-size-xs;
      font-weight: 500;
      background-color: rgba($primary, 0.1);
      color: $primary;
    }

    .actions {
      display: flex;
      gap: $spacing-2;
      justify-content: flex-end;
    }
  `]
})
export class MembersListComponent implements OnInit {
  private readonly membersService = inject(MembersService);
  private readonly rolesService = inject(RolesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // State
  members = signal<User[]>([]);
  roles = signal<Role[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  sortColumn = signal('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  searchTerm = signal('');
  statusFilter = signal<string>('');
  roleFilter = signal<string>('');

  // Delete modal
  showDeleteModal = signal(false);
  memberToDelete = signal<User | null>(null);

  // Debounce search
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' },
  ];

  roleOptions = computed(() => [
    { value: '', label: 'Todos los roles' },
    ...this.roles().map(r => ({ value: String(r.id), label: r.name }))
  ]);

  columns: TableColumn<User>[] = [
    {
      key: 'firstName',
      header: 'Nombre',
      sortable: true,
      render: (_, row) => `${row.firstName} ${row.lastName}`
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'phone',
      header: 'Telefono',
      render: (value) => value ? String(value) : '-'
    },
    {
      key: 'role',
      header: 'Rol',
      render: (_, row) => row.role?.name || '-'
    },
    {
      key: 'isActive',
      header: 'Estado',
      align: 'center',
      render: (value) => value ? 'Activo' : 'Inactivo'
    },
  ];

  ngOnInit(): void {
    this.loadRoles();
    this.loadMembers();
  }

  loadRoles(): void {
    this.rolesService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.toast.error('Error al cargar los roles')
    });
  }

  loadMembers(): void {
    this.loading.set(true);

    const filters: MemberFilters = {
      page: this.currentPage(),
      limit: this.pageSize(),
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection().toUpperCase() as 'ASC' | 'DESC',
    };

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    if (this.statusFilter()) {
      filters.isActive = this.statusFilter() === 'true';
    }

    if (this.roleFilter()) {
      filters.roleId = Number(this.roleFilter());
    }

    this.membersService.getMembers(filters).subscribe({
      next: (response) => {
        this.members.set(response.data);
        this.totalItems.set(response.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los miembros');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadMembers();
    }, 300);
  }

  onStatusChange(value: string | number): void {
    this.statusFilter.set(String(value));
    this.currentPage.set(1);
    this.loadMembers();
  }

  onRoleChange(value: string | number): void {
    this.roleFilter.set(String(value));
    this.currentPage.set(1);
    this.loadMembers();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.loadMembers();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.loadMembers();
  }

  onRowClick(member: User): void {
    this.router.navigate(['/members', member.id]);
  }

  onCreateMember(): void {
    this.router.navigate(['/members', 'new']);
  }

  onEditMember(member: User): void {
    this.router.navigate(['/members', member.id, 'edit']);
  }

  onDeleteMember(member: User): void {
    this.memberToDelete.set(member);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const member = this.memberToDelete();
    if (!member) return;

    this.membersService.deleteMember(member.id).subscribe({
      next: () => {
        this.toast.success('Miembro eliminado correctamente');
        this.showDeleteModal.set(false);
        this.memberToDelete.set(null);
        this.loadMembers();
      },
      error: () => {
        this.toast.error('Error al eliminar el miembro');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.memberToDelete.set(null);
  }
}
