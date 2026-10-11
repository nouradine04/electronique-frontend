import React from 'react';
import { AppErrorPage } from './AppErrorPage';
export class AppErrorBoundary extends React.Component {
  state = { failed: false, connection: false, session: false };
  static getDerivedStateFromError(error) { return { failed: true, connection: /Failed to fetch dynamically imported|Loading chunk|Importing a module script failed/i.test(error.message || ''), session: error?.status === 401 || error?.status === 403 || error?.name === 'SessionError' }; }
  componentDidCatch(error) { console.error('[NStock] Erreur d’affichage', { name: error?.name, status: error?.status, message: error?.message }); }
  render() {
    return this.state.failed ? <AppErrorPage kind={this.state.connection ? 'connection' : 'unexpected'} detail={this.state.session ? 'Votre session ou vos droits doivent être vérifiés. Reconnectez-vous à votre compte.' : undefined} onRetry={() => window.location.reload()} /> : this.props.children;
  }
}
