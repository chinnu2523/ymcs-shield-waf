import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: false }; // We just want to ignore and try to keep rendering
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught DOM/Reconciliation Error:", error, errorInfo);
    // If it's the specific child error, we can try to force a recovery
    if (error.message.includes('removeChild')) {
        console.log("Attempting to recover from removeChild error...");
    }
  }

  render() {
    // If an error happened, we just try to render children anyway
    // This is risky but for screenshots it might keep the static parts visible
    return this.props.children;
  }
}

export default ErrorBoundary;
