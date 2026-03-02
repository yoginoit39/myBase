import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/interfaces';
import { TablesComponent } from './tables/tables.component';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatTabsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, TablesComponent],
  template: `
    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-left">
        <a routerLink="/dashboard" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <span class="nav-sep">⬡</span>
        <span class="nav-project">{{ project?.name }}</span>
        <span class="nav-badge">{{ project?.table_count }} tables</span>
      </div>
      <div class="nav-right" *ngIf="project">
        <div class="api-key-pill">
          <mat-icon>vpn_key</mat-icon>
          <span>{{ project.api_key | slice:0:24 }}...</span>
          <button mat-icon-button (click)="copyKey()" class="copy-btn" title="Copy API Key">
            <mat-icon>content_copy</mat-icon>
          </button>
        </div>
      </div>
    </nav>

    <div *ngIf="loading" class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>

    <div *ngIf="!loading && project" class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">Project</div>
          <button class="sidebar-item" [class.active]="activeTab === 'tables'" (click)="activeTab = 'tables'">
            <mat-icon>table_chart</mat-icon> Tables
            <span class="sidebar-badge">{{ project.table_count }}</span>
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'storage'" (click)="activeTab = 'storage'">
            <mat-icon>folder</mat-icon> Storage
          </button>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-label">Configuration</div>
          <button class="sidebar-item" [class.active]="activeTab === 'api'" (click)="activeTab = 'api'">
            <mat-icon>code</mat-icon> API
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'settings'" (click)="activeTab = 'settings'">
            <mat-icon>settings</mat-icon> Settings
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="content">
        <!-- Tables tab -->
        <div *ngIf="activeTab === 'tables'">
          <app-tables [projectId]="project.id" [apiKey]="project.api_key"></app-tables>
        </div>

        <!-- Storage tab -->
        <div *ngIf="activeTab === 'storage'" class="tab-page">
          <div class="tab-header">
            <h2>Storage</h2>
            <p>Upload and manage files in your Cloudflare R2 bucket.</p>
          </div>
          <div class="info-card">
            <mat-icon class="info-icon">cloud_upload</mat-icon>
            <div>
              <div class="info-title">R2 Storage Connected</div>
              <div class="info-sub">Files are stored in your <code>mybase-storage</code> bucket, organized by project ID.</div>
            </div>
          </div>
        </div>

        <!-- API tab -->
        <div *ngIf="activeTab === 'api'" class="tab-page">
          <div class="tab-header">
            <h2>API Reference</h2>
            <p>Use your project's API key to interact with your data from any app.</p>
          </div>

          <div class="api-key-section">
            <div class="section-title">Project API Key</div>
            <div class="key-box">
              <code>{{ project.api_key }}</code>
              <button mat-icon-button (click)="copyKey()"><mat-icon>content_copy</mat-icon></button>
            </div>
            <button mat-stroked-button color="warn" (click)="regenerateKey()" class="regen-btn">
              <mat-icon>refresh</mat-icon> Regenerate key
            </button>
          </div>

          <div class="section-title" style="margin-top:32px">Usage Examples</div>
          <div class="code-tabs">
            <button class="code-tab" [class.active]="codeLang==='js'" (click)="codeLang='js'">JavaScript</button>
            <button class="code-tab" [class.active]="codeLang==='python'" (click)="codeLang='python'">Python</button>
            <button class="code-tab" [class.active]="codeLang==='curl'" (click)="codeLang='curl'">cURL</button>
          </div>
          <pre class="code-block"><code>{{ codeExample }}</code></pre>
        </div>

        <!-- Settings tab -->
        <div *ngIf="activeTab === 'settings'" class="tab-page">
          <div class="tab-header">
            <h2>Settings</h2>
            <p>Project configuration and details.</p>
          </div>

          <div class="settings-grid">
            <div class="setting-row"><span class="setting-key">Project ID</span><code class="setting-val">{{ project.id }}</code></div>
            <div class="setting-row"><span class="setting-key">Created</span><span class="setting-val">{{ project.created_at | date:'MMMM d, y' }}</span></div>
            <div class="setting-row"><span class="setting-key">Tables</span><span class="setting-val">{{ project.table_count }}</span></div>
            <div class="setting-row"><span class="setting-key">Description</span><span class="setting-val">{{ project.description || '—' }}</span></div>
          </div>

          <div class="danger-zone">
            <div class="danger-header">
              <mat-icon>warning</mat-icon>
              <span>Danger Zone</span>
            </div>
            <p>Deleting this project permanently removes all tables, data, and stored files. This cannot be undone.</p>
            <button mat-raised-button (click)="deleteProject()" class="delete-btn">Delete project</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; height: 60px; background: rgba(10,15,30,0.9); backdrop-filter: blur(16px);
      border-bottom: 1px solid #1f2937;
    }
    .nav-left { display: flex; align-items: center; gap: 12px; }
    .back-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; color: #6b7280; text-decoration: none; transition: all 0.15s; }
    .back-btn:hover { background: #111827; color: #f1f5f9; }
    .back-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .nav-sep { font-size: 18px; color: #374151; }
    .nav-project { font-size: 15px; font-weight: 600; color: #f1f5f9; }
    .nav-badge { background: #1f2937; color: #6b7280; font-size: 11px; padding: 2px 8px; border-radius: 99px; }
    .api-key-pill { display: flex; align-items: center; gap: 8px; background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #6b7280; font-family: monospace; }
    .api-key-pill mat-icon { font-size: 14px; width: 14px; height: 14px; color: #6366f1; }
    .copy-btn { width: 24px !important; height: 24px !important; }
    .copy-btn mat-icon { font-size: 14px !important; }
    .loading-center { display: flex; justify-content: center; padding: 100px; }
    .layout { display: flex; height: calc(100vh - 60px); }

    /* Sidebar */
    .sidebar { width: 220px; background: #0a0f1e; border-right: 1px solid #1f2937; padding: 24px 12px; flex-shrink: 0; }
    .sidebar-section { margin-bottom: 24px; }
    .sidebar-label { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.8px; padding: 0 12px; margin-bottom: 6px; }
    .sidebar-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px; border-radius: 8px;
      background: none; border: none; color: #6b7280; font-size: 14px; cursor: pointer; transition: all 0.15s; text-align: left;
    }
    .sidebar-item:hover { background: #111827; color: #d1d5db; }
    .sidebar-item.active { background: rgba(99,102,241,0.1); color: #a5b4fc; }
    .sidebar-item.active mat-icon { color: #6366f1; }
    .sidebar-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sidebar-badge { margin-left: auto; background: #1f2937; color: #6b7280; font-size: 11px; padding: 1px 7px; border-radius: 99px; }

    /* Content */
    .content { flex: 1; overflow-y: auto; padding: 32px; }
    .tab-page { max-width: 720px; }
    .tab-header { margin-bottom: 28px; }
    .tab-header h2 { font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 0 0 6px; letter-spacing: -0.3px; }
    .tab-header p { color: #6b7280; margin: 0; font-size: 14px; }

    /* Info card */
    .info-card { display: flex; align-items: flex-start; gap: 16px; background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; }
    .info-icon { font-size: 28px; width: 28px; height: 28px; color: #6366f1; }
    .info-title { font-weight: 600; color: #f1f5f9; margin-bottom: 4px; }
    .info-sub { font-size: 13px; color: #6b7280; }
    .info-sub code { color: #a5b4fc; }

    /* API section */
    .section-title { font-size: 13px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .api-key-section { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; }
    .key-box { display: flex; align-items: center; gap: 8px; background: #0a0f1e; border: 1px solid #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
    .key-box code { flex: 1; font-family: monospace; font-size: 13px; color: #a5b4fc; word-break: break-all; }
    .regen-btn { border-radius: 8px !important; font-size: 13px; }
    .code-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
    .code-tab { background: #111827; border: 1px solid #1f2937; border-radius: 6px; padding: 6px 14px; font-size: 13px; color: #6b7280; cursor: pointer; transition: all 0.15s; }
    .code-tab.active { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #a5b4fc; }
    .code-block { background: #0a0f1e; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; font-size: 12px; color: #9ca3af; overflow-x: auto; white-space: pre; line-height: 1.7; font-family: 'Fira Code', monospace; }

    /* Settings */
    .settings-grid { background: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; margin-bottom: 32px; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #1f2937; }
    .setting-row:last-child { border-bottom: none; }
    .setting-key { font-size: 13px; color: #6b7280; }
    .setting-val { font-size: 13px; color: #f1f5f9; }
    code.setting-val { font-family: monospace; color: #a5b4fc; }
    .danger-zone { background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.15); border-radius: 12px; padding: 20px; }
    .danger-header { display: flex; align-items: center; gap: 8px; color: #f87171; font-weight: 600; margin-bottom: 8px; }
    .danger-header mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .danger-zone p { color: #9ca3af; font-size: 13px; margin: 0 0 16px; }
    .delete-btn { background: #ef4444 !important; color: white !important; border-radius: 8px !important; }
  `]
})
export class ProjectComponent implements OnInit {
  project: Project | null = null;
  loading = true;
  activeTab = 'tables';
  codeLang = 'js';

