import { Component, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  toggleSidebar = output<void>();

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  showUserMenu = signal<boolean>(false);

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.closeUserMenu();
  }
}
