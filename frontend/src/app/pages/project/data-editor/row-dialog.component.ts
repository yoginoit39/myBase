import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ProjectTable } from '../../../core/models/interfaces';

@Component({
  selector: 'app-row-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.row ? 'Edit Row' : 'Insert Row' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div *ngFor="let col of columns">
          <mat-form-field appearance="outline" class="full-width" *ngIf="col.type !== 'boolean'">
            <mat-label>{{ col.name }} <em style="color:#64748b">({{ col.type }})</em></mat-label>
            <input matInput [formControlName]="col.name" [placeholder]="col.type">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" *ngIf="col.type === 'boolean'">
            <mat-label>{{ col.name }}</mat-label>
            <mat-select [formControlName]="col.name">
              <mat-option [value]="1">true</mat-option>
              <mat-option [value]="0">false</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <p *ngIf="columns.length === 0" style="color:#94a3b8">This table has no custom columns.</p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">{{ data.row ? 'Save' : 'Insert' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 8px; }`]
})
export class RowDialogComponent {
  form: FormGroup;
  columns: any[] = [];

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<RowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { schema: ProjectTable | null; row: any }
  ) {
    this.columns = data.schema?.columns ?? [];
    const controls: Record<string, any> = {};
    for (const col of this.columns) {
      controls[col.name] = [data.row ? data.row[col.name] ?? '' : ''];
    }
    this.form = this.fb.group(controls);
  }

  submit(): void {
    const raw = this.form.value;
    const result: Record<string, any> = {};
    for (const col of this.columns) {
      const v = raw[col.name];
      if (v === '' || v === null || v === undefined) continue;
      if (col.type === 'integer') result[col.name] = parseInt(v, 10);
      else if (col.type === 'float') result[col.name] = parseFloat(v);
      else result[col.name] = v;
    }
    this.ref.close(result);
  }
}
