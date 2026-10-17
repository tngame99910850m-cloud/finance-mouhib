"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  error: Error | null;
}

/** Catches errors thrown by suspending loaders (e.g. useGLTF on a missing
 * file) so a broken/missing asset shows a useful message instead of
 * crashing the whole page. */
export class ThreeErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[AvatarViewer] 3D asset failed to load:", error.message);
    this.props.onError?.(error);
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.retry);
    return this.props.children;
  }
}
