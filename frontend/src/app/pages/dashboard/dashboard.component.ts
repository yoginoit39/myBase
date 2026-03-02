import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/interfaces';
import { NewProjectDialogComponent } from './new-project-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, MatSnackBarModule, MatMenuModule],
  template: `
    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-brand">
        <span class="nav-logo-icon">⬡</span>
        <span class="nav-logo-text">MyBase</span>
      </div>
      <div class="nav-actions">
        <div class="user-pill" [matMenuTriggerFor]="userMenu">
          <div class="user-avatar">{{ userInitial }}</div>
          <span class="user-email">{{ userEmail }}</span>
          <mat-icon class="chevron">expand_more</mat-icon>
        </div>
        <mat-menu #userMenu="matMenu" class="dark-menu">
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </mat-menu>
      </div>
    </nav>

    <div class="page">
      <!-- Hero header -->
      <div class="page-hero">
        <div class="hero-text">
          <h1>Projects</h1>
          <p>Each project is a fully isolated backend with its own database, API, and storage.</p>
        </div>
        <button mat-raised-button color="primary" class="new-btn" (click)="openNewProject()">
          <mat-icon>add</mat-icon>
          New project
        </button>
      </div>

      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-num">{{ projects.length }}</span>
          <span class="stat-lbl">Projects</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ totalTables }}</span>
          <span class="stat-lbl">Total tables</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">Free</span>
          <span class="stat-lbl">Current plan</span>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-center">
        <mat-spinner diameter="36"></mat-spinner>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && projects.length === 0" class="empty-state">
        <div class="empty-icon-wrap">
          <mat-icon>storage</mat-icon>
        </div>
        <h2>No projects yet</h2>
        <p>Create your first project to get a database, API, and storage instantly.</p>
        <button mat-raised-button color="primary" (click)="openNewProject()" class="empty-btn">
          <mat-icon>add</mat-icon> Create your first project
        </button>
      </div>

      <!-- Projects grid -->
      <div class="projects-grid" *ngIf="!loading && projects.length > 0">
        <div class="project-card" *ngFor="let p of projects" (click)="openProject(p.id)">
          <div class="card-gradient-bar" [style.background]="getGradient(p.name)"></div>
          <div class="card-body">
            <div class="card-header-row">
              <div class="card-icon" [style.background]="getIconBg(p.name)">
                {{ p.name.charAt(0).toUpperCase() }}
              </div>
              <div class="card-menu-btn" (click)="$event.stopPropagation()" [matMenuTriggerFor]="cardMenu">
                <mat-icon>more_horiz</mat-icon>
              </div>
              <mat-menu #cardMenu="matMenu">
                <button mat-menu-item (click)="openProject(p.id)"><mat-icon>open_in_new</mat-icon>Open</button>
                <button mat-menu-item (click)="deleteProject(p)" style="color:#ef4444"><mat-icon style="color:#ef4444">delete</mat-icon>Delete</button>
              </mat-menu>
            </div>
            <h3 class="card-name">{{ p.name }}</h3>
            <p class="card-desc">{{ p.description || 'No description' }}</p>
            <div class="card-footer">
              <div class="card-stat">
                <mat-icon>table_chart</mat-icon>
                <span>{{ p.table_count }} table{{ p.table_count !== 1 ? 's' : '' }}</span>
              </div>
              <div class="card-stat">
                <mat-icon>schedule</mat-icon>
                <span>{{ p.created_at | date:'MMM d' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Add new card -->
        <div class="project-card add-card" (click)="openNewProject()">
          <div class="add-card-inner">
            <div class="add-icon"><mat-icon>add</mat-icon></div>
            <span>New project</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Navbar */
    .navbar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; height: 60px;
      background: rgba(10,15,30,0.85); backdrop-filter: blur(16px);
      border-bottom: 1px solid #1f2937;
    }
    .nav-brand { display: flex; align-items: center; gap: 8px; }
    .nav-logo-icon { font-size: 22px; }
    .nav-logo-text { font-size: 18px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.5px; }
    .user-pill { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 99px; background: #111827; border: 1px solid #1f2937; cursor: pointer; transition: border-color 0.15s; }
    .user-pill:hover { border-color: #374151; }
    .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; }
    .user-email { font-size: 13px; color: #9ca3af; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chevron { font-size: 18px; width: 18px; height: 18px; color: #6b7280; }

    /* Page */
    .page { max-width: 1280px; margin: 0 auto; padding: 40px 32px; }

    /* Hero */
    .page-hero { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .hero-text h1 { font-size: 30px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px; letter-spacing: -0.5px; }
    .hero-text p { color: #6b7280; margin: 0; font-size: 14px; }
    .new-btn { height: 42px; border-radius: 10px !important; font-size: 14px; }

    /* Stats */
    .stats-bar { display: flex; align-items: center; gap: 24px; padding: 16px 24px; background: #111827; border: 1px solid #1f2937; border-radius: 12px; margin-bottom: 32px; width: fit-content; }
    .stat-item { display: flex; flex-direction: column; gap: 2px; }
    .stat-num { font-size: 20px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.5px; }
    .stat-lbl { font-size: 12px; color: #6b7280; }
    .stat-divider { width: 1px; height: 32px; background: #1f2937; }

    /* Loading */
    .loading-center { display: flex; justify-content: center; padding: 80px 0; }

    /* Empty state */
    .empty-state { text-align: center; padding: 80px 0; }
    .empty-icon-wrap { width: 72px; height: 72px; border-radius: 20px; background: #111827; border: 1px solid #1f2937; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; color: #374151; }
    .empty-state h2 { font-size: 22px; font-weight: 600; color: #f1f5f9; margin: 0 0 10px; }
    .empty-state p { color: #6b7280; margin: 0 0 24px; font-size: 14px; }
    .empty-btn { height: 44px; border-radius: 10px !important; }

    /* Grid */
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

    /* Project card */
    .project-card {
      background: #111827; border: 1px solid #1f2937; border-radius: 16px;
      overflow: hidden; cursor: pointer; transition: all 0.2s;
    }
    .project-card:hover { border-color: #374151; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
    .card-gradient-bar { height: 3px; }
    .card-body { padding: 20px; }
    .card-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: white; }
    .card-menu-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; transition: background 0.15s; }
    .card-menu-btn:hover { background: #1f2937; color: #f1f5f9; }
    .card-menu-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .card-name { font-size: 16px; font-weight: 600; color: #f1f5f9; margin: 0 0 6px; }
    .card-desc { font-size: 13px; color: #6b7280; margin: 0 0 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-footer { display: flex; gap: 16px; }
    .card-stat { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #6b7280; }
    .card-stat mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Add card */
    .add-card { display: flex; align-items: center; justify-content: center; min-height: 160px; border-style: dashed !important; }
    .add-card:hover { border-color: #6366f1 !important; background: rgba(99,102,241,0.04); }
    .add-card-inner { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #374151; transition: color 0.15s; }
    .add-card:hover .add-card-inner { color: #6366f1; }
    .add-icon { width: 44px; height: 44px; border-radius: 12px; background: #1f2937; display: flex; align-items: center; justify-content: center; }
    .add-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .add-card-inner span { font-size: 14px; font-weight: 500; }
  `]
})
export class DashboardComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  userEmail = '';
  userInitial = '';

  get totalTables(): number { return this.projects.reduce((s, p) => s + p.table_count, 0); }

  private gradients = [
    'linear-gradient(90deg,#6366f1,#8b5cf6)',
    'linear-gradient(90deg,#06b6d4,#6366f1)',
    'linear-gradient(90deg,#10b981,#06b6d4)',
    'linear-gradient(90deg,#f59e0b,#ef4444)',
    'linear-gradient(90deg,#ec4899,#8b5cf6)',
  ];
  private iconBgs = ['#312e81','#164e63','#064e3b','#78350f','#500724'];

  getGradient(name: string): string { return this.gradients[name.charCodeAt(0) % this.gradients.length]; }
  getIconBg(name: string): string { return this.iconBgs[name.charCodeAt(0) % this.iconBgs.length]; }

  constructor(
    private projectService: ProjectService,
    private auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.auth.loadMe().subscribe(user => {
      this.userEmail = user.email;
      this.userInitial = user.email.charAt(0).toUpperCase();
    });
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.list().subscribe({
      next: p => { this.projects = p; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openProject(id: string): void { this.router.navigate(['/project', id]); }

  openNewProject(): void {
    const ref = this.dialog.open(NewProjectDialogComponent, { width: '460px', panelClass: 'dark-dialog' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.projectService.create(result.name, result.description).subscribe({
          next: () => { this.snackBar.open('Project created!', '', { duration: 3000 }); this.loadProjects(); },
          error: err => this.snackBar.open(err.error?.detail || 'Failed', '', { duration: 3000 }),
        });
      }
    });
  }

  deleteProject(p: Project): void {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    this.projectService.delete(p.id).subscribe({
      next: () => { this.snackBar.open('Deleted', '', { duration: 3000 }); this.loadProjects(); },
    });
  }

  logout(): void { this.auth.logout(); }
}
