import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-new-table-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>New Table</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Table Name</mat-label>
          <input matInput formControlName="name" placeholder="users">
          <mat-hint>Use lowercase letters, numbers, and underscores only</mat-hint>
        </mat-form-field>

        <div class="columns-header">
          <h4>Columns</h4>
          <button mat-stroked-button type="button" (click)="addColumn()">
            <mat-icon>add</mat-icon> Add Column
          </button>
        </div>

        <div class="auto-columns">
          <span class="auto-col">id <em>(auto)</em></span>
          <span class="auto-col">created_at <em>(auto)</em></span>
          <span class="auto-col">updated_at <em>(auto)</em></span>
        </div>

        <div formArrayName="columns">
          <div *ngFor="let col of columns.controls; let i = index" [formGroupName]="i" class="column-row">
            <mat-form-field appearance="outline" class="col-name">
              <mat-label>Column Name</mat-label>
              <input matInput formControlName="name" placeholder="column_name">
            </mat-form-field>
            <mat-form-field appearance="outline" class="col-type">
              <mat-label>Type</mat-label>
              <mat-select formControlName="type">
                <mat-option value="text">text</mat-option>
                <mat-option value="integer">integer</mat-option>
                <mat-option value="float">float</mat-option>
                <mat-option value="boolean">boolean</mat-option>
                <mat-option value="datetime">datetime</mat-option>
                <mat-option value="json">json</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-checkbox formControlName="nullable" class="nullable-check">Nullable</mat-checkbox>
            <button mat-icon-button type="button" (click)="removeColumn(i)" color="warn">
              <mat-icon>remove_circle</mat-icon>
            </button>
          </div>
        </div>

        <p *ngIf="columns.length === 0" class="no-cols">No custom columns. Add columns above.</p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">Create Table</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 8px; }
    .columns-header { display: flex; justify-content: space-between; align-items: center; margin: 16px 0 8px; }
    h4 { color: #f1f5f9; margin: 0; }
    .auto-columns { display: flex; gap: 12px; margin-bottom: 12px; }
    .auto-col { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 4px 10px; font-size: 12px; color: #64748b; font-family: monospace; }
    .auto-col em { color: #475569; }
    .column-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .col-name { flex: 2; }
    .col-type { flex: 1.5; }
    .nullable-check { flex-shrink: 0; }
    .no-cols { color: #94a3b8; font-size: 13px; text-align: center; padding: 12px; }
  `]
})
export class NewTableDialogComponent {
  form: ReturnType<FormBuilder['group']>;

  get columns(): FormArray {
    return this.form.get('columns') as FormArray;
  }

  constructor(private fb: FormBuilder, private ref: MatDialogRef<NewTableDialogComponent>) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
      columns: this.fb.array([]),
    });
  }

  addColumn(): void {
    this.columns.push(this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
      type: ['text', Validators.required],
      nullable: [true],
    }));
  }

  removeColumn(i: number): void {
    this.columns.removeAt(i);
  }

  submit(): void {
    if (this.form.valid) {
      const val = this.form.value;
      this.ref.close({
        name: val.name,
        columns: val.columns,
      });
    }
  }
}
