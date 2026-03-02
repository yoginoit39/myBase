import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="page">
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="logo-icon">⬡</span>
            <span class="logo-text">MyBase</span>
          </div>
          <h1 class="brand-headline">Build faster with<br><span class="highlight">your own backend.</span></h1>
          <p class="brand-sub">Open-source alternative to Supabase — own your data, own your stack.</p>
          <div class="stats">
            <div class="stat"><span class="stat-val">10 GB</span><span class="stat-label">Free storage</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><span class="stat-val">∞</span><span class="stat-label">Projects</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><span class="stat-val">100%</span><span class="stat-label">Yours</span></div>
          </div>
        </div>
        <div class="orb orb1"></div>
        <div class="orb orb2"></div>
      </div>

      <div class="form-panel">
        <div class="form-card">
          <div class="form-header">
            <h2>Create your account</h2>
            <p>Free forever. No credit card required.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field-group">
              <label>Email address</label>
              <mat-form-field appearance="outline" class="full-width">
                <input matInput type="email" formControlName="email" placeholder="you@example.com">
              </mat-form-field>
            </div>

            <div class="field-group">
              <label>Password</label>
              <mat-form-field appearance="outline" class="full-width">
                <input matInput [type]="showPass ? 'text' : 'password'" formControlName="password" placeholder="Min. 8 characters">
                <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                  <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
            </div>

            <div class="password-strength" *ngIf="form.get('password')?.value">
              <div class="strength-bar">
                <div class="strength-fill" [style.width]="strengthWidth" [style.background]="strengthColor"></div>
              </div>
              <span class="strength-label" [style.color]="strengthColor">{{ strengthLabel }}</span>
            </div>

            <div class="error-box" *ngIf="error">
              <mat-icon>error_outline</mat-icon>
              <span>{{ error }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="loading || form.invalid">
              <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
              <span *ngIf="!loading">Create free account</span>
            </button>
          </form>

          <p class="switch-link">Already have an account? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; min-height: 100vh; }
    .brand-panel {
      flex: 1; position: relative; overflow: hidden;
      background: linear-gradient(135deg, #0d0f2d 0%, #1a0533 50%, #0d0f2d 100%);
      display: flex; align-items: center; justify-content: center; padding: 60px;
    }
    .brand-content { position: relative; z-index: 2; max-width: 460px; }
    .brand-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 48px; }
    .logo-icon { font-size: 28px; }
    .logo-text { font-size: 24px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.5px; }
    .brand-headline { font-size: 42px; font-weight: 700; color: #f1f5f9; line-height: 1.25; margin: 0 0 20px; letter-spacing: -1px; }
    .highlight { background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .brand-sub { font-size: 16px; color: #9ca3af; line-height: 1.6; margin: 0 0 40px; }
    .stats { display: flex; align-items: center; gap: 24px; }
    .stat { display: flex; flex-direction: column; gap: 4px; }
    .stat-val { font-size: 28px; font-weight: 700; color: #f1f5f9; letter-spacing: -1px; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-divider { width: 1px; height: 40px; background: #1f2937; }
    .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; }
    .orb1 { width: 400px; height: 400px; background: #6366f1; top: -100px; right: -100px; }
    .orb2 { width: 300px; height: 300px; background: #8b5cf6; bottom: -50px; left: -80px; }
    .form-panel { width: 480px; display: flex; align-items: center; justify-content: center; background: #0a0f1e; padding: 48px 40px; }
    .form-card { width: 100%; max-width: 380px; }
    .form-header { margin-bottom: 32px; }
    .form-header h2 { font-size: 26px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px; letter-spacing: -0.5px; }
    .form-header p { color: #6b7280; font-size: 14px; margin: 0; }
    .field-group { margin-bottom: 4px; }
    .field-group label { display: block; font-size: 13px; font-weight: 500; color: #9ca3af; margin-bottom: 6px; }
    .full-width { width: 100%; }
    .password-strength { display: flex; align-items: center; gap: 10px; margin: -8px 0 12px; }
    .strength-bar { flex: 1; height: 3px; background: #1f2937; border-radius: 99px; overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 99px; transition: all 0.3s; }
    .strength-label { font-size: 11px; font-weight: 500; white-space: nowrap; }
    .error-box { display: flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 10px 14px; color: #fca5a5; font-size: 13px; margin-bottom: 16px; }
    .error-box mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .submit-btn { width: 100%; height: 48px; margin-top: 8px; font-size: 15px; border-radius: 12px !important; }
    .switch-link { text-align: center; margin-top: 24px; color: #6b7280; font-size: 14px; }
    .switch-link a { color: #6366f1; text-decoration: none; font-weight: 500; }
    @media (max-width: 768px) { .brand-panel { display: none; } .form-panel { width: 100%; padding: 32px 24px; } }
  `]
})
export class RegisterComponent {
  form: ReturnType<FormBuilder['group']>;
  loading = false;
  error = '';
  showPass = false;

  get strengthWidth(): string {
    const p = this.form.get('password')?.value || '';
    if (p.length < 6) return '25%';
    if (p.length < 10) return '60%';
    return '100%';
  }
  get strengthColor(): string {
    const p = this.form.get('password')?.value || '';
    if (p.length < 6) return '#ef4444';
    if (p.length < 10) return '#f59e0b';
    return '#10b981';
  }
  get strengthLabel(): string {
    const p = this.form.get('password')?.value || '';
    if (p.length < 6) return 'Weak';
    if (p.length < 10) return 'Fair';
    return 'Strong';
  }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.register(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => { this.error = err.error?.detail || 'Registration failed'; this.loading = false; },
    });
  }
}
