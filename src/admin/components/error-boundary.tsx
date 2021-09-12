import React from 'react';
import { MessageBar, MessageBarType } from '@fluentui/react';

export interface IErrorBoundaryProps {
  message?: string;
};

class ErrorBoundary extends React.Component<IErrorBoundaryProps> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(errorInfo);
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return <MessageBar messageBarType={MessageBarType.error}>
        {this.props?.message || 'Error!, please check console for more details.'}
      </MessageBar>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
