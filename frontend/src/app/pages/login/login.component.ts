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
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="page">
      <!-- Left branding panel -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="logo-icon">⬡</span>
            <span class="logo-text">MyBase</span>
          </div>
          <h1 class="brand-headline">Your own backend,<br><span class="highlight">fully in your control.</span></h1>
          <p class="brand-sub">Databases, APIs, storage and auth — all in one platform you own.</p>
          <div class="features">
            <div class="feature" *ngFor="let f of features">
              <span class="feature-icon">{{ f.icon }}</span>
              <span>{{ f.text }}</span>
            </div>
          </div>
        </div>
        <div class="orb orb1"></div>
        <div class="orb orb2"></div>
      </div>

      <!-- Right form panel -->
      <div class="form-panel">
        <div class="form-card">
          <div class="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your MyBase account</p>
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
                <input matInput [type]="showPass ? 'text' : 'password'" formControlName="password" placeholder="••••••••">
                <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                  <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
            </div>

            <div class="error-box" *ngIf="error">
              <mat-icon>error_outline</mat-icon>
              <span>{{ error }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="loading || form.invalid">
              <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
              <span *ngIf="!loading">Sign in</span>
            </button>
          </form>

          <div class="divider"><span>or</span></div>

          <button class="github-btn" type="button" (click)="loginWithGithub()">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            Continue with GitHub
          </button>

          <p class="switch-link">Don't have an account? <a routerLink="/register">Create one free</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; min-height: 100vh; }

    /* Brand panel */
    .brand-panel {
      flex: 1; position: relative; overflow: hidden;
      background: linear-gradient(135deg, #0d0f2d 0%, #1a0533 50%, #0d0f2d 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 60px;
    }
    .brand-content { position: relative; z-index: 2; max-width: 460px; }
    .brand-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 48px; }
    .logo-icon { font-size: 28px; }
    .logo-text { font-size: 24px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.5px; }
    .brand-headline { font-size: 42px; font-weight: 700; color: #f1f5f9; line-height: 1.25; margin: 0 0 20px; letter-spacing: -1px; }
    .highlight { background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .brand-sub { font-size: 16px; color: #9ca3af; line-height: 1.6; margin: 0 0 40px; }
    .features { display: flex; flex-direction: column; gap: 14px; }
    .feature { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #d1d5db; }
    .feature-icon { font-size: 18px; }
    .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; }
    .orb1 { width: 400px; height: 400px; background: #6366f1; top: -100px; right: -100px; }
    .orb2 { width: 300px; height: 300px; background: #8b5cf6; bottom: -50px; left: -80px; }

    /* Form panel */
    .form-panel {
      width: 480px; display: flex; align-items: center; justify-content: center;
      background: #0a0f1e; padding: 48px 40px;
    }
    .form-card { width: 100%; max-width: 380px; }
    .form-header { margin-bottom: 32px; }
    .form-header h2 { font-size: 26px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px; letter-spacing: -0.5px; }
    .form-header p { color: #6b7280; font-size: 14px; margin: 0; }
    .field-group { margin-bottom: 4px; }
    .field-group label { display: block; font-size: 13px; font-weight: 500; color: #9ca3af; margin-bottom: 6px; }
    .full-width { width: 100%; }
    .error-box {
      display: flex; align-items: center; gap: 8px;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px; padding: 10px 14px;
      color: #fca5a5; font-size: 13px; margin-bottom: 16px;
    }
    .error-box mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .submit-btn { width: 100%; height: 48px; margin-top: 8px; font-size: 15px; border-radius: 12px !important; }
    .switch-link { text-align: center; margin-top: 24px; color: #6b7280; font-size: 14px; }
    .switch-link a { color: #6366f1; text-decoration: none; font-weight: 500; }
    .switch-link a:hover { color: #a78bfa; }
    .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 16px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #1f2937; }
    .divider span { font-size: 12px; color: #4b5563; }
    .github-btn {
      width: 100%; height: 44px; display: flex; align-items: center; justify-content: center; gap: 10px;
      background: #111827; border: 1px solid #374151; border-radius: 10px; color: #d1d5db;
      font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s;
    }
    .github-btn:hover { background: #1f2937; border-color: #4b5563; color: #f1f5f9; }

    @media (max-width: 768px) {
      .brand-panel { display: none; }
      .form-panel { width: 100%; padding: 32px 24px; }
    }
  `]
})
export class LoginComponent {
  form: ReturnType<FormBuilder['group']>;
  loading = false;
  error = '';
  showPass = false;

  features = [
    { icon: '🗄️', text: 'Instant PostgreSQL databases per project' },
    { icon: '🔑', text: 'JWT authentication out of the box' },
    { icon: '☁️', text: '10 GB free object storage with Cloudflare R2' },
    { icon: '⚡', text: 'Auto-generated REST API for every table' },
  ];

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  loginWithGithub(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => { this.error = err.error?.detail || 'Invalid email or password'; this.loading = false; },
    });
  }
}
