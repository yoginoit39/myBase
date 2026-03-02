import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TableService } from '../../../core/services/table.service';
import { TableListItem, ProjectTable } from '../../../core/models/interfaces';
import { NewTableDialogComponent } from './new-table-dialog.component';
import { DataEditorComponent } from '../data-editor/data-editor.component';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTableModule, MatDialogModule, MatProgressSpinnerModule, MatSnackBarModule, DataEditorComponent],
  template: `
    <div class="tables-layout">
      <!-- Table list panel -->
      <div class="tables-panel">
        <div class="panel-header">
          <span class="panel-title">Tables</span>
          <button mat-icon-button class="add-btn" (click)="openNewTable()" title="New table">
            <mat-icon>add</mat-icon>
          </button>
        </div>

        <div *ngIf="loading" class="panel-loading"><mat-spinner diameter="24"></mat-spinner></div>

        <div *ngIf="!loading && tables.length === 0" class="panel-empty">
          <mat-icon>table_chart</mat-icon>
          <p>No tables yet</p>
          <button mat-stroked-button (click)="openNewTable()">Create table</button>
        </div>

        <div class="table-list" *ngIf="!loading && tables.length > 0">
          <div
            class="table-item"
            *ngFor="let t of tables"
            [class.active]="selectedTable === t.table_name"
            (click)="selectTable(t.table_name)"
          >
            <mat-icon class="tbl-icon">table_rows</mat-icon>
            <div class="tbl-info">
              <span class="tbl-name">{{ t.table_name }}</span>
              <span class="tbl-rows">{{ t.row_count }} rows</span>
            </div>
            <button mat-icon-button class="tbl-delete" (click)="deleteTable(t.table_name, $event)" title="Delete">
              <mat-icon>delete_outline</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Data panel -->
      <div class="data-panel">
        <div *ngIf="!selectedTable" class="no-selection">
          <mat-icon>arrow_back</mat-icon>
          <p>Select a table to view its data</p>
        </div>
        <app-data-editor
          *ngIf="selectedTable"
          [projectId]="projectId"
          [apiKey]="apiKey"
          [tableName]="selectedTable"
          [tableSchema]="selectedSchema"
        ></app-data-editor>
      </div>
    </div>
  `,
  styles: [`
    .tables-layout { display: flex; gap: 0; height: calc(100vh - 60px); margin: -32px; }

    /* Table list panel */
    .tables-panel { width: 220px; flex-shrink: 0; border-right: 1px solid #1f2937; display: flex; flex-direction: column; background: #0a0f1e; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 8px; }
    .panel-title { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; }
    .add-btn mat-icon { font-size: 18px; color: #6b7280; }
    .add-btn:hover mat-icon { color: #6366f1; }
    .panel-loading { display: flex; justify-content: center; padding: 24px; }
    .panel-empty { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; color: #374151; text-align: center; }
    .panel-empty mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 8px; }
    .panel-empty p { font-size: 13px; color: #6b7280; margin: 0 0 12px; }
    .table-list { flex: 1; overflow-y: auto; padding: 4px 8px; }
    .table-item {
      display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px;
      cursor: pointer; transition: all 0.15s; color: #9ca3af;
    }
    .table-item:hover { background: #111827; color: #d1d5db; }
    .table-item.active { background: rgba(99,102,241,0.1); color: #a5b4fc; }
    .tbl-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    .table-item.active .tbl-icon { color: #6366f1; }
    .tbl-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .tbl-name { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tbl-rows { font-size: 11px; color: #4b5563; }
    .tbl-delete { width: 28px !important; height: 28px !important; opacity: 0; transition: opacity 0.15s; }
    .tbl-delete mat-icon { font-size: 14px !important; color: #6b7280 !important; }
    .table-item:hover .tbl-delete { opacity: 1; }

    /* Data panel */
    .data-panel { flex: 1; overflow: hidden; }
    .no-selection { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #374151; gap: 12px; }
    .no-selection mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .no-selection p { font-size: 14px; color: #6b7280; margin: 0; }
  `]
})
export class TablesComponent implements OnInit {
  @Input() projectId!: string;
  @Input() apiKey!: string;

  tables: TableListItem[] = [];
  loading = true;
  selectedTable: string | null = null;
  selectedSchema: ProjectTable | null = null;

  constructor(private tableService: TableService, private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.loadTables(); }

  loadTables(): void {
    this.loading = true;
    this.tableService.list(this.projectId).subscribe({
      next: t => { this.tables = t; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  selectTable(name: string): void {
    this.selectedTable = name;
    this.tableService.get(this.projectId, name).subscribe(s => { this.selectedSchema = s; });
  }

  openNewTable(): void {
    const ref = this.dialog.open(NewTableDialogComponent, { width: '560px', panelClass: 'dark-dialog' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.tableService.create(this.projectId, result.name, result.columns).subscribe({
          next: () => { this.snackBar.open(`Table "${result.name}" created`, '', { duration: 3000 }); this.loadTables(); },
          error: err => this.snackBar.open(err.error?.detail || 'Failed', '', { duration: 3000 }),
        });
      }
    });
  }

  deleteTable(name: string, e: Event): void {
    e.stopPropagation();
    if (!confirm(`Delete table "${name}"? All data will be lost.`)) return;
    this.tableService.delete(this.projectId, name).subscribe({
      next: () => {
        this.snackBar.open('Table deleted', '', { duration: 3000 });
        if (this.selectedTable === name) { this.selectedTable = null; this.selectedSchema = null; }
        this.loadTables();
      },
    });
  }
}
