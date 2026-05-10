'use client';

import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import React from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ChartErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Intentionally empty. The fallback UI is enough for chart failures.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[300px] items-center justify-center rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
          <div>
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p>⚠️ Not enough data to display chart</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}