import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isOpen = input<boolean>(true);
  closeSidebar = output<void>();

  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/members', label: 'Miembros', icon: 'users' },
    { path: '/payments', label: 'Pagos', icon: 'payments' },
    { path: '/loans', label: 'Préstamos', icon: 'loans' },
    { path: '/events', label: 'Eventos', icon: 'events' },
    { path: '/investments', label: 'Inversiones', icon: 'investments' },
    { path: '/fines', label: 'Multas', icon: 'fines' },
  ];

  onOverlayClick(): void {
    this.closeSidebar.emit();
  }
}
