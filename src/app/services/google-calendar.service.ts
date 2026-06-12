import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private readonly accessTokenKey = 'google_calendar_access_token';
  private readonly refreshTokenKey = 'google_calendar_refresh_token';
  private readonly expiresAtKey = 'google_calendar_expires_at';
  private readonly codeVerifierKey = 'google_calendar_code_verifier';
  private readonly returnUrlKey = 'google_calendar_return_url';

  constructor(private http: HttpClient) {}

  async handleAuthCallback(): Promise<string | null> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    console.log('Google OAuth callback params:', { code, state });
    if (!code) {
      return null;
    }

    const codeVerifier = localStorage.getItem(this.codeVerifierKey);
    if (!codeVerifier) {
      console.error('Code verifier não encontrado para o fluxo OAuth.');
      return null;
    }

    try {
      const tokenResponse = await this.exchangeCodeForToken(code, codeVerifier);
      this.storeTokenResponse(tokenResponse);
      this.clearUrlParams();

      const storedReturnUrl = localStorage.getItem(this.returnUrlKey);
      if (state) {
        localStorage.removeItem(this.returnUrlKey);
      }

      return state ? state : storedReturnUrl;
    } catch (error: any) {
      console.error('Erro ao trocar código OAuth por token:', error, error?.error ?? error);
      return null;
    }
  }

  async authorize(returnUrl?: string): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    localStorage.setItem(this.codeVerifierKey, codeVerifier);

    const redirectUri = this.getRedirectUri();
    const paramsObj: any = {
      client_id: environment.googleCalendar.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: environment.googleCalendar.scope,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    };

    if (returnUrl) {
      paramsObj.state = returnUrl;
      localStorage.setItem(this.returnUrlKey, returnUrl);
    }

    const params = new HttpParams({ fromObject: paramsObj });
    const authUrl = `${environment.googleCalendar.authEndpoint}?${params.toString()}`;
    console.log('Google OAuth authorize URL:', authUrl);
    console.log('Google OAuth redirect URI:', redirectUri);
    window.location.href = authUrl;
  }

  async ensureAuthorized(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async createEvent(event: any): Promise<any> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Google Agenda não autorizada.');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    const params = new HttpParams().set('sendUpdates', 'all');

    return firstValueFrom(this.http.post(
      `${environment.googleCalendar.apiBaseUrl}/calendars/primary/events`,
      event,
      { headers, params }
    ));
  }

  async listUpcomingEvents(maxResults = 10): Promise<any> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Google Agenda não autorizada.');
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
    const params = new HttpParams()
      .set('maxResults', maxResults)
      .set('orderBy', 'startTime')
      .set('singleEvents', 'true')
      .set('timeMin', new Date().toISOString());

    return firstValueFrom(this.http.get(
      `${environment.googleCalendar.apiBaseUrl}/calendars/primary/events`,
      { headers, params }
    ));
  }

  private async getAccessToken(): Promise<string | null> {
    const accessToken = localStorage.getItem(this.accessTokenKey);
    const expiresAt = Number(localStorage.getItem(this.expiresAtKey) || '0');

    if (accessToken && expiresAt > Date.now() + 60000) {
      return accessToken;
    }

    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      return null;
    }

    try {
      const refreshResponse = await this.refreshAccessToken(refreshToken);
      this.storeTokenResponse(refreshResponse);
      return refreshResponse.access_token;
    } catch (error) {
      console.error('Erro ao atualizar token de acesso:', error);
      return null;
    }
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<GoogleTokenResponse> {
    const redirectUri = this.getRedirectUri();
    const paramsObj: any = {
      client_id: environment.googleCalendar.clientId,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri
    };

    const body = new HttpParams({ fromObject: paramsObj });
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return firstValueFrom(this.http.post<GoogleTokenResponse>(environment.googleCalendar.tokenEndpoint, body.toString(), { headers }));
  }

  private async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const paramsObj: any = {
      client_id: environment.googleCalendar.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };

    const body = new HttpParams({ fromObject: paramsObj });
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return firstValueFrom(this.http.post<GoogleTokenResponse>(environment.googleCalendar.tokenEndpoint, body.toString(), { headers }));
  }

  private storeTokenResponse(response: GoogleTokenResponse): void {
    localStorage.setItem(this.accessTokenKey, response.access_token);
    if (response.refresh_token) {
      localStorage.setItem(this.refreshTokenKey, response.refresh_token);
    }
    localStorage.setItem(this.expiresAtKey, String(Date.now() + response.expires_in * 1000));
  }

  private clearUrlParams(): void {
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(64);
    window.crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    const string = String.fromCharCode(...buffer);
    const base64 = btoa(string);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private getRedirectUri(): string {
    const runtimeRedirectUri = `${window.location.origin}/google-oauth-callback`;
    if (!environment.googleCalendar.redirectUri) {
      return runtimeRedirectUri;
    }

    if (environment.googleCalendar.redirectUri.startsWith(window.location.origin)) {
      return environment.googleCalendar.redirectUri;
    }

    console.warn(
      'Google redirectUri configurado não corresponde ao origin atual. Usando redirect URI de runtime:',
      runtimeRedirectUri,
      'configurado:', environment.googleCalendar.redirectUri
    );

    return runtimeRedirectUri;
  }
}
