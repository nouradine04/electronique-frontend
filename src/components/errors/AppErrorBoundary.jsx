import React from 'react';
import { AppErrorPage } from './AppErrorPage';
export class AppErrorBoundary extends React.Component {
  state = { failed: false, connection: false };
  static getDerivedStateFromError(error) { return { failed: true, connection: /Failed to fetch dynamically imported|Loading chunk|Importing a module script failed/i.test(error.message || '') }; }
  render() {
    return this.state.failed ? <AppErrorPage kind={this.state.connection ? 'connection' : 'unexpected'} onRetry={() => window.location.reload()} /> : this.props.children;
  }
}
