import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  sidebarOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
