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
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');
      
      console.log('Google OAuth callback params:', { code, state, errorParam });

      // Verificar se houve erro de autorização
      if (errorParam) {
        const errorDescription = params.get('error_description') || 'Autorização negada';
        console.error('Erro de autorização do Google:', errorParam, errorDescription);
        throw new Error(`Autorização negada: ${errorDescription}`);
      }

      if (!code) {
        console.debug('Google OAuth callback sem código de autorização; não estamos na rota de callback.');
        return null;
      }

      const codeVerifier = localStorage.getItem(this.codeVerifierKey);
      if (!codeVerifier) {
        console.error('Code verifier não encontrado para o fluxo OAuth.');
        throw new Error('Sessão expirada. Tente novamente.');
      }

      const tokenResponse = await this.exchangeCodeForToken(code, codeVerifier);
      this.storeTokenResponse(tokenResponse);
      this.clearUrlParams();
      
      // Limpar dados temporários
      localStorage.removeItem(this.codeVerifierKey);
      
      const storedReturnUrl = localStorage.getItem(this.returnUrlKey);
      if (state) {
        localStorage.removeItem(this.returnUrlKey);
      }

      console.log('Autenticação concluída com sucesso');
      return state ? state : storedReturnUrl;
    } catch (error: any) {
      console.error('Erro ao processar callback do Google OAuth:', error);
      throw error;
    }
  }

  async authorize(returnUrl?: string): Promise<void> {
    try {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      localStorage.setItem(this.codeVerifierKey, codeVerifier);

      const redirectUri = this.getRedirectUri();
      
      if (!environment.googleCalendar.clientId) {
        throw new Error('Client ID não configurado');
      }

      // Verificar se localhost está acessível
      if (redirectUri.includes('localhost')) {
        try {
          const response = await fetch(`${window.location.origin}/`, { method: 'HEAD' });
          console.log('✓ Servidor acessível em:', window.location.origin);
        } catch (e) {
          console.error('✗ ERRO: Servidor de desenvolvimento não está respondendo em', window.location.origin);
          console.error('✗ Abra um terminal e execute: npm start');
          throw new Error(`Servidor não acessível: ${window.location.origin}. Inicie com: npm start`);
        }
      }

      const paramsObj: any = {
        client_id: environment.googleCalendar.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: environment.googleCalendar.scope,
        access_type: 'offline',
        prompt: 'select_account',
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
      
      console.log('✓ Iniciando autorização do Google Calendar');
      console.log('  Client ID:', environment.googleCalendar.clientId);
      console.log('  Redirect URI:', redirectUri);
      console.log('  Scope:', environment.googleCalendar.scope);
      
      // Salvar diagnóstico para debug
      sessionStorage.setItem('google_auth_debug', JSON.stringify({
        timestamp: new Date().toISOString(),
        redirectUri,
        authUrl: authUrl.substring(0, 100) + '...'
      }));
      
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('✗ Erro ao preparar autorização:', error?.message || error);
      throw error;
    }
  }

  async ensureAuthorized(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.expiresAtKey);
    localStorage.removeItem(this.codeVerifierKey);
    localStorage.removeItem(this.returnUrlKey);
    console.log('Logout do Google Calendar concluído');
  }

  async createEvent(event: any): Promise<any> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Google Agenda não autorizada. Faça login novamente.');
    }

    if (!event.summary || !event.start || !event.end) {
      throw new Error('Evento inválido. Campos obrigatórios: summary, start, end');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const params = new HttpParams().set('sendUpdates', 'all');

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${environment.googleCalendar.apiBaseUrl}/calendars/primary/events`,
          event,
          { headers, params }
        )
      );
      console.log('Evento criado no Google Calendar:', response);
      return response;
    } catch (error: any) {
      const errorMessage = error?.error?.error?.message || error?.error?.error || 'Erro desconhecido';
      const status = error?.status;
      
      console.error('Erro ao criar evento no Google Calendar:', status, errorMessage);
      
      if (status === 401) {
        throw new Error('Token inválido ou expirado. Faça login novamente no Google Agenda.');
      } else if (status === 403) {
        throw new Error('Permissão negada. Verifique os escopos de acesso.');
      } else if (status === 400) {
        throw new Error(`Requisição inválida: ${errorMessage}`);
      }
      
      throw new Error(`Erro ao criar evento: ${errorMessage}`);
    }
  }

  async listUpcomingEvents(maxResults = 10): Promise<any> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Google Agenda não autorizada. Faça login novamente.');
    }

    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    });
    
    const params = new HttpParams()
      .set('maxResults', maxResults.toString())
      .set('orderBy', 'startTime')
      .set('singleEvents', 'true')
      .set('timeMin', new Date().toISOString());

    try {
      const response = await firstValueFrom(
        this.http.get(
          `${environment.googleCalendar.apiBaseUrl}/calendars/primary/events`,
          { headers, params }
        )
      );
      console.log('Eventos obtidos do Google Calendar:', response);
      return response;
    } catch (error: any) {
      const errorMessage = error?.error?.error?.message || error?.error?.error || 'Erro desconhecido';
      const status = error?.status;
      
      console.error('Erro ao listar eventos:', status, errorMessage);
      
      if (status === 401) {
        throw new Error('Token inválido ou expirado. Faça login novamente.');
      }
      
      throw new Error(`Erro ao listar eventos: ${errorMessage}`);
    }
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      const accessToken = localStorage.getItem(this.accessTokenKey);
      const expiresAt = Number(localStorage.getItem(this.expiresAtKey) || '0');

      // Verificar se token ainda é válido (com margem de 60 segundos)
      if (accessToken && expiresAt > Date.now() + 60000) {
        console.log('Usando token de acesso em cache');
        return accessToken;
      }

      const refreshToken = localStorage.getItem(this.refreshTokenKey);
      if (!refreshToken) {
        console.warn('Nenhum token de atualização disponível');
        return null;
      }

      console.log('Token expirado ou não disponível. Atualizando...');
      const refreshResponse = await this.refreshAccessToken(refreshToken);
      this.storeTokenResponse(refreshResponse);
      return refreshResponse.access_token;
    } catch (error) {
      console.error('Erro ao obter token de acesso:', error);
      return null;
    }
  }

  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<GoogleTokenResponse> {
    const redirectUri = this.getRedirectUri();
    
    if (!code || !codeVerifier) {
      throw new Error('Código de autorização ou verificador de código inválido.');
    }

    const paramsObj: any = {
      client_id: environment.googleCalendar.clientId,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri
    };

    // Incluir client_secret se disponível (para ambiente de produção com backend seguro)
    if (environment.googleCalendar.clientSecret && !environment.production) {
      paramsObj.client_secret = environment.googleCalendar.clientSecret;
    }

    const body = new HttpParams({ fromObject: paramsObj });
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });

    try {
      const response = await firstValueFrom(
        this.http.post<GoogleTokenResponse>(
          environment.googleCalendar.tokenEndpoint, 
          body.toString(), 
          { headers }
        )
      );
      console.log('Token obtido com sucesso');
      return response;
    } catch (error: any) {
      const errorMessage = error?.error?.error_description || error?.error?.error || 'Erro desconhecido';
      console.error('Erro ao trocar código por token:', error?.status, errorMessage);
      throw new Error(`Falha ao obter token: ${errorMessage}`);
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    if (!refreshToken) {
      throw new Error('Token de atualização não disponível.');
    }

    const paramsObj: any = {
      client_id: environment.googleCalendar.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };

    // Incluir client_secret se disponível
    if (environment.googleCalendar.clientSecret && !environment.production) {
      paramsObj.client_secret = environment.googleCalendar.clientSecret;
    }

    const body = new HttpParams({ fromObject: paramsObj });
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });

    try {
      const response = await firstValueFrom(
        this.http.post<GoogleTokenResponse>(
          environment.googleCalendar.tokenEndpoint, 
          body.toString(), 
          { headers }
        )
      );
      console.log('Token atualizado com sucesso');
      return response;
    } catch (error: any) {
      const errorMessage = error?.error?.error_description || error?.error?.error || 'Erro desconhecido';
      console.error('Erro ao atualizar token:', error?.status, errorMessage);
      
      // Limpar tokens inválidos
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.expiresAtKey);
      
      throw new Error(`Falha ao atualizar token: ${errorMessage}`);
    }
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
    // Sempre usar a URL configurada em environment para garantir consistência
    if (environment.googleCalendar.redirectUri && environment.googleCalendar.redirectUri !== 'https://YOUR_PRODUCTION_URL') {
      const uri = environment.googleCalendar.redirectUri;
      console.log('📍 Usando Redirect URI configurado:', uri);
      return uri;
    }

    // Fallback para o origin atual
    const runtimeRedirectUri = `${window.location.origin}/google-oauth-callback`;
    console.log('📍 Usando Redirect URI em runtime:', runtimeRedirectUri);
    
    return runtimeRedirectUri;
  }
}
