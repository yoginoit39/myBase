import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from '../../../core/services/data.service';
import { ProjectTable } from '../../../core/models/interfaces';
import { RowDialogComponent } from './row-dialog.component';

@Component({
  selector: 'app-data-editor',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule],
  template: `
    <div class="editor">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <span class="table-name-badge">{{ tableName }}</span>
          <span class="row-badge">{{ rows.length }} rows</span>
        </div>
        <div class="toolbar-right">
          <button mat-button (click)="loadRows()" class="refresh-btn">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
          <button mat-raised-button color="primary" (click)="openAddRow()" class="insert-btn">
            <mat-icon>add</mat-icon> Insert row
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="editor-loading"><mat-spinner diameter="28"></mat-spinner></div>

      <!-- Empty -->
      <div *ngIf="!loading && rows.length === 0" class="editor-empty">
        <mat-icon>inbox</mat-icon>
        <p>No rows yet</p>
        <button mat-stroked-button (click)="openAddRow()">Insert your first row</button>
      </div>

      <!-- Table -->
      <div class="table-wrap" *ngIf="!loading && rows.length > 0">
        <table mat-table [dataSource]="rows">
          <ng-container *ngFor="let col of displayedColumns" [matColumnDef]="col">
            <th mat-header-cell *matHeaderCellDef>{{ col }}</th>
            <td mat-cell *matCellDef="let row">
              <span class="cell-val" [matTooltip]="stringify(row[col])" matTooltipPosition="above">
                {{ formatCell(row[col]) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="__actions">
            <th mat-header-cell *matHeaderCellDef class="actions-col"></th>
            <td mat-cell *matCellDef="let row" class="actions-col">
              <div class="row-actions">
                <button mat-icon-button (click)="openEditRow(row)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="deleteRow(row.id)" matTooltip="Delete" class="delete-row-btn">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="allColumns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: allColumns;"></tr>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!loading && rows.length > 0">
        <span class="page-info">Page {{ page + 1 }} · {{ rows.length }} rows</span>
        <div class="page-btns">
          <button mat-icon-button [disabled]="offset === 0" (click)="prevPage()">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button mat-icon-button [disabled]="rows.length < limit" (click)="nextPage()">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editor { display: flex; flex-direction: column; height: 100%; background: #0a0f1e; }

    .editor-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; border-bottom: 1px solid #1f2937; background: #0d1526; flex-shrink: 0;
    }
    .toolbar-left { display: flex; align-items: center; gap: 10px; }
    .table-name-badge { font-family: monospace; font-size: 14px; font-weight: 600; color: #a5b4fc; background: rgba(99,102,241,0.1); padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(99,102,241,0.2); }
    .row-badge { font-size: 12px; color: #4b5563; }
    .toolbar-right { display: flex; align-items: center; gap: 8px; }
    .refresh-btn { border-radius: 8px !important; font-size: 13px; color: #6b7280 !important; }
    .insert-btn { height: 34px; border-radius: 8px !important; font-size: 13px; }

    .editor-loading { display: flex; justify-content: center; align-items: center; flex: 1; }
    .editor-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: #374151; gap: 10px; }
    .editor-empty mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .editor-empty p { color: #6b7280; margin: 0; font-size: 14px; }

    .table-wrap { flex: 1; overflow: auto; }
    table { width: 100%; }
    .cell-val { display: block; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; font-size: 12px; }
    .actions-col { width: 80px; }
    .row-actions { display: flex; opacity: 0; transition: opacity 0.15s; }
    tr:hover .row-actions { opacity: 1; }
    .row-actions button { width: 28px !important; height: 28px !important; }
    .row-actions mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .delete-row-btn mat-icon { color: #6b7280 !important; }
    .delete-row-btn:hover mat-icon { color: #ef4444 !important; }

    .pagination { display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; border-top: 1px solid #1f2937; background: #0d1526; flex-shrink: 0; }
    .page-info { font-size: 12px; color: #4b5563; }
    .page-btns { display: flex; }
  `]
})
export class DataEditorComponent implements OnChanges {
  @Input() projectId!: string;
  @Input() apiKey!: string;
  @Input() tableName!: string;
  @Input() tableSchema: ProjectTable | null = null;

  rows: any[] = [];
  loading = false;
  displayedColumns: string[] = [];
  allColumns: string[] = [];
  limit = 50;
  offset = 0;
  get page(): number { return Math.floor(this.offset / this.limit); }

  constructor(private dataService: DataService, private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableName'] && this.tableName) { this.offset = 0; this.loadRows(); }
  }

  loadRows(): void {
    this.loading = true;
    this.dataService.getRows(this.apiKey, this.tableName, { limit: String(this.limit), offset: String(this.offset) }).subscribe({
      next: rows => {
        this.rows = rows;
        if (rows.length > 0) {
          this.displayedColumns = Object.keys(rows[0]);
        } else if (this.tableSchema) {
          this.displayedColumns = ['id', 'created_at', 'updated_at', ...this.tableSchema.columns.map(c => c.name)];
        }
        this.allColumns = [...this.displayedColumns, '__actions'];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  openAddRow(): void {
    const ref = this.dialog.open(RowDialogComponent, { width: '500px', panelClass: 'dark-dialog', data: { schema: this.tableSchema, row: null } });
    ref.afterClosed().subscribe(data => {
      if (data) this.dataService.insertRow(this.apiKey, this.tableName, data).subscribe({ next: () => { this.snackBar.open('Row inserted', '', { duration: 2000 }); this.loadRows(); }, error: err => this.snackBar.open(err.error?.detail || 'Failed', '', { duration: 3000 }) });
    });
  }

  openEditRow(row: any): void {
    const ref = this.dialog.open(RowDialogComponent, { width: '500px', panelClass: 'dark-dialog', data: { schema: this.tableSchema, row } });
    ref.afterClosed().subscribe(data => {
      if (data) this.dataService.updateRow(this.apiKey, this.tableName, row.id, data).subscribe({ next: () => { this.snackBar.open('Row updated', '', { duration: 2000 }); this.loadRows(); } });
    });
  }

  deleteRow(id: number): void {
    if (!confirm('Delete this row?')) return;
    this.dataService.deleteRow(this.apiKey, this.tableName, id).subscribe({ next: () => { this.snackBar.open('Deleted', '', { duration: 2000 }); this.loadRows(); } });
  }

  formatCell(val: any): string {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    const s = String(val);
    return s.length > 40 ? s.slice(0, 40) + '…' : s;
  }

  stringify(val: any): string {
    if (val === null || val === undefined) return 'null';
    return typeof val === 'object' ? JSON.stringify(val) : String(val);
  }

  prevPage(): void { this.offset = Math.max(0, this.offset - this.limit); this.loadRows(); }
  nextPage(): void { this.offset += this.limit; this.loadRows(); }
}