  get codeExample(): string {
    if (!this.project) return '';
    const key = this.project.api_key;
    const url = 'http://localhost:8003';
    if (this.codeLang === 'js') return `const API = '${url}/data';
const KEY = '${key}';

// Fetch all rows
const res = await fetch(\`\${API}/your_table\`, {
  headers: { 'x-api-key': KEY }
});
const rows = await res.json();

// Insert a row
await fetch(\`\${API}/your_table\`, {
  method: 'POST',
  headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', age: 30 })
});`;
    if (this.codeLang === 'python') return `import requests

API = '${url}/data'
KEY = '${key}'
HEADERS = {'x-api-key': KEY}

# Fetch all rows
rows = requests.get(f'{API}/your_table', headers=HEADERS).json()

# Insert a row
requests.post(f'{API}/your_table', headers=HEADERS,
  json={'name': 'Alice', 'age': 30})`;
    return `# Fetch all rows
curl ${url}/data/your_table \\
  -H "x-api-key: ${key}"

# Insert a row
curl -X POST ${url}/data/your_table \\
  -H "x-api-key: ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Alice","age":30}'`;
  }

  constructor(
    private route: ActivatedRoute, private router: Router,
    private projectService: ProjectService, private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.get(id).subscribe({
      next: p => { this.project = p; this.loading = false; },
      error: () => { this.loading = false; this.router.navigate(['/dashboard']); },
    });
  }

  copyKey(): void {
    navigator.clipboard.writeText(this.project!.api_key);
    this.snackBar.open('API key copied!', '', { duration: 2000 });
  }

  regenerateKey(): void {
    if (!confirm('Regenerate? All existing apps using the old key will stop working.')) return;
    this.projectService.regenerateKey(this.project!.id).subscribe({
      next: p => { this.project = p; this.snackBar.open('Key regenerated', '', { duration: 3000 }); },
    });
  }

  deleteProject(): void {
    if (!confirm(`Delete "${this.project!.name}"? This cannot be undone.`)) return;
    this.projectService.delete(this.project!.id).subscribe({
      next: () => { this.router.navigate(['/dashboard']); },
    });
  }
}
